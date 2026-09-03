'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  deleteNotification,
  clearAllNotifications,
} from '@/lib/employeeApi';

import api from '@/lib/axios';
import toast from 'react-hot-toast';

import {
  Palmtree,
  Calendar,
  Banknote,
  Star,
  BookOpen,
  Hand,
  FileText,
  CheckCircle,
  AlertTriangle,
  Briefcase,
  Bell,
  Check,
  Trash2,
  X,
} from 'lucide-react';

const TYPE_META = {
  LEAVE_APPLIED: {
    icon: <Palmtree size={20} color="#16a34a" />,
    bg: '#f0fdf4',
    color: '#16a34a',
  },

  LEAVE_APPROVED: {
    icon: <Palmtree size={20} color="#16a34a" />,
    bg: '#dcfce7',
    color: '#16a34a',
  },

  LEAVE_REJECTED: {
    icon: <Palmtree size={20} color="#dc2626" />,
    bg: '#fee2e2',
    color: '#dc2626',
  },

  LEAVE_CANCELLED: {
    icon: <Palmtree
      size={20}
      color="var(--text-secondary)"
    />,
    bg: '#f1f5f9',
    color: 'var(--text-secondary)',
  },

  ATTENDANCE_REMINDER: {
    icon: <Calendar size={20} color="#3b82f6" />,
    bg: '#eff6ff',
    color: '#3b82f6',
  },

  PAYROLL_GENERATED: {
    icon: <Banknote size={20} color="#ca8a04" />,
    bg: '#fef9c3',
    color: '#ca8a04',
  },

  PERFORMANCE_REVIEWED: {
    icon: <Star size={20} color="#4f46e5" />,
    bg: '#eef2ff',
    color: '#4f46e5',
  },

  TRAINING_ENROLLED: {
    icon: <BookOpen size={20} color="#3b82f6" />,
    bg: '#eff6ff',
    color: '#3b82f6',
  },

  TRAINING_COMPLETED: {
    icon: <BookOpen size={20} color="#16a34a" />,
    bg: '#dcfce7',
    color: '#16a34a',
  },

  ONBOARDING_INITIATED: {
    icon: <Hand size={20} color="#4f46e5" />,
    bg: '#eef2ff',
    color: '#4f46e5',
  },

  DOCUMENT_UPLOADED: {
    icon: <FileText size={20} color="#3b82f6" />,
    bg: '#eff6ff',
    color: '#3b82f6',
  },

  DOCUMENT_APPROVED: {
    icon: <CheckCircle size={20} color="#16a34a" />,
    bg: '#dcfce7',
    color: '#16a34a',
  },

  DOCUMENT_REJECTED: {
    icon: <AlertTriangle size={20} color="#dc2626" />,
    bg: '#fee2e2',
    color: '#dc2626',
  },

  CHECKLIST_COMPLETED: {
    icon: <CheckCircle size={20} color="#16a34a" />,
    bg: '#dcfce7',
    color: '#16a34a',
  },

  JOB_APPLICATION: {
    icon: <Briefcase size={20} color="#4f46e5" />,
    bg: '#eef2ff',
    color: '#4f46e5',
  },

  GENERAL: {
    icon: (
      <Bell
        size={20}
        color="var(--text-secondary)"
      />
    ),
    bg: '#f1f5f9',
    color: 'var(--text-secondary)',
  },
};

// Maps a notification's referenceType to the employee page it should open.
// Notifications whose referenceType isn't listed here simply won't navigate
// anywhere when clicked (they'll just be marked as read).
const REFERENCE_ROUTES = {
  LEAVE_REQUEST: '/employee/leave',
  OnboardingDocument: '/employee/onboarding/documents',
  Onboarding: '/employee/onboarding/checklist',
  PERFORMANCE: '/employee/performance',
  TRAINING: '/employee/training',
};

// Job details page expects a plain ?id= (matches the existing "View Details"
// button on the jobs list page), not the ?highlight= pattern the other
// pages use — so it's handled separately in handleNotificationClick below.
const JOB_POSTING_ROUTE = '/employee/jobs/details';

