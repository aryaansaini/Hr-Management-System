'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

import {
  CheckCircle,
  Clock,
  XCircle,
  Undo2,
  Coffee,
  HeartPulse,
  Sun,
  Baby,
  PersonStanding,
  ClipboardList,
  PartyPopper,
  Loader2,
  Check,
  X,
  Trash2,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';

function StatusPill({ status }) {
  const map = {
    APPROVED: {
      bg: 'rgba(22, 163, 74, 0.15)',
      color: '#15803D',
      icon: <CheckCircle size={14} />
    },

    PENDING: {
      bg: 'rgba(245, 158, 11, 0.15)',
      color: '#f59e0b',
      icon: <Clock size={14} />
    },

    REJECTED: {
      bg: 'rgba(220, 38, 38, 0.15)',
      color: '#B91C1C',
      icon: <XCircle size={14} />
    },

    CANCELLATION_PENDING: {
      bg: 'rgba(126, 34, 206, 0.15)',
      color: '#7E22CE',
      icon: <Undo2 size={14} />
    },

    CANCELLED: {
      bg: '#1E293B',
      color: 'var(--text-secondary)',
      icon: '·'
    }
  };

  const s = map[status] || map.PENDING;

  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: '4px 12px',
        borderRadius: '999px',
        fontSize: '11.5px',
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        justifySelf: 'start',
        flexShrink: 0
      }}
    >
      <span style={{ display: 'flex' }}>
        {s.icon}
      </span>

      {status === 'CANCELLATION_PENDING'
        ? 'Cancel Pending'
        : status?.replace(/_/g, ' ')}
    </span>
  );
}

const typeMeta = {
  ANNUAL: {
    icon: <Coffee size={16} />,
    color: '#4F46E5'
  },

  SICK: {
    icon: <HeartPulse size={16} />,
    color: '#0D9488'
  },

  CASUAL: {
    icon: <Sun size={16} />,
    color: '#D97706'
  },

  PATERNITY: {
    icon: <Baby size={16} />,
    color: '#8B5CF6'
  },

  MATERNITY: {
    icon: <PersonStanding size={16} />,
    color: '#DB2777'
  },

  UNPAID: {
    icon: <ClipboardList size={16} />,
    color: 'var(--text-secondary)'
  }
};

