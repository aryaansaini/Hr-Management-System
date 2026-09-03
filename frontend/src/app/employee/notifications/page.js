'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import api from '@/lib/axios';
import toast from 'react-hot-toast';

import { Trash2, X, Check } from 'lucide-react';


function formatTimeAgo(dateStr, now) {
  if (!dateStr) return '';

  const diff = now - new Date(dateStr).getTime();

  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;

  return `${days}d ago`;
}


export default function EmployeeNotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('ALL');

  const [markingAll, setMarkingAll] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [clearingAll, setClearingAll] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [now, setNow] = useState(() => Date.now());

  // ============================================================
  // NOTIFICATION DETAILS MODAL
  // ============================================================

  const [selectedNotification, setSelectedNotification] = useState(null);


  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(timer);
  }, []);


  const fetchNotifications = useCallback(async () => {
    setLoading(true);

    try {
      const [notifRes, unreadRes] = await Promise.allSettled([

        filter === 'UNREAD'
          ? api.get(`/api/notifications/unread?page=${page}&size=10`)
          : api.get(`/api/notifications?page=${page}&size=10`),

        api.get('/api/notifications/unread-count'),

      ]);

      if (notifRes.status === 'fulfilled') {
        const data = notifRes.value.data?.data;

        setNotifications(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      }

      if (unreadRes.status === 'fulfilled') {
        setUnreadCount(unreadRes.value.data?.data || 0);
      }

    } catch (error) {
      console.error('Failed to load notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }

  }, [filter, page]);


  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchNotifications]);


  const handleMarkRead = async (id) => {

    const notification = notifications.find((n) => n.id === id);

    if (!notification || notification.isRead) {
      return;
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.put(`/api/notifications/${id}/read`);

      window.dispatchEvent(new Event('notificationsUpdated'));

    } catch (error) {
      console.error('Failed to mark as read:', error);
      toast.error('Failed to mark as read');
      fetchNotifications();
    }
  };


  const handleMarkAll = async () => {


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
      await api.put('/api/notifications/mark-all-read');

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      toast.success('All notifications marked as read!');

      window.dispatchEvent(new Event('notificationsUpdated'));

    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };


  /*
   * Notification click
   *
   * Reference-linked notifications (Leave, Job, Document/Onboarding)
   * keep navigating to their existing employee-side pages.
   *
   * General/manual notifications (Festival, Announcement, Greeting,
   * Important Circular, General) open the formal letter Details modal.
   */
  const handleNotificationClick = async (notification) => {

    try {

      if (!notification.isRead) {
        await handleMarkRead(notification.id);
      }

      const type = String(
        notification.referenceType || notification.type || ''
      ).toUpperCase();

      const referenceId =
        notification.referenceId ?? notification.reference_id;

      if (referenceId) {

        if (type.includes('LEAVE')) {
          router.push(`/employee/leave?highlightId=${encodeURIComponent(referenceId)}`);
          return;
        }

        if (type.includes('JOB_POSTED') || type.includes('JOBPOSTING')) {
          router.push(`/employee/job-openings?id=${encodeURIComponent(referenceId)}`);
          return;
        }

        if (type.includes('DOCUMENT') || type.includes('ONBOARDING') || type.includes('DOC')) {
          router.push(`/employee/onboarding?highlightId=${encodeURIComponent(referenceId)}`);
          return;
        }
      }

      // General/manual notification: open formal letter details modal
      setSelectedNotification(notification);

    } catch (error) {
      console.error('Unable to open notification:', error);
      toast.error('Unable to open notification');
    }
  };


  const openDeleteModal = (notification) => {
    setNotificationToDelete(notification);
    setShowDeleteModal(true);
  };


  const handleDelete = async () => {

    if (!notificationToDelete) {
      return;
    }

    const id = notificationToDelete.id;

    setDeletingId(id);

    try {
      await api.delete(`/api/notifications/${id}`);

      if (!notificationToDelete.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      setNotifications((prev) => prev.filter((n) => n.id !== id));

      setShowDeleteModal(false);
      setNotificationToDelete(null);

      toast.success('Notification deleted');

      window.dispatchEvent(new Event('notificationsUpdated'));

      if (notifications.length === 1) {
        if (page > 0) {
          setPage((prev) => Math.max(0, prev - 1));
        } else {
          await fetchNotifications();
        }
      } else {
        await fetchNotifications();
      }

    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete notification');
    } finally {
      setDeletingId(null);
    }
  };


  const openClearAllModal = () => {
    if (notifications.length === 0) {
      return;
    }
    setShowClearModal(true);
  };


  const handleClearAll = async () => {

    setClearingAll(true);

    try {
      await api.delete('/api/notifications/clear-all');

      setNotifications([]);
      setUnreadCount(0);
      setTotalPages(0);
      setPage(0);

      setShowClearModal(false);

      toast.success('All notifications cleared');

      window.dispatchEvent(new Event('notificationsUpdated'));

    } catch (error) {
      console.error('Failed to clear notifications:', error);
      toast.error(error?.response?.data?.message || 'Failed to clear notifications');
    } finally {
      setClearingAll(false);
    }
  };


  const getNotifIcon = (title) => {

    if (!title) return '🔔';

    const t = title.toLowerCase();

    if (t.includes('leave')) return '🌴';
    if (t.includes('payroll') || t.includes('salary')) return '💰';
    if (t.includes('performance')) return '⭐';
    if (t.includes('training')) return '📚';
    if (t.includes('attendance')) return '📅';
    if (t.includes('onboarding')) return '📋';
    if (t.includes('recruitment') || t.includes('job')) return '💼';
    if (t.includes('approved')) return '✅';
    if (t.includes('rejected')) return '❌';
    if (t.includes('cancelled')) return '🚫';
    if (t.includes('festival')) return '🎉';
    if (t.includes('circular') || t.includes('announcement')) return '📢';

    return '🔔';
  };


  return (
    <div>

      <style jsx global>{`

        .emp-notifications-card {
          background: var(--card-bg) !important;
          border-color: var(--card-border) !important;
        }

        .emp-notification-row {
          border-color: var(--card-border) !important;
        }

        .emp-notification-row.read {
          background: var(--card-bg) !important;
        }

        .emp-notification-row.unread {
          background: #f8faff !important;
        }

        .emp-notification-row.unread:hover {
          background: #f0f4ff !important;
        }

        .emp-notification-row.read:hover {
          background: #f8fafc !important;
        }

        .emp-notification-action {
          background: var(--card-bg) !important;
          border-color: var(--card-border) !important;
        }

        .emp-notification-delete {
          color: #dc2626;
          transition: all 0.15s ease;
        }

        .emp-notification-delete:hover {
          background: #fef2f2 !important;
          border-color: #fecaca !important;
          color: #b91c1c !important;
        }

        .dark .emp-notifications-card {
          background: #171c24 !important;
          border-color: #2d3748 !important;
        }

        .dark .emp-notification-row {
          border-color: #2d3748 !important;
        }

        .dark .emp-notification-row.read {
          background: #171c24 !important;
        }

        .dark .emp-notification-row.unread {
          background: #111827 !important;
        }

        .dark .emp-notification-row.unread:hover {
          background: #1e293b !important;
        }

        .dark .emp-notification-row.read:hover {
          background: #1b222c !important;
        }

        .dark .emp-notification-delete {
          color: #f87171;
        }

        .dark .emp-notification-delete:hover {
          background: #450a0a !important;
          border-color: #7f1d1d !important;
          color: #fca5a5 !important;
        }

        .emp-notification-modal-overlay {
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

        .emp-notification-modal {
          width: 100%;
          max-width: 430px;
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25);
        }

        .emp-notification-modal-title {
          color: var(--text-primary);
          font-size: 18px;
          font-weight: 800;
          margin: 0;
        }

        .emp-notification-modal-text {
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.6;
        }

        .emp-notification-modal-preview {
          background: var(--background);
          border: 1px solid var(--card-border);
          border-radius: 10px;
          padding: 12px;
        }

        .emp-notification-modal-preview-title {
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 700;
        }

        .emp-notification-modal-preview-message {
          color: var(--text-secondary);
          font-size: 12px;
          line-height: 1.5;
          margin-top: 4px;
        }

        .emp-notification-modal-cancel {
          padding: 9px 18px;
          border-radius: 9px;
          border: 1px solid var(--card-border);
          background: var(--card-bg);
          color: var(--text-primary);
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .emp-notification-modal-cancel:hover {
          opacity: 0.8;
        }

        .emp-notification-modal-delete {
          padding: 9px 18px;
          border-radius: 9px;
          border: none;
          background: #dc2626;
          color: white;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .emp-notification-modal-delete:hover {
          background: #b91c1c;
        }

        .emp-notification-modal-delete:disabled,
        .emp-notification-modal-cancel:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {

          .emp-notification-row {
            flex-wrap: wrap !important;
          }

          .emp-notification-actions {
            width: 100%;
            margin-left: 60px;
          }

        }

      `}</style>


      {/* =====================================================
          NOTIFICATION DETAILS — FORMAL LETTER STYLE
          ===================================================== */}

      {selectedNotification && (
        <div
          className="emp-notification-modal-overlay"
          style={{ zIndex: 10000 }}
          onClick={() => setSelectedNotification(null)}
        >

          <div
            style={{
              width: '100%',
              maxWidth: '620px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: 'var(--card-bg)',
              borderRadius: '14px',
              boxShadow: '0 25px 70px rgba(0,0,0,0.35)',
            }}
            onClick={(e) => e.stopPropagation()}
          >

            {/* HEADER BAR */}

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--card-border)',
                position: 'sticky',
                top: 0,
                background: 'var(--card-bg)',
                zIndex: 2,
              }}
            >

              <button
                onClick={() => setSelectedNotification(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'var(--background)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Back"
              >
                ←
              </button>

              <p
                style={{
                  margin: 0,
                  fontWeight: '700',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                }}
              >
                Notification
              </p>

              <button
                onClick={() => setSelectedNotification(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>

            </div>

            {/* LETTER BODY */}

            <div style={{ padding: '40px 40px 24px' }}>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  paddingBottom: '20px',
                  borderBottom: '1.5px solid var(--text-primary)',
                  marginBottom: '28px',
                }}
              >

             <div
  style={{
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    background: '#eef2ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }}
>
  <img
    src="/removee.png"
    alt="Saiteja Infotech Private Limited"
    style={{
      width: '100%',
      height: '100%',
      objectFit: 'contain',
      padding: '2px',
    }}
  />
</div>

                <div>
                  <div
                    style={{
                      fontWeight: '700',
                      fontSize: '15px',
                      color: 'var(--text-primary)',
                    }}
                  >
                    Saiteja Infotech Private Limited
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Office circular
                  </div>
                </div>

              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  marginBottom: '24px',
                }}
              >
                <span>To: <strong style={{ fontWeight: '700' }}>You</strong></span>
               {/* <span>To: All employees</span> */}
               {/* <span>To: You </span> */}
                <span>
                  {selectedNotification.createdAt
                    ? new Date(selectedNotification.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : ''}
                </span>
              </div>

              <h1
                style={{
                  fontSize: '20px',
                  margin: '0 0 24px',
                  fontWeight: '800',
                  color: 'var(--text-primary)',
                }}
              >
                {selectedNotification.title}
              </h1>

              <div
                style={{
                  fontSize: '15px',
                  lineHeight: '1.8',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {selectedNotification.message}
              </div>

              <div style={{ marginTop: '32px' }}>
                <div
                  style={{
                    fontSize: '15px',
                    color: 'var(--text-primary)',
                    marginBottom: '4px',
                  }}
                >
                  Warm regards,
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: 'var(--text-primary)',
                  }}
                >
                  Saiteja Infotech Private Limited
                </div>
              </div>

            </div>

            {/* FOOTER */}

            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--card-border)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >

              <button
                onClick={() => setSelectedNotification(null)}
                style={{
                  padding: '9px 20px',
                  border: 'none',
                  borderRadius: '9px',
                  background: '#4f46e5',
                  color: 'white',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}


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
            Stay updated with your latest alerts and activities.
          </p>

        </div>

        {/* Header buttons — no Send Notification here (admin only) */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            justifyContent: 'flex-end',
          }}
        >

          {unreadCount > 0 && (
            <button
              className="emp-notification-action"
              onClick={handleMarkAll}
              disabled={markingAll}
              style={{
                padding: '11px 20px',
                background: 'var(--card-bg)',
                color: 'var(--text-primary)',
                border: '1.5px solid var(--card-border)',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: markingAll ? 'not-allowed' : 'pointer',
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

          {notifications.length > 0 && (
            <button
              onClick={openClearAllModal}
              disabled={clearingAll}
              style={{
                padding: '11px 20px',
                background: '#fff1f2',
                color: '#dc2626',
                border: '1.5px solid #fecdd3',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: clearingAll ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Trash2 size={14} />
              {clearingAll ? 'Clearing...' : 'Clear All'}
            </button>
          )}

        </div>

      </div>


      {/* =====================================================
          FILTER
          ===================================================== */}

      <div
        className="emp-notifications-card"
        style={{
          display: 'flex',
          gap: '6px',
          marginBottom: '20px',
          background: 'var(--card-bg)',
          borderRadius: '12px',
          border: '1px solid var(--card-border)',
          padding: '6px',
          width: 'fit-content',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >

        {['ALL', 'UNREAD'].map((f) => (

          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(0);
            }}
            style={{
              padding: '9px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '700',
              background: filter === f ? '#4f46e5' : 'transparent',
              color: filter === f ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >

            {f === 'ALL'
              ? 'All Notifications'
              : `Unread${unreadCount ? ` (${unreadCount})` : ''}`}

          </button>

        ))}

      </div>


      {/* =====================================================
          NOTIFICATION CARD
          ===================================================== */}

      <div
        className="emp-notifications-card"
        style={{
          background: 'var(--card-bg)',
          borderRadius: '14px',
          border: '1px solid var(--card-border)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >

        {loading ? (

          <div
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

          <div
            style={{
              padding: '80px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >

            <div style={{ fontSize: '44px', marginBottom: '14px' }}>
              🔔
            </div>

            <div
              style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              {filter === 'UNREAD' ? "You're all caught up!" : 'No notifications yet'}
            </div>

            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
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

            {notifications.map((n) => {

              const shortMessage =
                n.message?.length > 160
                  ? `${n.message.substring(0, 160)}...`
                  : n.message;

              return (

                <div
                  key={n.id}
                  className={`emp-notification-row ${n.isRead ? 'read' : 'unread'}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleNotificationClick(n)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleNotificationClick(n);
                    }
                  }}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    alignItems: 'flex-start',
                    padding: '18px 20px',
                    borderBottom: '1px solid var(--card-border)',
                    cursor: 'pointer',
                  }}
                >

                  <div
                    style={{
                      width: '8px',
                      minWidth: '8px',
                      height: '8px',
                      marginTop: '7px',
                      borderRadius: '50%',
                      background: n.isRead ? 'transparent' : '#4f46e5',
                    }}
                  />

                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      minWidth: '46px',
                      borderRadius: '12px',
                      background: n.isRead ? '#f1f5f9' : '#eef2ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '21px',
                    }}
                  >
                    {getNotifIcon(n.title)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>

                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: n.isRead ? '600' : '800',
                        color: 'var(--text-primary)',
                        marginBottom: '5px',
                      }}
                    >
                      {n.title}
                    </div>

                    {n.message && (
                      <div
                        style={{
                          fontSize: '13px',
                          color: 'var(--text-secondary)',
                          lineHeight: '1.5',
                          marginBottom: '6px',
                        }}
                      >
                        {shortMessage}
                      </div>
                    )}

                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {formatTimeAgo(n.createdAt, now)}
                    </div>

                  </div>

                  <div
                    className="emp-notification-actions"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      flexShrink: 0,
                    }}
                  >

                    {!n.isRead && (
                      <button
                        className="emp-notification-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkRead(n.id);
                        }}
                        style={{
                          padding: '7px 16px',
                          background: 'var(--card-bg)',
                          color: '#4f46e5',
                          border: '1.5px solid var(--card-border)',
                          borderRadius: '8px',
                          fontSize: '12px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Mark read
                      </button>
                    )}

                    <button
                      className="emp-notification-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(n);
                      }}
                      disabled={deletingId === n.id}
                      title="Delete notification"
                      aria-label="Delete notification"
                      style={{
                        width: '34px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '8px',
                        border: '1.5px solid var(--card-border)',
                        background: 'var(--card-bg)',
                        cursor: deletingId === n.id ? 'not-allowed' : 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      {deletingId === n.id ? (
                        <span style={{ fontSize: '14px' }}>⏳</span>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>

                  </div>

                </div>

              );

            })}

            {totalPages > 1 && (

              <div
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  borderTop: '1px solid var(--card-border)',
                }}
              >

                <button
                  className="emp-notification-action"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{
                    padding: '7px 16px',
                    border: '1.5px solid var(--card-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: page === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                    background: 'var(--card-bg)',
                    cursor: page === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  ← Prev
                </button>

                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-secondary)',
                    fontWeight: '600',
                  }}
                >
                  Page {page + 1} of {totalPages}
                </span>

                <button
                  className="emp-notification-action"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{
                    padding: '7px 16px',
                    border: '1.5px solid var(--card-border)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    color: page >= totalPages - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                    background: 'var(--card-bg)',
                    cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Next →
                </button>

              </div>

            )}

          </>

        )}

      </div>


      {/* =====================================================
          DELETE ONE NOTIFICATION MODAL
          ===================================================== */}

      {showDeleteModal && notificationToDelete && (

        <div
          className="emp-notification-modal-overlay"
          onClick={() => {
            if (!deletingId) {
              setShowDeleteModal(false);
              setNotificationToDelete(null);
            }
          }}
        >

          <div className="emp-notification-modal" onClick={(e) => e.stopPropagation()}>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#dc2626',
                  }}
                >
                  <Trash2 size={18} />
                </div>

                <h2 className="emp-notification-modal-title">Delete Notification?</h2>

              </div>

              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setNotificationToDelete(null);
                }}
                disabled={deletingId !== null}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>

            </div>

            <p className="emp-notification-modal-text">
              Are you sure you want to delete this notification?
            </p>

            <div className="emp-notification-modal-preview" style={{ marginTop: '16px' }}>

              <div className="emp-notification-modal-preview-title">
                {notificationToDelete.title}
              </div>

              {notificationToDelete.message && (
                <div className="emp-notification-modal-preview-message">
                  {notificationToDelete.message}
                </div>
              )}

            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '22px',
              }}
            >

              <button
                className="emp-notification-modal-cancel"
                onClick={() => {
                  setShowDeleteModal(false);
                  setNotificationToDelete(null);
                }}
                disabled={deletingId !== null}
              >
                Cancel
              </button>

              <button
                className="emp-notification-modal-delete"
                onClick={handleDelete}
                disabled={deletingId !== null}
              >
                {deletingId !== null ? 'Deleting...' : 'Delete'}
              </button>

            </div>

          </div>

        </div>

      )}


      {/* =====================================================
          CLEAR ALL MODAL
          ===================================================== */}

      {showClearModal && (

        <div
          className="emp-notification-modal-overlay"
          onClick={() => {
            if (!clearingAll) {
              setShowClearModal(false);
            }
          }}
        >

          <div className="emp-notification-modal" onClick={(e) => e.stopPropagation()}>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>

                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#fee2e2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#dc2626',
                  }}
                >
                  <Trash2 size={18} />
                </div>

                <h2 className="emp-notification-modal-title">Clear All Notifications?</h2>

              </div>

              <button
                onClick={() => setShowClearModal(false)}
                disabled={clearingAll}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>

            </div>

            <p className="emp-notification-modal-text">
              Are you sure you want to clear all notifications? This action cannot be undone.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px',
                marginTop: '22px',
              }}
            >

              <button
                className="emp-notification-modal-cancel"
                onClick={() => setShowClearModal(false)}
                disabled={clearingAll}
              >
                Cancel
              </button>

              <button
                className="emp-notification-modal-delete"
                onClick={handleClearAll}
                disabled={clearingAll}
              >
                {clearingAll ? 'Clearing...' : 'Clear All'}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}