function getMeta(notification) {
  return (
    TYPE_META[notification.type] ||
    TYPE_META.GENERAL
  );
}

function formatTimeAgo(dateStr, now) {
  if (!dateStr) return '';

  const diff =
    now - new Date(dateStr).getTime();

  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;

  return `${days}d ago`;
}

export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] =
    useState([]);

  const [unreadCount, setUnreadCount] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [filter, setFilter] =
    useState('ALL');

  const [markingAll, setMarkingAll] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState(null);

  const [clearingAll, setClearingAll] =
    useState(false);

  const [showDeleteModal, setShowDeleteModal] =
    useState(false);

  const [showClearModal, setShowClearModal] =
    useState(false);

  const [notificationToDelete, setNotificationToDelete] =
    useState(null);

  const [page, setPage] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(0);

  const [now, setNow] =
    useState(() => Date.now());

  /*
   * Update "2m ago", "5m ago", etc.
   */
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  /*
   * Fetch notifications
   */
  const fetchNotifications = useCallback(
    async () => {
      setLoading(true);

      try {
        const [
          notifRes,
          unreadRes,
        ] = await Promise.allSettled([
          filter === 'UNREAD'
            ? api.get(
                `/api/notifications/unread?page=${page}&size=10`
              )
            : getMyNotifications(page, 10),

          getUnreadCount(),
        ]);

        /*
         * Notifications
         */
        if (
          notifRes.status === 'fulfilled'
        ) {
          const data =
            notifRes.value.data?.data;

          setNotifications(
            data?.content || []
          );

          setTotalPages(
            data?.totalPages || 0
          );
        }

        /*
         * Unread count
         */
        if (
          unreadRes.status === 'fulfilled'
        ) {
          setUnreadCount(
            unreadRes.value.data?.data || 0
          );
        }
      } catch (error) {
        console.error(
          'Failed to load notifications:',
          error
        );

        toast.error(
          'Failed to load notifications'
        );
      } finally {
        setLoading(false);
      }
    },
    [filter, page]
  );

  /*
   * Load notifications
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchNotifications]);

  /*
   * Mark one notification as read
   */
  const handleMarkRead = async (id) => {
    const notification =
      notifications.find(
        (n) => n.id === id
      );

    /*
     * Already read - do nothing
     */
    if (!notification || notification.isRead) {
      return;
    }

    /*
     * Optimistic UI update
     */
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, isRead: true }
          : n
      )
    );

    setUnreadCount((prev) =>
      Math.max(0, prev - 1)
    );

    try {
      await markNotificationRead(id);

      window.dispatchEvent(
        new Event('notificationsUpdated')
      );
    } catch (error) {
      console.error(
        'Failed to mark as read:',
        error
      );

      toast.error(
        'Failed to mark as read'
      );

      fetchNotifications();
    }
  };

  /*
   * Clicking anywhere on a notification row (except the action buttons,
   * which stop propagation) marks it as read and, if it points to a
   * leave/document/performance/training record, navigates there with
   * the record's id so the destination page can highlight it.
   */
  const handleNotificationClick = (n) => {
    if (!n.isRead) {
      handleMarkRead(n.id);
    }

    if (n.referenceId == null) return;

    // Job details page expects ?id=, every other page expects ?highlight=
    if (n.referenceType === 'JobPosting') {
      router.push(`/employee/jobs/details?id=${encodeURIComponent(n.referenceId)}`);
    }

    const path = REFERENCE_ROUTES[n.referenceType];
    if (path) {
      router.push(`${path}?highlight=${n.referenceId}`);
    }
  };

  /*
   * Mark all notifications as read
   */
  const handleMarkAllRead = async () => {
    setMarkingAll(true);

    try {
      await api.put(
        '/api/notifications/mark-all-read'
      );

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
        }))
      );

      setUnreadCount(0);

      toast.success(
        'All notifications marked as read!'
      );

      window.dispatchEvent(
        new Event('notificationsUpdated')
      );
    } catch (error) {
      console.error(
        'Failed to mark all as read:',
        error
      );

      toast.error(
        'Failed to mark all as read'
      );
    } finally {
      setMarkingAll(false);
    }
  };

  /*
   * Open delete confirmation
   */
  const openDeleteModal = (
    notification
  ) => {
    setNotificationToDelete(
      notification
    );

    setShowDeleteModal(true);
  };

  /*
   * Delete individual notification
   */
  const handleDelete = async () => {
    if (!notificationToDelete) {
      return;
    }

    const id =
      notificationToDelete.id;

    setDeletingId(id);

    try {
      await deleteNotification(id);

      /*
       * Update unread count
       * if deleted notification was unread.
       */
      if (
        !notificationToDelete.isRead
      ) {
        setUnreadCount((prev) =>
          Math.max(0, prev - 1)
        );
      }

      /*
       * Remove from UI immediately.
       */
      setNotifications((prev) =>
        prev.filter(
          (n) => n.id !== id
        )
      );

      /*
       * Close modal.
       */
      setShowDeleteModal(false);

      setNotificationToDelete(null);

      toast.success(
        'Notification deleted'
      );

      window.dispatchEvent(
        new Event('notificationsUpdated')
      );

      /*
       * If this was the last notification
       * on this page, reload pagination.
       */
      if (
        notifications.length === 1
      ) {
        if (page > 0) {
          setPage((prev) =>
            Math.max(0, prev - 1)
          );
        } else {
          await fetchNotifications();
        }
      } else {
        await fetchNotifications();
      }
    } catch (error) {
      console.error(
        'Failed to delete notification:',
        error
      );

      toast.error(
        error?.response?.data?.message ||
          'Failed to delete notification'
      );
    } finally {
      setDeletingId(null);
    }
  };

  /*
   * Open Clear All confirmation
   */
  const openClearAllModal = () => {
    if (
      notifications.length === 0
    ) {
      return;
    }

    setShowClearModal(true);
  };

  /*
   * Clear all notifications
   */
  const handleClearAll = async () => {
    setClearingAll(true);

    try {
      await clearAllNotifications();

      setNotifications([]);

      setUnreadCount(0);

      setTotalPages(0);

      setPage(0);

      setShowClearModal(false);

      toast.success(
        'All notifications cleared'
      );

      window.dispatchEvent(
        new Event('notificationsUpdated')
      );
    } catch (error) {
      console.error(
        'Failed to clear notifications:',
        error
      );

      toast.error(
        error?.response?.data?.message ||
          'Failed to clear notifications'
      );
    } finally {
      setClearingAll(false);
    }
  };

  return (
    <div>
      <style jsx global>{`

        .notifications-card {
          background: var(--card-bg) !important;
          border-color: var(--card-border) !important;
        }

        .notification-row {
          border-color: var(--card-border) !important;
        }

        .notification-row.read {
          background: var(--card-bg) !important;
        }

        .notification-row.unread {
          background: #f8faff !important;
        }

        .notification-row.unread:hover {
          background: #f0f4ff !important;
        }

        .notification-action-button,
        .notification-pagination-button {
          background: var(--card-bg) !important;
          border-color: var(--card-border) !important;
        }

        .dark .notifications-card {
          background: #171c24 !important;
          border-color: #2d3748 !important;
        }

        .dark .notification-row {
          border-color: #2d3748 !important;
        }

        .dark .notification-row.read {
          background: #171c24 !important;
        }

        .dark .notification-row.unread {
          background: #111827 !important;
        }

        .dark .notification-row.unread:hover {
          background: #1e293b !important;
        }

        .dark .notification-row.read:hover {
          background: #1b222c !important;
        }

        .dark .notification-title {
          color: #f1f5f9 !important;
        }

        .dark .notification-message {
          color: #cbd5e1 !important;
        }

        .dark .notification-time {
          color: #94a3b8 !important;
        }

        .dark .notification-action-button,
        .dark .notification-pagination-button {
          background: #0f172a !important;
          border-color: #334155 !important;
          color: #cbd5e1 !important;
        }

        .dark .notification-filter-inactive {
          color: #94a3b8 !important;
        }

        .dark .notification-empty-state {
          background: #171c24 !important;
          color: #94a3b8 !important;
        }

        .notification-delete-button {
          color: #dc2626;
          transition: all 0.15s ease;
        }

        .notification-delete-button:hover {
          background: #fef2f2 !important;
          border-color: #fecaca !important;
          color: #b91c1c !important;
        }

        .dark .notification-delete-button {
          color: #f87171;
        }

        .dark .notification-delete-button:hover {
          background: #450a0a !important;
          border-color: #7f1d1d !important;
          color: #fca5a5 !important;
        }

        .notification-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: rgba(0, 0, 0, 0.55);
          backdrop-filter: blur(4px);
        }

        .notification-modal {
          width: 100%;
          max-width: 430px;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
        }

        .notification-modal-title {
          color: var(--text-primary);
          font-size: 18px;
          font-weight: 800;
          margin: 0;
        }

        .notification-modal-text {
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.6;
        }

        .notification-modal-preview {
          background: var(--background);
          border: 1px solid var(--card-border);
          border-radius: 10px;
          padding: 12px;
        }

        .notification-modal-preview-title {
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 700;
        }

        .notification-modal-preview-message {
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.5;
          margin-top: 4px;
        }

        .notification-modal-cancel {
          padding: 9px 18px;
          border-radius: 9px;
          border: 1px solid var(--card-border);
          background: var(--card-bg);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .notification-modal-cancel:hover {
          opacity: 0.8;
        }

        .notification-modal-delete {
          padding: 9px 18px;
          border-radius: 9px;
          border: none;
          background: #dc2626;
          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .notification-modal-delete:hover {
          background: #b91c1c;
        }

        .notification-modal-delete:disabled,
        .notification-modal-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .notification-row {
            flex-wrap: wrap !important;
          }

          .notification-row > div:nth-child(2) {
            min-width: calc(100% - 60px);
          }

          .notification-row > div:last-child {
            width: 100%;
            margin-left: 60px;
          }
        }

      `}</style>

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
          gap: '20px',
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '4px',
              flexWrap: 'wrap',
            }}
          >
            <h1
              style={{
                fontSize: '24px',
                fontWeight: '800',
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              Notifications
            </h1>

            {unreadCount > 0 && (
              <span
                style={{
                  background: '#4f46e5',
                  color: 'white',
                  borderRadius: '20px',
                  padding: '3px 12px',
                  fontSize: '12px',
                  fontWeight: '700',
                }}
              >
                {unreadCount} unread
              </span>
            )}
          </div>

          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
            }}
          >
            Stay updated with your latest alerts
            and activities.
          </p>
        </div>

        {/* =====================================================
            HEADER BUTTONS
            ===================================================== */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >
          {/* Mark all as read */}

          {unreadCount > 0 && (
            <button
              className="notification-action-button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              style={{
                padding: '11px 20px',
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                border:
                  '1.5px solid var(--card-border)',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: markingAll
                  ? 'not-allowed'
                  : 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {markingAll ? (
                'Marking...'
              ) : (
                <>
                  <Check size={14} />
                  Mark all as read
                </>
              )}
            </button>
          )}

          {/* Clear All */}

          {notifications.length > 0 && (
            <button
              onClick={openClearAllModal}
              disabled={clearingAll}
              style={{
                padding: '11px 20px',
                background: '#fff1f2',
                color: '#dc2626',
                border:
                  '1.5px solid #fecdd3',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: clearingAll
                  ? 'not-allowed'
                  : 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Trash2 size={14} />

              {clearingAll
                ? 'Clearing...'
                : 'Clear All'}
            </button>
          )}
        </div>
      </div>

      {/* =====================================================
          FILTER
          ===================================================== */}

      <div
        className="notifications-card"
        style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '20px',
          background: 'var(--card-bg)',
          borderRadius: '12px',
          border: '1px solid var(--card-border)',
          padding: '6px',
          width: 'fit-content',
          boxShadow:
            '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        {['ALL', 'UNREAD'].map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(0);
            }}
            className={
              filter === f
                ? ''
                : 'notification-filter-inactive'
            }
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '700',
              background:
                filter === f
                  ? '#4f46e5'
                  : 'transparent',
              color:
                filter === f
                  ? 'white'
                  : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            {f === 'ALL'
              ? 'All Notifications'
              : `Unread${
                  unreadCount
                    ? ` (${unreadCount})`
                    : ''
                }`}
          </button>
        ))}
      </div>

      {/* =====================================================
          NOTIFICATION CARD
          ===================================================== */}

      <div
        className="notifications-card"
        style={{
          background: 'var(--card-bg)',
          borderRadius: '14px',
          border:
            '1px solid var(--card-border)',
          boxShadow:
            '0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Loading */}

        {loading ? (
          <div
            className="notification-empty-state"
            style={{
              padding: '70px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '14px',
            }}
          >
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          /* Empty */

          <div
            className="notification-empty-state"
            style={{
              padding: '80px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '14px',
              }}
            >
              <Bell
                size={44}
                strokeWidth={1.5}
              />
            </div>

            <div
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              {filter === 'UNREAD'
                ? "You're all caught up!"
                : 'No notifications yet'}
            </div>

            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
              }}
            >
              {filter === 'UNREAD'
                ? 'No unread notifications right now.'
                : 'Updates and alerts will appear here.'}
            </div>

            {filter === 'UNREAD' && (
              <button
                onClick={() => {
                  setFilter('ALL');
                  setPage(0);
                }}
                style={{
                  marginTop: '18px',
                  padding: '10px 22px',
                  background: '#1e3a5f',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                View all notifications
              </button>
            )}
          </div>
        ) : (
          <>
            {/* =================================================
                NOTIFICATION LIST
                ================================================= */}

            {notifications.map(
              (n, i) => {
                const meta = getMeta(n);
                const isNavigable = Boolean(
                  (REFERENCE_ROUTES[n.referenceType] || n.referenceType === 'JobPosting')
                  && n.referenceId != null
                );

                return (
                  <div
                    key={n.id}
                    className={`notification-row ${
                      n.isRead
                        ? 'read'
                        : 'unread'
                    }`}
                    onClick={() =>
                      handleNotificationClick(n)
                    }
                    style={{
                      display: 'flex',
                      gap: '16px',
                      alignItems:
                        'flex-start',
                      padding:
                        '18px 22px',
                      cursor:
                        isNavigable || !n.isRead
                          ? 'pointer'
                          : 'default',
                      borderTop:
                        i === 0
                          ? 'none'
                          : '1px solid var(--card-border)',
                      transition:
                        'background 0.15s',
                    }}
                  >
                    {/* =================================================
                        ICON
                        ================================================= */}

                    <div
                      style={{
                        width: '44px',
                        height: '44px',
                        flexShrink: 0,
                        borderRadius: '12px',
                        background:
                          meta.bg,
                        display: 'flex',
                        alignItems:
                          'center',
                        justifyContent:
                          'center',
                      }}
                    >
                      {meta.icon}
                    </div>

                    {/* =================================================
                        CONTENT
                        ================================================= */}

                    <div
                      style={{
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems:
                            'center',
                          gap: '8px',
                          marginBottom:
                            '4px',
                        }}
                      >
                        <span
                          className="notification-title"
                          style={{
                            fontSize: '15px',
                            fontWeight:
                              n.isRead
                                ? '600'
                                : '800',
                            color:
                              'var(--text-primary)',
                          }}
                        >
                          {n.title}
                        </span>

                        {!n.isRead && (
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius:
                                '50%',
                              background:
                                '#4f46e5',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>

                      <div
                        className="notification-message"
                        style={{
                          fontSize: '13px',
                          color:
                            'var(--text-secondary)',
                          lineHeight:
                            '1.5',
                          marginBottom:
                            '6px',
                        }}
                      >
                        {n.message}
                      </div>

                      <div
                        className="notification-time"
                        style={{
                          fontSize: '12px',
                          color:
                            'var(--text-muted)',
                        }}
                      >
                        {formatTimeAgo(
                          n.createdAt,
                          now
                        )}
                      </div>
                    </div>

                    {/* =================================================
                        ACTIONS

                        IMPORTANT:
                        This is INSIDE notifications.map()
                        so "n" exists here.
                        ================================================= */}

                    <div
                      style={{
                        display: 'flex',
                        alignItems:
                          'center',
                        gap: '8px',
                        flexShrink: 0,
                      }}
                    >
                      {/* Mark Read */}

                      {!n.isRead && (
                        <button
                          className="notification-action-button"
                          onClick={(e) => {
                            e.stopPropagation();

                            handleMarkRead(
                              n.id
                            );
                          }}
                          style={{
                            padding:
                              '7px 16px',
                            background:
                              'var(--card-bg)',
                            color:
                              '#4f46e5',
                            border:
                              '1.5px solid var(--card-border)',
                            borderRadius:
                              '8px',
                            fontSize:
                              '12px',
                            fontWeight:
                              '700',
                            cursor:
                              'pointer',
                            whiteSpace:
                              'nowrap',
                          }}
                        >
                          Mark read
                        </button>
                      )}

                      {/* Delete */}

                      <button
                        className="notification-delete-button"
                        onClick={(e) => {
                          e.stopPropagation();

                          openDeleteModal(
                            n
                          );
                        }}
                        disabled={
                          deletingId ===
                          n.id
                        }
                        title="Delete notification"
                        aria-label="Delete notification"
                        style={{
                          width: '34px',
                          height: '34px',
                          display: 'flex',
                          alignItems:
                            'center',
                          justifyContent:
                            'center',
                          borderRadius:
                            '8px',
                          border:
                            '1.5px solid var(--card-border)',
                          background:
                            'var(--card-bg)',
                          cursor:
                            deletingId ===
                            n.id
                              ? 'not-allowed'
                              : 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        {deletingId ===
                        n.id ? (
                          <span
                            style={{
                              fontSize:
                                '14px',
                            }}
                          >
                            ⏳
                          </span>
                        ) : (
                          <Trash2
                            size={16}
                          />
                        )}
                      </button>
                    </div>
                  </div>
                );
              }
            )}

            {/* =================================================
                PAGINATION
                ================================================= */}

            {totalPages > 1 && (
              <div
                style={{
                  padding:
                    '16px 20px',
                  display: 'flex',
                  justifyContent:
                    'center',
                  alignItems:
                    'center',
                  gap: '10px',
                  borderTop:
                    '1px solid var(--card-border)',
                }}
              >
                {/* Previous */}

                <button
                  className="notification-pagination-button"
                  onClick={() =>
                    setPage((p) =>
                      Math.max(
                        0,
                        p - 1
                      )
                    )
                  }
                  disabled={page === 0}
                  style={{
                    padding:
                      '7px 16px',
                    border:
                      '1.5px solid var(--card-border)',
                    borderRadius:
                      '8px',
                    fontSize:
                      '12px',
                    fontWeight:
                      '700',
                    color:
                      page === 0
                        ? 'var(--text-muted)'
                        : 'var(--text-primary)',
                    background:
                      'var(--card-bg)',
                    cursor:
                      page === 0
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  ← Prev
                </button>

                {/* Page */}

                <span
                  style={{
                    fontSize: '12px',
                    color:
                      'var(--text-secondary)',
                    fontWeight:
                      '600',
                  }}
                >
                  Page {page + 1} of{' '}
                  {totalPages}
                </span>

                {/* Next */}

                <button
                  className="notification-pagination-button"
                  onClick={() =>
                    setPage((p) =>
                      Math.min(
                        totalPages -
                          1,
                        p + 1
                      )
                    )
                  }
                  disabled={
                    page >=
                    totalPages - 1
                  }
                  style={{
                    padding:
                      '7px 16px',
                    border:
                      '1.5px solid var(--card-border)',
                    borderRadius:
                      '8px',
                    fontSize:
                      '12px',
                    fontWeight:
                      '700',
                    color:
                      page >=
                      totalPages - 1
                        ? 'var(--text-muted)'
                        : 'var(--text-primary)',
                    background:
                      'var(--card-bg)',
                    cursor:
                      page >=
                      totalPages - 1
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* =========================================================
          DELETE INDIVIDUAL NOTIFICATION MODAL
          ========================================================= */}

      {showDeleteModal &&
        notificationToDelete && (
          <div
            className="notification-modal-overlay"
            onClick={() => {
              if (
                deletingId === null
              ) {
                setShowDeleteModal(
                  false
                );

                setNotificationToDelete(
                  null
                );
              }
            }}
          >
            <div
              className="notification-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              {/* Modal header */}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems:
                    'center',
                  marginBottom:
                    '14px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius:
                        '10px',
                      background:
                        '#fee2e2',
                      display: 'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'center',
                      color:
                        '#dc2626',
                    }}
                  >
                    <Trash2
                      size={18}
                    />
                  </div>

                  <h2 className="notification-modal-title">
                    Delete Notification?
                  </h2>
                </div>

                <button
                  onClick={() => {
                    setShowDeleteModal(
                      false
                    );

                    setNotificationToDelete(
                      null
                    );
                  }}
                  disabled={
                    deletingId !==
                    null
                  }
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius:
                      '8px',
                    border: 'none',
                    background:
                      'transparent',
                    color:
                      'var(--text-secondary)',
                    cursor:
                      'pointer',
                    display: 'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                  }}
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Text */}

              <p className="notification-modal-text">
                Are you sure you want to
                delete this notification?
              </p>

              {/* Notification preview */}

              <div
                className="notification-modal-preview"
                style={{
                  marginTop: '16px',
                }}
              >
                <div className="notification-modal-preview-title">
                  {
                    notificationToDelete.title
                  }
                </div>

                {notificationToDelete.message && (
                  <div className="notification-modal-preview-message">
                    {
                      notificationToDelete.message
                    }
                  </div>
                )}
              </div>

              {/* Buttons */}

              <div
                style={{
                  display: 'flex',
                  justifyContent:
                    'flex-end',
                  gap: '10px',
                  marginTop: '22px',
                }}
              >
                <button
                  className="notification-modal-cancel"
                  onClick={() => {
                    setShowDeleteModal(
                      false
                    );

                    setNotificationToDelete(
                      null
                    );
                  }}
                  disabled={
                    deletingId !==
                    null
                  }
                >
                  Cancel
                </button>

                <button
                  className="notification-modal-delete"
                  onClick={
                    handleDelete
                  }
                  disabled={
                    deletingId !==
                    null
                  }
                >
                  {deletingId !==
                  null
                    ? 'Deleting...'
                    : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

      {/* =========================================================
          CLEAR ALL MODAL
          ========================================================= */}

      {showClearModal && (
        <div
          className="notification-modal-overlay"
          onClick={() => {
            if (!clearingAll) {
              setShowClearModal(
                false
              );
            }
          }}
        >
          <div
            className="notification-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* Modal header */}

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center',
                marginBottom:
                  '14px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius:
                      '10px',
                    background:
                      '#fee2e2',
                    display: 'flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    color: '#dc2626',
                  }}
                >
                  <Trash2
                    size={18}
                  />
                </div>

                <h2 className="notification-modal-title">
                  Clear All Notifications?
                </h2>
              </div>

              <button
                onClick={() =>
                  setShowClearModal(
                    false
                  )
                }
                disabled={clearingAll}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius:
                    '8px',
                  border: 'none',
                  background:
                    'transparent',
                  color:
                    'var(--text-secondary)',
                  cursor:
                    'pointer',
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Message */}

            <p className="notification-modal-text">
              All notifications belonging
              to your account will be
              permanently deleted.
            </p>

            <p
              className="notification-modal-text"
              style={{
                marginTop: '8px',
              }}
            >
              This action cannot be undone.
            </p>

            {/* Buttons */}

            <div
              style={{
                display: 'flex',
                justifyContent:
                  'flex-end',
                gap: '10px',
                marginTop: '24px',
              }}
            >
              <button
                className="notification-modal-cancel"
                onClick={() =>
                  setShowClearModal(
                    false
                  )
                }
                disabled={clearingAll}
              >
                Cancel
              </button>

              <button
                className="notification-modal-delete"
                onClick={
                  handleClearAll
                }
                disabled={clearingAll}
              >
                {clearingAll
                  ? 'Clearing...'
                  : 'Clear All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}