export default function AdminLeavePage() {
  const searchParams = useSearchParams();

  const highlightId = searchParams.get('highlightId');
  const queryTab = searchParams.get('tab');

  const [tab, setTab] = useState(queryTab || 'PENDING');

  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [rejected, setRejected] = useState([]);
  const [cancellations, setCancellations] = useState([]);

  const [initialLoading, setInitialLoading] = useState(true);

  const [actioning, setActioning] = useState(null);

  // DELETE STATES
  const [deleting, setDeleting] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);

  // EXPANDED ROW STATE
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [pendingCount, setPendingCount] = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [cancellationsCount, setCancellationsCount] = useState(0);

  const loadedTabs = useRef(new Set());

  const fetchData = useCallback(async () => {
    const isFirstLoad = !loadedTabs.current.has(tab);

    if (isFirstLoad) {
      setInitialLoading(true);
    }

    try {
      if (tab === 'PENDING') {
        const res = await api.get(
          `/api/leaves/pending?page=${page}&size=20`
        );

        const data = res.data?.data;

        setPending(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      }

      else if (tab === 'CANCELLATIONS') {
        const res = await api.get(
          `/api/leaves/pending-cancellations?page=${page}&size=20`
        );

        const data = res.data?.data;

        setCancellations(data?.content || []);
        setTotalPages(data?.totalPages || 0);
      }

      else {
        const res = await api.get(
          `/api/leaves?page=0&size=100`
        );

        const all = res.data?.data?.content || [];

        if (tab === 'APPROVED') {
          setApproved(
            all.filter(
              (l) => l.status === 'APPROVED'
            )
          );
        }

        if (tab === 'REJECTED') {
          setRejected(
            all.filter(
              (l) => l.status === 'REJECTED'
            )
          );
        }

        setTotalPages(0);
      }

      /*
       * Fetch counts so all tab badges stay updated.
       */
      const [
        pendingRes,
        cancellationsRes,
        allRes
      ] = await Promise.all([
        api.get(
          `/api/leaves/pending?page=0&size=1`
        ),

        api.get(
          `/api/leaves/pending-cancellations?page=0&size=1`
        ),

        api.get(
          `/api/leaves?page=0&size=100`
        )
      ]);

      setPendingCount(
        pendingRes.data?.data?.totalElements || 0
      );

      setCancellationsCount(
        cancellationsRes.data?.data?.totalElements || 0
      );

      const allList =
        allRes.data?.data?.content || [];

      setApprovedCount(
        allList.filter(
          (l) => l.status === 'APPROVED'
        ).length
      );

      setRejectedCount(
        allList.filter(
          (l) => l.status === 'REJECTED'
        ).length
      );

      loadedTabs.current.add(tab);

    } catch (err) {
      console.error(err);

      toast.error(
        "Couldn't load requests"
      );
    } finally {
      setInitialLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    const timer = setTimeout(
      () => fetchData(),
      0
    );

    return () => clearTimeout(timer);
  }, [fetchData]);

  /*
   * Notification can open this page with:
   * ?highlightId=<leave id>
   */
  useEffect(() => {
    if (highlightId) {
      setTab(queryTab || 'PENDING');
      setPage(0);
    }
  }, [highlightId, queryTab]);

  const currentData =
    tab === 'PENDING'
      ? pending
      : tab === 'APPROVED'
        ? approved
        : tab === 'REJECTED'
          ? rejected
          : cancellations;

  /*
   * Highlight leave from notification.
   */
  useEffect(() => {
    if (!highlightId || initialLoading) {
      return;
    }

    const target = currentData.find(
      (l) =>
        String(l.id) === String(highlightId)
    );

    if (!target) {
      return;
    }

    const element =
      document.getElementById(
        `leave-${highlightId}`
      );

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    element.style.boxShadow =
      '0 0 0 3px rgba(79,70,229,0.45), 0 8px 24px rgba(79,70,229,0.18)';

    element.style.background =
      'rgba(79,70,229,0.08)';

    const timer = setTimeout(() => {
      element.style.boxShadow = '';
      element.style.background = '';
    }, 4000);

    return () => clearTimeout(timer);

  }, [
    highlightId,
    initialLoading,
    currentData
  ]);

  /*
   * ============================================================
   * APPROVE / REJECT
   * ============================================================
   */

  const handleAction = async (
    id,
    action
  ) => {
    setActioning(
      id + action
    );

    try {
      await api.put(
        `/api/leaves/${id}/action`,
        {
          action,
          remarks:
            action === 'APPROVED'
              ? 'Approved'
              : 'Rejected'
        }
      );

      toast.success(
        action === 'APPROVED'
          ? '✅ Leave approved!'
          : '❌ Leave rejected'
      );

      await fetchData();

    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Action failed';

      toast.error(
        msg.includes('already')
          ? '⚡ Someone already actioned this one'
          : msg
      );

      await fetchData();

    } finally {
      setActioning(null);
    }
  };

  /*
   * ============================================================
   * CONFIRM / DENY CANCELLATION
   * ============================================================
   */

  const handleCancelAction = async (
    id,
    approve
  ) => {
    setActioning(
      id + approve
    );

    try {
      await api.put(
        `/api/leaves/${id}/cancel-action`,
        {
          approve,
          remarks: approve
            ? 'Cancellation confirmed'
            : 'Cancellation denied'
        }
      );

      toast.success(
        approve
          ? 'Cancellation confirmed!'
          : 'Cancellation denied'
      );

      await fetchData();

    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Action failed';

      toast.error(
        msg.includes('already')
          ? '⚡ Already resolved by someone else'
          : msg
      );

      await fetchData();

    } finally {
      setActioning(null);
    }
  };

  /*
   * ============================================================
   * DELETE ONE LEAVE
   * ============================================================
   */

  const handleDelete = async (
    leaveId
  ) => {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this leave request?'
      );

    if (!confirmed) {
      return;
    }

    setDeleting(leaveId);

    try {
      await api.delete(
        `/api/leaves/${leaveId}`
      );

      toast.success(
        'Leave deleted successfully'
      );

      /*
       * Reset to first page after deletion.
       */
      setPage(0);

      /*
       * Allow current tab to reload.
       */
      loadedTabs.current.delete(tab);

      await fetchData();

    } catch (err) {
      console.error(
        'Delete leave error:',
        err
      );

      toast.error(
        err.response?.data?.message ||
        'Failed to delete leave request'
      );

    } finally {
      setDeleting(null);
    }
  };

  /*
   * ============================================================
   * CLEAR ALL FOR CURRENT TAB
   * ============================================================
   */

  const handleClearAll = async () => {
    if (
      !currentData ||
      currentData.length === 0
    ) {
      toast.info(
        'There are no leave requests to clear.'
      );

      return;
    }

    /*
     * Frontend:
     * CANCELLATIONS
     *
     * Backend:
     * CANCELLATION_PENDING
     */
    const deleteStatus =
      tab === 'CANCELLATIONS'
        ? 'CANCELLATION_PENDING'
        : tab;

    const tabLabel =
      tab === 'PENDING'
        ? 'Pending Approvals'
        : tab === 'APPROVED'
          ? 'Approved'
          : tab === 'REJECTED'
            ? 'Rejected'
            : 'Cancellations';

    const confirmed =
      window.confirm(
        `Are you sure you want to clear all ${tabLabel} leave requests?`
      );

    if (!confirmed) {
      return;
    }

    setClearingAll(true);

    try {
      await api.delete(
        `/api/leaves/clear/${deleteStatus}`
      );

      toast.success(
        `${tabLabel} cleared successfully`
      );

      setPage(0);

      /*
       * Force current tab to reload.
       */
      loadedTabs.current.delete(tab);

      await fetchData();

    } catch (err) {
      console.error(
        'Clear all leaves error:',
        err
      );

      toast.error(
        err.response?.data?.message ||
        `Failed to clear ${tabLabel}`
      );

    } finally {
      setClearingAll(false);
    }
  };

  const tabs = [
    {
      key: 'PENDING',
      label: `Pending Approvals (${pendingCount})`,
      icon: <Clock size={16} />
    },

    {
      key: 'APPROVED',
      label: `Approved (${approvedCount})`,
      icon: <CheckCircle size={16} />
    },

    {
      key: 'REJECTED',
      label: `Rejected (${rejectedCount})`,
      icon: <XCircle size={16} />
    },

    {
      key: 'CANCELLATIONS',
      label: `Cancellations (${cancellationsCount})`,
      icon: <Undo2 size={16} />
    }
  ];

  const lastColumnLabel =
    tab === 'PENDING' ||
    tab === 'CANCELLATIONS'
      ? 'Actions'
      : 'Reviewed By';

  return (
    <div
      style={{
        fontFamily: "'Inter', sans-serif"
      }}
    >
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

        .leave-delete-button:hover {
          background: rgba(239, 68, 68, 0.08) !important;
          border-color: #EF4444 !important;
        }

        .clear-all-button:hover:not(:disabled) {
          background: #FEE2E2 !important;
        }
      `}</style>

      {/* ============================================================
          HEADER
          ============================================================ */}

      <div
        style={{
          marginBottom: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '20px'
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Quicksand', sans-serif",
              fontSize: '26px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <ClipboardList size={28} />

            Leave Requests
          </h1>

          <p
            style={{
              fontSize: '13.5px',
              color: 'var(--text-muted)'
            }}
          >
            Shared queue — any Admin or HR teammate
            can approve or decline. First one in settles it.
          </p>
        </div>

        {/* ============================================================
            CLEAR ALL BUTTON FOR CURRENT TAB
            ============================================================ */}

        <button
          className="clear-all-button"
          onClick={handleClearAll}
          disabled={
            clearingAll ||
            !currentData ||
            currentData.length === 0
          }
          title={`Clear all ${tab === 'PENDING'
            ? 'pending'
            : tab === 'APPROVED'
              ? 'approved'
              : tab === 'REJECTED'
                ? 'rejected'
                : 'cancellation'
            } leaves`}
          style={{
            padding: '12px 20px',
            background: '#FFF5F5',
            color: '#DC2626',
            border: '1px solid #FECACA',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 700,
            cursor:
              clearingAll ||
                !currentData ||
                currentData.length === 0
                ? 'not-allowed'
                : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            opacity:
              clearingAll ||
                !currentData ||
                currentData.length === 0
                ? 0.55
                : 1,
            whiteSpace: 'nowrap',
            transition: 'all 0.2s',
            flexShrink: 0
          }}
        >
          {clearingAll ? (
            <Loader2
              size={17}
              className="animate-spin"
            />
          ) : (
            <Trash2 size={17} />
          )}

          Clear All
        </button>
      </div>

      {/* ============================================================
          WORKFLOW
          ============================================================ */}

      <div
        style={{
          background: 'var(--card-bg)',
          borderRadius: '16px',
          padding: '14px 20px',
          border: '1px solid var(--card-border)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap'
        }}
      >
        <span
          style={{
            background: 'rgba(79, 70, 229, 0.15)',
            color: '#4F46E5',
            padding: '5px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700
          }}
        >
          1. Employee applies
        </span>

        <span
          style={{
            color: 'var(--text-secondary)'
          }}
        >
          →
        </span>

        <span
          style={{
            background: 'rgba(180, 83, 9, 0.2)',
            color: '#B45309',
            padding: '5px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700
          }}
        >
          2. Admin or HR reviews
        </span>

        <span
          style={{
            color: 'var(--text-secondary)'
          }}
        >
          →
        </span>

        <span
          style={{
            background: 'rgba(22, 163, 74, 0.15)',
            color: '#15803D',
            padding: '5px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 700
          }}
        >
          3. Approved / Rejected
        </span>
      </div>

      {/* ============================================================
          TABS
          ============================================================ */}

      <div
        style={{
          display: 'flex',
          gap: '4px',
          background: 'var(--bg-secondary)',
          borderRadius: '14px',
          padding: '4px',
          width: 'fit-content',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setPage(0);
            }}
            style={{
              padding: '9px 18px',
              background:
                tab === t.key
                  ? 'var(--card-bg)'
                  : 'transparent',

              color:
                tab === t.key
                  ? 'var(--text-primary)'
                  : 'var(--text-muted)',

              border: 'none',
              borderRadius: '11px',
              fontSize: '13px',
              fontWeight:
                tab === t.key
                  ? 700
                  : 500,

              cursor: 'pointer',

              boxShadow:
                tab === t.key
                  ? '0 2px 8px rgba(0,0,0,0.4)'
                  : 'none',

              transition: 'all 0.15s',
              whiteSpace: 'nowrap',

              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {t.icon}

            {t.label}
          </button>
        ))}
      </div>

      {/* ============================================================
          TABLE
          ============================================================ */}

      <div
        style={{
          background: 'var(--card-bg)',
          borderRadius: '18px',
          border: '1px solid var(--card-border)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          overflow: 'hidden'
        }}
      >
        {/* TABLE HEADER */}

        <div
          style={{
            display: 'grid',

            /*
             * Added final 55px column for DELETE.
             */
            gridTemplateColumns:
              '2fr 1.1fr 1fr 1fr 0.5fr 1.3fr 2fr 55px',

            padding: '10px 22px',

            background: 'var(--card-bg)',

            borderBottom:
              '1px solid var(--card-border)'
          }}
        >
          {[
            'Employee',
            'Type',
            'From',
            'To',
            'Days',
            'Status',
            lastColumnLabel,
            ''
          ].map((h, index) => (
            <div
              key={index}
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px'
              }}
            >
              {h}
            </div>
          ))}
        </div>

        {/* ============================================================
            LOADING
            ============================================================ */}

        {initialLoading &&
          currentData.length === 0 ? (
          <div
            style={{
              padding: '60px',
              textAlign: 'center',
              color: 'var(--text-muted)'
            }}
          >
            Loading...
          </div>
        ) : currentData.length === 0 ? (

          /* ============================================================
             EMPTY STATE
             ============================================================ */

          <div
            style={{
              padding: '80px',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '16px',
                color: '#16a34a'
              }}
            >
              <PartyPopper
                size={48}
                strokeWidth={1.5}
              />
            </div>

            <div
              style={{
                fontSize: '16px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              All clear!
            </div>

            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)'
              }}
            >
              No{' '}
              {tab === 'PENDING'
                ? 'leaves waiting on a decision'
                : tab === 'APPROVED'
                  ? 'approved leaves yet'
                  : tab === 'REJECTED'
                    ? 'rejected leaves'
                    : 'pending cancellations'}{' '}
              right now
            </div>
          </div>

        ) : (

          /* ============================================================
             DATA
             ============================================================ */

          <>
            {currentData.map((l) => {
              const m =
                typeMeta[l.leaveType] ||
                typeMeta.UNPAID;

              const isHighlighted =
                String(l.id) ===
                String(highlightId);

              const isExpanded = expandedId === l.id;

              return (
                <div
                  key={l.id}
                  id={`leave-${l.id}`}
                  style={{
                    borderBottom:
                      '1px solid var(--card-border)',

                    background:
                      isHighlighted
                        ? 'rgba(79,70,229,0.08)'
                        : 'transparent',

                    boxShadow:
                      isHighlighted
                        ? '0 0 0 3px rgba(79,70,229,0.35)'
                        : 'none',

                    transition: 'all 0.25s'
                  }}
                >
                  <div
                    onClick={() => toggleExpand(l.id)}
                    style={{
                      display: 'grid',

                      /*
                       * Final 55px column is for DELETE.
                       */
                      gridTemplateColumns:
                        '2fr 1.1fr 1fr 1fr 0.5fr 1.3fr 2fr 55px',

                      padding: '14px 22px',

                      alignItems: 'center',

                      cursor: 'pointer'
                    }}
                  >

                    {/* ====================================================
                        EMPLOYEE
                        ==================================================== */}

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        minWidth: 0,
                        paddingRight: '12px'
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',

                          background:
                            `linear-gradient(135deg, ${m.color}, ${m.color}CC)`,

                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',

                          fontSize: '12px',
                          fontWeight: 700,

                          color:
                            'var(--text-primary)',

                          flexShrink: 0
                        }}
                      >
                        {(l.employeeName || '')
                          .split(' ')
                          .map(
                            (n) => n[0] || ''
                          )
                          .join('')
                          .slice(0, 2)}
                      </div>

                      <div style={{ minWidth: 0, overflow: 'hidden' }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {l.employeeName}
                        </div>

                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-secondary)',
                            fontStyle: 'italic',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={l.reason}
                        >
                          {l.reason || 'No reason provided'}
                        </div>
                      </div>
                    </div>

                  {/* ====================================================
                      TYPE
                      ==================================================== */}

                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color:
                        'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>
                      {m.icon}
                    </span>

                    {l.leaveType}
                  </div>

                  {/* FROM */}

                  <div
                    style={{
                      fontSize: '12.5px',
                      color:
                        'var(--text-secondary)'
                    }}
                  >
                    {l.startDate}
                  </div>

                  {/* TO */}

                  <div
                    style={{
                      fontSize: '12.5px',
                      color:
                        'var(--text-secondary)'
                    }}
                  >
                    {l.endDate}
                  </div>

                  {/* DAYS */}

                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color:
                        'var(--text-primary)'
                    }}
                  >
                    {l.totalDays}
                  </div>

                  {/* STATUS */}

                  <StatusPill
                    status={l.status}
                  />

                  {/* ====================================================
                      ACTIONS / REVIEWED BY
                      ==================================================== */}

                  <div>

                    {/* PENDING */}

                    {tab === 'PENDING' && (
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap'
                        }}
                      >
                        <button
                          onClick={() =>
                            handleAction(
                              l.id,
                              'APPROVED'
                            )
                          }
                          disabled={
                            !!actioning ||
                            !!deleting ||
                            clearingAll
                          }
                          style={{
                            padding:
                              '6px 14px',

                            background:
                              'rgba(16, 185, 129, 0.15)',

                            color:
                              '#10b981',

                            border:
                              '1px solid #10b981',

                            borderRadius:
                              '6px',

                            fontSize:
                              '12px',

                            fontWeight:
                              '600',

                            cursor:
                              'pointer',

                            whiteSpace:
                              'nowrap',

                            display:
                              'flex',

                            alignItems:
                              'center',

                            justifyContent:
                              'center',

                            transition:
                              'background-color 0.2s',

                            opacity:
                              actioning
                                ? 0.7
                                : 1
                          }}
                        >
                          {actioning ===
                            l.id +
                            'APPROVED' ? (
                            <>
                              <Loader2
                                size={12}
                                className="animate-spin"
                                style={{
                                  display:
                                    'inline',
                                  marginRight:
                                    '4px'
                                }}
                              />

                              Processing...
                            </>
                          ) : (
                            <>
                              <Check
                                size={12}
                                style={{
                                  display:
                                    'inline',
                                  marginRight:
                                    '4px'
                                }}
                              />

                              Approve
                            </>
                          )}
                        </button>

                        <button
                          onClick={() =>
                            handleAction(
                              l.id,
                              'REJECTED'
                            )
                          }
                          disabled={
                            !!actioning ||
                            !!deleting ||
                            clearingAll
                          }
                          style={{
                            padding:
                              '6px 14px',

                            background:
                              'rgba(239, 68, 68, 0.15)',

                            color:
                              '#ef4444',

                            border:
                              '1px solid #ef4444',

                            borderRadius:
                              '6px',

                            fontSize:
                              '12px',

                            fontWeight:
                              '600',

                            cursor:
                              'pointer',

                            display:
                              'flex',

                            alignItems:
                              'center',

                            justifyContent:
                              'center',

                            transition:
                              'background-color 0.2s',

                            opacity:
                              actioning
                                ? 0.7
                                : 1
                          }}
                        >
                          {actioning ===
                            l.id +
                            'REJECTED' ? (
                            <>
                              <Loader2
                                size={12}
                                className="animate-spin"
                                style={{
                                  display:
                                    'inline',
                                  marginRight:
                                    '4px'
                                }}
                              />

                              Processing...
                            </>
                          ) : (
                            <>
                              <X
                                size={12}
                                style={{
                                  display:
                                    'inline',
                                  marginRight:
                                    '4px'
                                }}
                              />

                              Reject
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* ==================================================
                        CANCELLATIONS
                        ================================================== */}

                    {tab ===
                      'CANCELLATIONS' && (
                        <div
                          style={{
                            display:
                              'flex',
                            gap: '8px',
                            flexWrap:
                              'wrap'
                          }}
                        >
                          <button
                            onClick={() =>
                              handleCancelAction(
                                l.id,
                                true
                              )
                            }
                            disabled={
                              !!actioning ||
                              !!deleting ||
                              clearingAll
                            }
                            style={{
                              padding:
                                '6px 14px',

                              background:
                                'rgba(16, 185, 129, 0.15)',

                              color:
                                '#10b981',

                              border:
                                '1px solid #10b981',

                              borderRadius:
                                '6px',

                              fontSize:
                                '12px',

                              fontWeight:
                                '600',

                              cursor:
                                'pointer',

                              whiteSpace:
                                'nowrap',

                              display:
                                'flex',

                              alignItems:
                                'center',

                              justifyContent:
                                'center',

                              transition:
                                'background-color 0.2s',

                              opacity:
                                actioning
                                  ? 0.7
                                  : 1
                            }}
                          >
                            {actioning ===
                              l.id +
                              'true' ? (
                              <>
                                <Loader2
                                  size={12}
                                  className="animate-spin"
                                  style={{
                                    display:
                                      'inline',
                                    marginRight:
                                      '4px'
                                  }}
                                />

                                Processing...
                              </>
                            ) : (
                              <>
                                <Check
                                  size={12}
                                  style={{
                                    display:
                                      'inline',
                                    marginRight:
                                      '4px'
                                  }}
                                />

                                Confirm
                              </>
                            )}
                          </button>

                          <button
                            onClick={() =>
                              handleCancelAction(
                                l.id,
                                false
                              )
                            }
                            disabled={
                              !!actioning ||
                              !!deleting ||
                              clearingAll
                            }
                            style={{
                              padding:
                                '6px 14px',

                              background:
                                'rgba(239, 68, 68, 0.15)',

                              color:
                                '#ef4444',

                              border:
                                '1px solid #ef4444',

                              borderRadius:
                                '6px',

                              fontSize:
                                '12px',

                              fontWeight:
                                '600',

                              cursor:
                                'pointer',

                              display:
                                'flex',

                              alignItems:
                                'center',

                              justifyContent:
                                'center',

                              transition:
                                'background-color 0.2s',

                              opacity:
                                actioning
                                  ? 0.7
                                  : 1
                            }}
                          >
                            {actioning ===
                              l.id +
                              'false' ? (
                              <>
                                <Loader2
                                  size={12}
                                  className="animate-spin"
                                  style={{
                                    display:
                                      'inline',
                                    marginRight:
                                      '4px'
                                  }}
                                />

                                Processing...
                              </>
                            ) : (
                              <>
                                <X
                                  size={12}
                                  style={{
                                    display:
                                      'inline',
                                    marginRight:
                                      '4px'
                                  }}
                                />

                                Deny
                              </>
                            )}
                          </button>
                        </div>
                      )}

                    {/* ==================================================
                        APPROVED / REJECTED
                        ================================================== */}

                    {(tab === 'APPROVED' ||
                      tab === 'REJECTED') && (
                      <div>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color:
                              'var(--text-primary)'
                          }}
                        >
                          {l.reviewedByName ||
                            '—'}
                        </div>

                        {l.remarks && (
                          <div
                            style={{
                              fontSize:
                                '11px',

                              color:
                                'var(--text-secondary)',

                              fontStyle:
                                'italic'
                            }}
                          >
                            &quot;
                            {l.remarks}
                            &quot;
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* ====================================================
                      INDIVIDUAL DELETE BUTTON
                      ==================================================== */}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end'
                    }}
                  >
                    <button
                      className="leave-delete-button"
                      onClick={() =>
                        handleDelete(l.id)
                      }
                      disabled={
                        deleting === l.id ||
                        !!actioning ||
                        clearingAll
                      }
                      title="Delete leave"
                      style={{
                        width: '34px',
                        height: '32px',

                        border:
                          '1px solid var(--card-border)',

                        background:
                          'transparent',

                        color:
                          '#EF4444',

                        borderRadius:
                          '10px',

                        cursor:
                          deleting === l.id ||
                            !!actioning ||
                            clearingAll
                            ? 'not-allowed'
                            : 'pointer',

                        display:
                          'flex',

                        alignItems:
                          'center',

                        justifyContent:
                          'center',

                        opacity:
                          deleting === l.id ||
                            !!actioning ||
                            clearingAll
                            ? 0.5
                            : 1,

                        transition:
                          'all 0.2s'
                      }}
                    >
                      {deleting === l.id ? (
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2
                          size={15}
                        />
                      )}
                    </button>
                  </div>
                </div>

                {/* ====================================================
                    EXPANDED DETAILS PANEL
                    ==================================================== */}
                {isExpanded && (
                  <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding: '18px 24px 22px 24px',
                        background: 'var(--bg-secondary)',
                        borderTop: '1px dashed var(--card-border)',
                        borderLeft: '4px solid #4F46E5',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <MessageSquare size={16} style={{ color: '#4F46E5' }} />
                        Leave Reason
                      </div>

                      <div
                        style={{
                          fontSize: '14px',
                          lineHeight: '1.6',
                          color: 'var(--text-primary)',
                          background: 'var(--card-bg)',
                          padding: '16px 20px',
                          borderRadius: '12px',
                          border: '1px solid var(--card-border)',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontStyle: 'italic'
                        }}
                      >
                        &quot;{l.reason || 'No reason specified by employee.'}&quot;
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* ==========================================================
                PAGINATION
                ========================================================== */}

            {(tab === 'PENDING' ||
              tab === 'CANCELLATIONS') &&
              totalPages > 1 && (
                <div
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    borderTop:
                      '1px solid var(--card-border)'
                  }}
                >
                  <button
                    onClick={() =>
                      setPage(
                        (p) =>
                          Math.max(
                            0,
                            p - 1
                          )
                      )
                    }
                    disabled={page === 0}
                    style={{
                      padding:
                        '6px 14px',

                      border:
                        '1px solid var(--card-border)',

                      borderRadius:
                        '8px',

                      fontSize:
                        '12px',

                      fontWeight:
                        700,

                      color:
                        page === 0
                          ? 'var(--text-muted)'
                          : 'var(--text-primary)',

                      background:
                        'var(--card-bg)',

                      cursor:
                        page === 0
                          ? 'not-allowed'
                          : 'pointer'
                    }}
                  >
                    ← Prev
                  </button>

                  <span
                    style={{
                      padding:
                        '6px 14px',

                      fontSize:
                        '12px',

                      color:
                        'var(--text-muted)'
                    }}
                  >
                    {page + 1} /{' '}
                    {totalPages}
                  </span>

                  <button
                    onClick={() =>
                      setPage(
                        (p) =>
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
                        '6px 14px',

                      border:
                        '1px solid var(--card-border)',

                      borderRadius:
                        '8px',

                      fontSize:
                        '12px',

                      fontWeight:
                        700,

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
                          : 'pointer'
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}