'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getMyAttendance,
  checkIn,
  checkOut,
  startBreak,
  endBreak,
  deleteMyAttendance,
  clearAllMyAttendance,
} from '@/lib/employeeApi';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

function Badge({ status }) {
  const map = {
    PRESENT: { bg: '#dcfce7', color: '#16a34a' },
    ABSENT: { bg: '#fee2e2', color: '#dc2626' },
    HALF_DAY: { bg: '#fff7ed', color: '#f59e0b' },
    LATE: { bg: '#fdf4ff', color: '#9333ea' },
  };

  const s = map[status] || {
    bg: '#f1f5f9',
    color: '#64748b',
  };

  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: '3px 12px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: '700',
      }}
    >
      {status?.replace('_', ' ')}
    </span>
  );
}

function formatDuration(mins) {
  if (mins == null) return '--';

  const h = Math.floor(mins / 60);
  const m = mins % 60;

  return h > 0 ? `${h}h ${m} min` : `${m} min`;
}

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [todayAtt, setTodayAtt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [togglingBreak, setTogglingBreak] = useState(false);
  const [showRemarks, setShowRemarks] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Delete / Clear All states
  const [deletingId, setDeletingId] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getMyAttendance(page, 10);
      const data = res.data?.data;
      const content = data?.content || [];

      setRecords(content);
      setTotalPages(data?.totalPages || 0);

      const today = new Date().toISOString().split('T')[0];

      if (page === 0) {
        const todayRecord = content.find(
          (r) => r.date === today
        );

        setTodayAtt(todayRecord || null);
      } else {
        const todayRes = await getMyAttendance(0, 5);

        const todayContent =
          todayRes.data?.data?.content || [];

        const todayRecord = todayContent.find(
          (r) => r.date === today
        );

        setTodayAtt(todayRecord || null);
      }
    } catch (err) {
      toast.error('Failed to load attendance');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAttendance();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchAttendance]);

  // =========================================================
  // DELETE INDIVIDUAL ATTENDANCE
  // =========================================================

  const handleDeleteAttendance = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this attendance record?'
    );

    if (!confirmed) return;

    setDeletingId(id);

    try {
      await deleteMyAttendance(id);

      toast.success('Attendance record deleted');

      if (records.length === 1 && page > 0) {
        setPage((currentPage) =>
          Math.max(0, currentPage - 1)
        );
      } else {
        await fetchAttendance();
      }
    } catch (err) {
      console.error(
        'Failed to delete attendance:',
        err
      );

      toast.error(
        err?.response?.data?.message ||
          'Failed to delete attendance record'
      );
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // CLEAR ALL ATTENDANCE
  // =========================================================

  const handleClearAllAttendance = async () => {
    if (records.length === 0) {
      toast.error('No attendance records to clear');
      return;
    }

    const confirmed = window.confirm(
      'Are you sure you want to clear all attendance records? This action cannot be undone.'
    );

    if (!confirmed) return;

    setClearingAll(true);

    try {
      await clearAllMyAttendance();

      toast.success(
        'All attendance records cleared'
      );

      setRecords([]);
      setTodayAtt(null);
      setPage(0);
      setTotalPages(0);
    } catch (err) {
      console.error(
        'Failed to clear attendance:',
        err
      );

      toast.error(
        err?.response?.data?.message ||
          'Failed to clear attendance records'
      );
    } finally {
      setClearingAll(false);
    }
  };

  // =========================================================
  // CHECK IN
  // =========================================================

  const handleCheckIn = async () => {
    setCheckingIn(true);

    try {
      await checkIn();

      toast.success(
        'Checked in successfully!'
      );

      fetchAttendance();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Check-in failed'
      );

      console.error(err);
    } finally {
      setCheckingIn(false);
    }
  };

  // =========================================================
  // CHECK OUT
  // =========================================================

  const handleCheckOut = async () => {
    setCheckingOut(true);

    try {
      await checkOut(remarks);

      toast.success(
        'Checked out successfully!'
      );

      setShowRemarks(false);
      setRemarks('');

      fetchAttendance();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Check-out failed'
      );

      console.error(err);
    } finally {
      setCheckingOut(false);
    }
  };

  // =========================================================
  // BREAK
  // =========================================================

  const handleToggleBreak = async () => {
    setTogglingBreak(true);

    try {
      if (todayAtt?.onBreak) {
        await endBreak();

        toast.success(
          'Break ended — welcome back!'
        );
      } else {
        await startBreak();

        toast.success(
          'Break started'
        );
      }

      fetchAttendance();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Could not update break'
      );

      console.error(err);
    } finally {
      setTogglingBreak(false);
    }
  };

  // =========================================================
  // STATS
  // =========================================================

  const presentCount = records.filter(
    (r) => r.status === 'PRESENT'
  ).length;

  const halfDayCount = records.filter(
    (r) => r.status === 'HALF_DAY'
  ).length;

  const absentCount = records.filter(
    (r) => r.status === 'ABSENT'
  ).length;

  const canBreak =
    !!todayAtt?.checkIn &&
    !todayAtt?.checkOut;

  const onBreak = !!todayAtt?.onBreak;

  return (
    <div>

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div style={{ marginBottom: '24px' }}>
        <h1
          className="text-slate-800 dark:text-slate-100"
          style={{
            fontSize: '22px',
            fontWeight: '800',
            marginBottom: '4px',
          }}
        >
          Attendance
        </h1>

        <p
          className="text-slate-400"
          style={{ fontSize: '13px' }}
        >
          Track your daily attendance and work hours
        </p>
      </div>

      {/* =====================================================
          TODAY'S CARD
      ====================================================== */}

      <div
        style={{
          background:
            'linear-gradient(135deg, #1e3a5f, #2563eb)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          color: 'white',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color:
                'rgba(255,255,255,0.7)',
              fontWeight: '600',
            }}
          >
            TODAY —{' '}
            {new Date().toLocaleDateString(
              'en-US',
              {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              }
            )}
          </div>

          {onBreak && (
            <span
              style={{
                background:
                  'rgba(245,158,11,0.2)',
                color: '#fbbf24',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700',
              }}
            >
              ⏸ On break
            </span>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >

          {/* Check in / out times */}

          <div
            style={{
              display: 'flex',
              gap: '32px',
              flexWrap: 'wrap',
            }}
          >

            {/* CHECK IN */}

            <div>
              <div
                style={{
                  fontSize: '11px',
                  color:
                    'rgba(255,255,255,0.6)',
                  marginBottom: '4px',
                }}
              >
                CHECK IN
              </div>

              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '800',
                }}
              >
                {todayAtt?.checkIn
                  ? todayAtt.checkIn.substring(
                      0,
                      5
                    )
                  : '--:--'}
              </div>
            </div>

            <div
              style={{
                width: '1px',
                background:
                  'rgba(255,255,255,0.2)',
              }}
            />

            {/* CHECK OUT */}

            <div>
              <div
                style={{
                  fontSize: '11px',
                  color:
                    'rgba(255,255,255,0.6)',
                  marginBottom: '4px',
                }}
              >
                CHECK OUT
              </div>

              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '800',
                }}
              >
                {todayAtt?.checkOut
                  ? todayAtt.checkOut.substring(
                      0,
                      5
                    )
                  : '--:--'}
              </div>
            </div>

            <div
              style={{
                width: '1px',
                background:
                  'rgba(255,255,255,0.2)',
              }}
            />

            {/* BREAK */}

            <div>
              <div
                style={{
                  fontSize: '11px',
                  color:
                    'rgba(255,255,255,0.6)',
                  marginBottom: '4px',
                }}
              >
                BREAK TIME
              </div>

              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '800',
                }}
              >
                {formatDuration(
                  todayAtt?.totalBreakMinutes ?? 0
                )}
              </div>
            </div>

            <div
              style={{
                width: '1px',
                background:
                  'rgba(255,255,255,0.2)',
              }}
            />

            {/* WORK HOURS */}

            <div>
              <div
                style={{
                  fontSize: '11px',
                  color:
                    'rgba(255,255,255,0.6)',
                  marginBottom: '4px',
                }}
              >
                WORK HOURS
              </div>

              <div
                style={{
                  fontSize: '28px',
                  fontWeight: '800',
                }}
              >
                {todayAtt?.workHours
                  ? `${todayAtt.workHours}h`
                  : '--'}
              </div>
            </div>
          </div>

          {/* =================================================
              ACTION BUTTONS
          ================================================== */}

          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >

            {/* CHECK IN */}

            <button
              onClick={handleCheckIn}
              disabled={
                loading ||
                !!todayAtt?.checkIn ||
                checkingIn
              }
              style={{
                padding: '12px 24px',
                background:
                  todayAtt?.checkIn
                    ? 'rgba(255,255,255,0.1)'
                    : 'white',
                color:
                  todayAtt?.checkIn
                    ? 'rgba(255,255,255,0.5)'
                    : '#1e3a5f',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor:
                  todayAtt?.checkIn
                    ? 'not-allowed'
                    : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {checkingIn
                ? '⏳ Checking in...'
                : todayAtt?.checkIn
                  ? '✓ Checked In'
                  : '→ Check In'}
            </button>

            {/* BREAK */}

            <button
              onClick={handleToggleBreak}
              disabled={
                loading ||
                !canBreak ||
                togglingBreak
              }
              style={{
                padding: '12px 24px',
                background:
                  !canBreak
                    ? 'rgba(255,255,255,0.1)'
                    : onBreak
                      ? '#fbbf24'
                      : 'rgba(255,255,255,0.15)',
                color:
                  !canBreak
                    ? 'rgba(255,255,255,0.4)'
                    : onBreak
                      ? '#1e3a5f'
                      : 'white',
                border:
                  '1.5px solid rgba(255,255,255,0.3)',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor:
                  !canBreak
                    ? 'not-allowed'
                    : 'pointer',
              }}
            >
              {togglingBreak
                ? '⏳'
                : onBreak
                  ? '▶ Resume work'
                  : '⏸ Take a break'}
            </button>

            {/* CHECK OUT */}

            {!showRemarks ? (
              <button
                onClick={() => {
                  if (
                    !todayAtt?.checkIn ||
                    todayAtt?.checkOut
                  ) {
                    return;
                  }

                  setShowRemarks(true);
                }}
                disabled={
                  loading ||
                  !todayAtt?.checkIn ||
                  !!todayAtt?.checkOut ||
                  checkingOut
                }
                style={{
                  padding: '12px 24px',
                  background:
                    !todayAtt?.checkIn ||
                    todayAtt?.checkOut
                      ? 'rgba(255,255,255,0.1)'
                      : 'rgba(255,255,255,0.15)',
                  color:
                    !todayAtt?.checkIn ||
                    todayAtt?.checkOut
                      ? 'rgba(255,255,255,0.4)'
                      : 'white',
                  border:
                    '1.5px solid rgba(255,255,255,0.3)',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor:
                    !todayAtt?.checkIn ||
                    todayAtt?.checkOut
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                {todayAtt?.checkOut
                  ? '✓ Checked Out'
                  : '← Check Out'}
              </button>
            ) : (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center',
                }}
              >
                <input
                  value={remarks}
                  onChange={(e) =>
                    setRemarks(e.target.value)
                  }
                  placeholder="Add remarks (optional)"
                  style={{
                    padding: '10px 14px',
                    background:
                      'rgba(255,255,255,0.15)',
                    border:
                      '1px solid rgba(255,255,255,0.3)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '13px',
                    outline: 'none',
                    width: '200px',
                  }}
                />

                <button
                  onClick={handleCheckOut}
                  disabled={checkingOut}
                  style={{
                    padding: '10px 18px',
                    background: 'white',
                    color: '#1e3a5f',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                  }}
                >
                  {checkingOut
                    ? '⏳'
                    : 'Confirm'}
                </button>

                <button
                  onClick={() =>
                    setShowRemarks(false)
                  }
                  style={{
                    padding: '10px 14px',
                    background:
                      'rgba(255,255,255,0.1)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* STATUS */}

        {todayAtt && (
          <div style={{ marginTop: '16px' }}>
            <Badge status={todayAtt.status} />

            {todayAtt.remarks && (
              <span
                style={{
                  fontSize: '12px',
                  color:
                    'rgba(255,255,255,0.7)',
                  marginLeft: '10px',
                }}
              >
                Remarks: {todayAtt.remarks}
              </span>
            )}
          </div>
        )}

        {/* TODAY'S BREAKS */}

        {todayAtt?.breaks?.length > 0 && (
          <div
            style={{
              marginTop: '16px',
              borderTop:
                '1px solid rgba(255,255,255,0.15)',
              paddingTop: '14px',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                color:
                  'rgba(255,255,255,0.6)',
                marginBottom: '8px',
                fontWeight: '600',
              }}
            >
              TODAY&apos;S BREAKS
            </div>

            {todayAtt.breaks.map((b) => (
              <div
                key={b.id}
                style={{
                  display: 'flex',
                  justifyContent:
                    'space-between',
                  alignItems: 'center',
                  fontSize: '13px',
                  padding: '4px 0',
                  color:
                    'rgba(255,255,255,0.9)',
                }}
              >
                <span>
                  {b.breakStart?.substring(0, 5)} –{' '}
                  {b.breakEnd
                    ? b.breakEnd.substring(0, 5)
                    : 'ongoing'}
                </span>

                <span
                  style={{
                    color: b.flagged
                      ? '#fca5a5'
                      : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {b.breakEnd
                    ? formatDuration(
                        b.durationMinutes
                      )
                    : ''}

                  {b.flagged
                    ? ' ⚠ long break'
                    : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================
          MONTHLY STATS
      ====================================================== */}

      <div
        style={{
          display: 'flex',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {[
          {
            label: 'Present',
            value: presentCount,
            color: '#16a34a',
            bg: '#dcfce7',
            icon: '✅',
          },
          {
            label: 'Half Day',
            value: halfDayCount,
            color: '#f59e0b',
            bg: '#fff7ed',
            icon: '⚡',
          },
          {
            label: 'Absent',
            value: absentCount,
            color: '#dc2626',
            bg: '#fee2e2',
            icon: '❌',
          },
          {
            label: 'Total Records',
            value: records.length,
            color: '#3b82f6',
            bg: '#eff6ff',
            icon: '📊',
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white dark:bg-[#171c24] border border-slate-200 dark:border-slate-700"
            style={{
              flex: 1,
              borderRadius: '12px',
              padding: '16px',
              boxShadow:
                '0 1px 4px rgba(0,0,0,0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'space-between',
                marginBottom: '10px',
              }}
            >
              <span
                className="text-slate-500 dark:text-slate-400"
                style={{
                  fontSize: '12px',
                  fontWeight: '500',
                }}
              >
                {s.label}
              </span>

              <div
                style={{
                  width: '32px',
                  height: '32px',
                  background: s.bg,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    'center',
                  fontSize: '16px',
                }}
              >
                {s.icon}
              </div>
            </div>

            <div
              style={{
                fontSize: '28px',
                fontWeight: '800',
                color: s.color,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* =====================================================
          ATTENDANCE HISTORY
      ====================================================== */}

      <div
        className="bg-white dark:bg-[#171c24] border border-slate-200 dark:border-slate-700"
        style={{
          borderRadius: '12px',
          boxShadow:
            '0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >

        {/* =================================================
            ATTENDANCE HISTORY HEADER
        ================================================== */}

        <div
          className="border-b border-slate-200 dark:border-slate-700"
          style={{
            padding: '16px 20px',
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'wrap',
          }}
        >
          <h3
            className="text-slate-800 dark:text-slate-100"
            style={{
              fontSize: '15px',
              fontWeight: '700',
              margin: 0,
            }}
          >
            Attendance History
          </h3>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <span
              className="text-slate-400 dark:text-slate-400"
              style={{
                fontSize: '12px',
              }}
            >
              {records.length} records
            </span>

            {/* =================================================
                CLEAR ALL BUTTON
            ================================================== */}

            <button
              type="button"
              onClick={
                handleClearAllAttendance
              }
              disabled={
                clearingAll ||
                records.length === 0
              }
              title="Clear all attendance"
              style={{
                height: '54px',
                minWidth: '145px',
                padding: '0 24px',
                borderRadius: '12px',
                border:
                  '1px solid #fecdd3',
                background:
                  clearingAll ||
                  records.length === 0
                    ? '#fff1f2'
                    : '#fff1f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: '700',
                cursor:
                  clearingAll ||
                  records.length === 0
                    ? 'not-allowed'
                    : 'pointer',
                opacity:
                  clearingAll ||
                  records.length === 0
                    ? 0.6
                    : 1,
              }}
            >
              <Trash2
                size={18}
                color="#dc2626"
                strokeWidth={2.5}
              />

              {clearingAll
                ? 'Clearing...'
                : 'Clear All'}
            </button>
          </div>
        </div>

        {/* =================================================
            LOADING
        ================================================== */}

        {loading ? (
          <div
            className="text-slate-400 dark:text-slate-400"
            style={{
              padding: '40px',
              textAlign: 'center',
            }}
          >
            Loading...
          </div>
        ) : records.length === 0 ? (

          /* =================================================
              EMPTY
          ================================================== */

          <div
            className="text-slate-400 dark:text-slate-400"
            style={{
              padding: '40px',
              textAlign: 'center',
            }}
          >
            No attendance records found
          </div>
        ) : (

          /* =================================================
              TABLE
          ================================================== */

          <div className="table-responsive">
            <div
              className="admin-data-table"
              style={{
                minWidth: '900px',
              }}
            >

              {/* TABLE HEADER */}

              <div
                className="bg-slate-50 dark:bg-[#0d1117] border-b border-slate-200 dark:border-slate-700"
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1.3fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 1.3fr 0.8fr',
                  padding: '10px 20px',
                  alignItems: 'center',
                }}
              >
                {[
                  'Date',
                  'Check In',
                  'Check Out',
                  'Break',
                  'Work Hours',
                  'Status',
                  'Remarks',
                  'Action',
                ].map((h) => (
                  <div
                    key={h}
                    className="text-slate-500 dark:text-slate-400"
                    style={{
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform:
                        'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {/* =================================================
                  TABLE ROWS
              ================================================== */}

              {records.map((r, i) => (
                <div
                  key={
                    r.id ||
                    r.date ||
                    i
                  }
                  className="bg-white dark:bg-[#171c24] border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#1e242d]"
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1.3fr 0.9fr 0.9fr 0.9fr 0.9fr 0.9fr 1.3fr 0.8fr',
                    padding: '12px 20px',
                    alignItems: 'center',
                  }}
                >

                  {/* DATE */}

                  <div
                    className="text-slate-800 dark:text-slate-100"
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    {new Date(
                      r.date
                    ).toLocaleDateString(
                      'en-US',
                      {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      }
                    )}
                  </div>

                  {/* CHECK IN */}

                  <div
                    style={{
                      fontSize: '13px',
                      color: '#16a34a',
                      fontWeight: '600',
                    }}
                  >
                    {r.checkIn
                      ? r.checkIn.substring(
                          0,
                          5
                        )
                      : '--'}
                  </div>

                  {/* CHECK OUT */}

                  <div
                    style={{
                      fontSize: '13px',
                      color: '#f59e0b',
                      fontWeight: '600',
                    }}
                  >
                    {r.checkOut
                      ? r.checkOut.substring(
                          0,
                          5
                        )
                      : '--'}
                  </div>

                  {/* BREAK */}

                  <div
                    className="text-slate-500 dark:text-slate-300"
                    style={{
                      fontSize: '13px',
                    }}
                  >
                    {formatDuration(
                      r.totalBreakMinutes
                    )}
                  </div>

                  {/* WORK HOURS */}

                  <div
                    className="text-slate-500 dark:text-slate-200"
                    style={{
                      fontSize: '13px',
                      fontWeight: '600',
                    }}
                  >
                    {r.workHours
                      ? `${r.workHours}h`
                      : '--'}
                  </div>

                  {/* STATUS */}

                  <div>
                    <Badge
                      status={r.status}
                    />
                  </div>

                  {/* REMARKS */}

                  <div
                    className="text-slate-400 dark:text-slate-400"
                    style={{
                      fontSize: '12px',
                    }}
                  >
                    {r.remarks || '--'}
                  </div>

                  {/* =================================================
                      INDIVIDUAL DELETE BUTTON
                  ================================================== */}

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteAttendance(
                          r.id
                        )
                      }
                      disabled={
                        deletingId ===
                          r.id ||
                        clearingAll
                      }
                      title="Delete attendance"
                      aria-label="Delete attendance"
                      style={{
                        width: '54px',
                        height: '54px',
                        borderRadius: '14px',

                        /*
                         * Visible border in both themes
                         */
                        border:
                          '1px solid #334155',

                        /*
                         * White background for light theme
                         */
                        background:
                          '#ffffff',

                        /*
                         * IMPORTANT:
                         * Red icon color
                         */
                        color:
                          '#dc2626',

                        display: 'flex',
                        alignItems:
                          'center',
                        justifyContent:
                          'center',

                        cursor:
                          deletingId ===
                            r.id ||
                          clearingAll
                            ? 'not-allowed'
                            : 'pointer',

                        opacity:
                          deletingId ===
                            r.id ||
                          clearingAll
                            ? 0.5
                            : 1,

                        transition:
                          'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (
                          deletingId !==
                            r.id &&
                          !clearingAll
                        ) {
                          e.currentTarget.style.background =
                            '#fff1f2';

                          e.currentTarget.style.borderColor =
                            '#ef4444';

                          e.currentTarget.style.color =
                            '#dc2626';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          '#ffffff';

                        e.currentTarget.style.borderColor =
                          '#334155';

                        e.currentTarget.style.color =
                          '#dc2626';
                      }}
                    >
                      {deletingId ===
                      r.id ? (
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
                          size={20}
                          color="#dc2626"
                          strokeWidth={2.5}
                          style={{
                            display:
                              'block',
                            opacity: 1,
                            visibility:
                              'visible',
                          }}
                        />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* =================================================
                PAGINATION
            ================================================== */}

            {totalPages > 1 && (
              <div
                className="bg-white dark:bg-[#171c24] border-t border-slate-200 dark:border-slate-700"
                style={{
                  padding:
                    '14px 20px',
                  display: 'flex',
                  justifyContent:
                    'center',
                  gap: '8px',
                }}
              >
                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.max(
                        0,
                        p - 1
                      )
                    )
                  }
                  disabled={page === 0}
                  className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:text-slate-300 dark:disabled:text-slate-600"
                  style={{
                    padding:
                      '6px 14px',
                    borderRadius:
                      '6px',
                    fontSize:
                      '12px',
                    fontWeight:
                      '600',
                    cursor:
                      page === 0
                        ? 'not-allowed'
                        : 'pointer',
                  }}
                >
                  ← Prev
                </button>

                <span
                  className="text-slate-500 dark:text-slate-400"
                  style={{
                    padding:
                      '6px 14px',
                    fontSize:
                      '12px',
                  }}
                >
                  Page {page + 1} of{' '}
                  {totalPages}
                </span>

                <button
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
                  className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:text-slate-300 dark:disabled:text-slate-600"
                  style={{
                    padding:
                      '6px 14px',
                    borderRadius:
                      '6px',
                    fontSize:
                      '12px',
                    fontWeight:
                      '600',
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
          </div>
        )}
      </div>
    </div>
  );
}