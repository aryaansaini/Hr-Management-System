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

import {
  CalendarDays,
  Clock3,
  LogIn,
  LogOut,
  Coffee,
  Play,
  Pause,
  Trash2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Timer,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarCheck2,
  BriefcaseBusiness,
  MessageSquareText,
  RefreshCw,
  CircleDot,
  Activity,
} from 'lucide-react';

/* =========================================================
   HELPERS
========================================================= */

function formatDuration(mins) {
  if (mins == null) return '--';

  const total = Number(mins);

  if (Number.isNaN(total)) return '--';

  const h = Math.floor(total / 60);
  const m = total % 60;

  if (h > 0) {
    return `${h}h ${m}m`;
  }

  return `${m}m`;
}

function formatTime(value) {
  if (!value) return '--:--';

  return String(value).substring(0, 5);
}

function formatDate(date) {
  if (!date) return '--';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return date;
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDay(date) {
  if (!date) return '--';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }

  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
  });
}

function formatShortDate(date) {
  if (!date) return '--';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
  const normalized = String(status || '').toUpperCase();

  const config = {
    PRESENT: {
      label: 'Present',
      icon: CheckCircle2,
      className: 'attendance-status-present',
    },
    ABSENT: {
      label: 'Absent',
      icon: XCircle,
      className: 'attendance-status-absent',
    },
    HALF_DAY: {
      label: 'Half Day',
      icon: AlertCircle,
      className: 'attendance-status-half',
    },
    LATE: {
      label: 'Late',
      icon: Clock3,
      className: 'attendance-status-late',
    },
  };

  const item = config[normalized] || {
    label: normalized
      ? normalized.replaceAll('_', ' ')
      : 'Unknown',
    icon: CircleDot,
    className: 'attendance-status-default',
  };

  const Icon = item.icon;

  return (
    <span className={`attendance-status ${item.className}`}>
      <Icon size={13} strokeWidth={2.5} />
      {item.label}
    </span>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  type = 'blue',
}) {
  return (
    <div className="attendance-stat-card">
      <div className={`attendance-stat-icon ${type}`}>
        <Icon size={19} strokeWidth={2} />
      </div>

      <div className="attendance-stat-content">
        <span className="attendance-stat-label">
          {label}
        </span>

        <strong className="attendance-stat-value">
          {value}
        </strong>

        {description && (
          <span className="attendance-stat-description">
            {description}
          </span>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   TODAY METRIC
========================================================= */

function TodayMetric({
  icon: Icon,
  label,
  value,
  muted = false,
}) {
  return (
    <div className="today-metric">
      <div className="today-metric-icon">
        <Icon size={17} strokeWidth={2} />
      </div>

      <div>
        <span className="today-metric-label">
          {label}
        </span>

        <strong
          className={
            muted
              ? 'today-metric-value muted'
              : 'today-metric-value'
          }
        >
          {value}
        </strong>
      </div>
    </div>
  );
}

/* =========================================================
   ATTENDANCE PAGE
========================================================= */

export default function AttendancePage() {
  const [records, setRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [todayAtt, setTodayAtt] = useState(null);

  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [togglingBreak, setTogglingBreak] = useState(false);

  const [showRemarks, setShowRemarks] = useState(false);
  const [remarks, setRemarks] = useState('');

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [deletingId, setDeletingId] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);

  /* =========================================================
     FETCH ATTENDANCE
  ========================================================= */

  const fetchAttendance = useCallback(async () => {
    setLoading(true);

    try {
      const res = await getMyAttendance(page, 10);

      const data = res.data?.data;
      const content = data?.content || [];

      setRecords(content);
      setTotalPages(data?.totalPages || 0);

      // Fetch all records for accurate global stats (Present, Absent, etc.)
      const allRes = await getMyAttendance(0, 10000);
      setAllRecords(allRes.data?.data?.content || []);

      const today = new Date()
        .toISOString()
        .split('T')[0];

      if (page === 0) {
        const todayRecord = content.find(
          (record) => record.date === today
        );

        setTodayAtt(todayRecord || null);
      } else {
        const todayRes = await getMyAttendance(0, 5);

        const todayContent =
          todayRes.data?.data?.content || [];

        const todayRecord = todayContent.find(
          (record) => record.date === today
        );

        setTodayAtt(todayRecord || null);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load attendance');
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

  /* =========================================================
     CHECK IN
  ========================================================= */

  const handleCheckIn = async () => {
    setCheckingIn(true);

    try {
      await checkIn();

      toast.success('Checked in successfully!');

      await fetchAttendance();
    } catch (err) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          'Check-in failed'
      );
    } finally {
      setCheckingIn(false);
    }
  };

  /* =========================================================
     CHECK OUT
  ========================================================= */

  const handleCheckOut = async () => {
    setCheckingOut(true);

    try {
      await checkOut(remarks);

      toast.success('Checked out successfully!');

      setShowRemarks(false);
      setRemarks('');

      await fetchAttendance();
    } catch (err) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          'Check-out failed'
      );
    } finally {
      setCheckingOut(false);
    }
  };

  /* =========================================================
     BREAK
  ========================================================= */

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

        toast.success('Break started');
      }

      await fetchAttendance();
    } catch (err) {
      console.error(err);

      toast.error(
        err?.response?.data?.message ||
          'Could not update break'
      );
    } finally {
      setTogglingBreak(false);
    }
  };

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDeleteAttendance = async (id) => {
    if (!id) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this attendance record?'
    );

    if (!confirmed) return;

    setDeletingId(id);

    try {
      await deleteMyAttendance(id);

      toast.success(
        'Attendance record deleted'
      );

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

  /* =========================================================
     CLEAR ALL
  ========================================================= */

  const handleClearAllAttendance = async () => {
    if (records.length === 0) {
      toast.error(
        'No attendance records to clear'
      );
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

  /* =========================================================
     CALCULATIONS
  ========================================================= */

  const presentCount = allRecords.filter(
    (record) => record.status === 'PRESENT'
  ).length;

  const halfDayCount = allRecords.filter(
    (record) => record.status === 'HALF_DAY'
  ).length;

  const absentCount = allRecords.filter(
    (record) => record.status === 'ABSENT'
  ).length;

  const lateCount = allRecords.filter(
    (record) => record.status === 'LATE'
  ).length;

  const totalBreakMinutes = Number(
    todayAtt?.totalBreakMinutes || 0
  );

  const canBreak =
    !!todayAtt?.checkIn &&
    !todayAtt?.checkOut;

  const onBreak = !!todayAtt?.onBreak;

  const hasCheckedIn = !!todayAtt?.checkIn;
  const hasCheckedOut = !!todayAtt?.checkOut;

  /* =========================================================
     CURRENT DATE
  ========================================================= */

  const currentDate = new Date();

  const headerDate =
    currentDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  const monthName =
    currentDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      <style jsx global>{`
        /* =====================================================
           PAGE
        ===================================================== */

        .attendance-page {
          --att-bg: #f7f9fc;
          --att-card: #ffffff;
          --att-surface: #f8fafc;
          --att-surface-2: #f1f5f9;
          --att-border: #e5eaf1;
          --att-border-strong: #d8dee8;

          --att-text: #172033;
          --att-text-2: #475569;
          --att-muted: #8994a6;
          --att-faint: #a8b1bf;

          --att-primary: #2563eb;
          --att-primary-dark: #1d4ed8;
          --att-primary-soft: #eff6ff;

          --att-green: #16a34a;
          --att-green-soft: #ecfdf3;

          --att-orange: #d97706;
          --att-orange-soft: #fff7ed;

          --att-red: #dc2626;
          --att-red-soft: #fef2f2;

          --att-purple: #7c3aed;
          --att-purple-soft: #f5f3ff;

          --att-shadow:
            0 1px 2px rgba(15, 23, 42, 0.03),
            0 8px 24px rgba(15, 23, 42, 0.04);

          min-height: 100%;
          color: var(--att-text);
        }

        .dark .attendance-page {
          --att-bg: #0b1220;
          --att-card: #111827;
          --att-surface: #0f172a;
          --att-surface-2: #172033;
          --att-border: #243047;
          --att-border-strong: #334155;

          --att-text: #f8fafc;
          --att-text-2: #cbd5e1;
          --att-muted: #94a3b8;
          --att-faint: #64748b;

          --att-primary: #60a5fa;
          --att-primary-dark: #3b82f6;
          --att-primary-soft: rgba(37, 99, 235, 0.12);

          --att-green: #4ade80;
          --att-green-soft: rgba(22, 163, 74, 0.12);

          --att-orange: #fbbf24;
          --att-orange-soft: rgba(217, 119, 6, 0.12);

          --att-red: #f87171;
          --att-red-soft: rgba(220, 38, 38, 0.12);

          --att-purple: #a78bfa;
          --att-purple-soft: rgba(124, 58, 237, 0.12);

          --att-shadow:
            0 1px 2px rgba(0, 0, 0, 0.15),
            0 10px 30px rgba(0, 0, 0, 0.14);
        }

        .attendance-page,
        .attendance-page *,
        .attendance-page *::before,
        .attendance-page *::after {
          box-sizing: border-box;
        }

        .attendance-page button,
        .attendance-page input {
          font-family: inherit;
        }

        /* =====================================================
           HEADER
        ===================================================== */

        .attendance-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 26px;
        }

        .attendance-heading {
          display: flex;
          align-items: flex-start;
          gap: 13px;
        }

        .attendance-heading-icon {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--att-border);
          border-radius: 11px;
          background: var(--att-card);
          color: var(--att-primary);
          box-shadow: var(--att-shadow);
        }

        .attendance-title {
          margin: 0;
          font-size: 24px;
          line-height: 1.2;
          font-weight: 750;
          letter-spacing: -0.5px;
          color: var(--att-text);
        }

        .attendance-subtitle {
          margin: 6px 0 0;
          color: var(--att-muted);
          font-size: 13px;
          line-height: 1.5;
        }

        .attendance-date {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 38px;
          padding: 0 12px;
          border: 1px solid var(--att-border);
          border-radius: 9px;
          background: var(--att-card);
          color: var(--att-text-2);
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
        }

        /* =====================================================
           TODAY WORKSPACE
        ===================================================== */

        .today-workspace {
          position: relative;
          overflow: hidden;
          display: grid;
          grid-template-columns: minmax(0, 1fr) 360px;
          gap: 0;
          min-height: 315px;
          margin-bottom: 20px;
          border: 1px solid var(--att-border);
          border-radius: 16px;
          background: var(--att-card);
          box-shadow: var(--att-shadow);
        }

        .today-main {
          padding: 25px 28px 24px;
        }

        .today-side {
          padding: 25px 24px;
          border-left: 1px solid var(--att-border);
          background: var(--att-surface);
        }

        .today-topline {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 26px;
        }

        .today-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--att-muted);
          font-size: 11px;
          font-weight: 750;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .today-label-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--att-green);
          box-shadow: 0 0 0 4px var(--att-green-soft);
        }

        .today-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 10px;
          border-radius: 7px;
          background: var(--att-green-soft);
          color: var(--att-green);
          font-size: 11px;
          font-weight: 700;
        }

        .today-status.break {
          background: var(--att-orange-soft);
          color: var(--att-orange);
        }

        .today-status.done {
          background: var(--att-primary-soft);
          color: var(--att-primary);
        }

        .today-hero {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 30px;
          margin-bottom: 30px;
        }

        .today-clock-label {
          display: block;
          margin-bottom: 5px;
          color: var(--att-muted);
          font-size: 11px;
          font-weight: 650;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .today-clock {
          margin: 0;
          color: var(--att-text);
          font-size: 42px;
          line-height: 1;
          font-weight: 800;
          letter-spacing: -1.5px;
        }

        .today-date-line {
          margin-top: 9px;
          color: var(--att-muted);
          font-size: 12px;
        }

        .today-metrics {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          border-top: 1px solid var(--att-border);
          padding-top: 22px;
        }

        .today-metric {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          padding-right: 18px;
          border-right: 1px solid var(--att-border);
        }

        .today-metric:not(:first-child) {
          padding-left: 18px;
        }

        .today-metric:last-child {
          border-right: none;
          padding-right: 0;
        }

        .today-metric-icon {
          width: 34px;
          height: 34px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--att-border);
          border-radius: 9px;
          background: var(--att-surface);
          color: var(--att-primary);
        }

        .today-metric-label {
          display: block;
          margin-bottom: 3px;
          color: var(--att-muted);
          font-size: 10px;
          font-weight: 650;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .today-metric-value {
          display: block;
          color: var(--att-text);
          font-size: 15px;
          line-height: 1.2;
          font-weight: 750;
        }

        .today-metric-value.muted {
          color: var(--att-faint);
        }

        /* =====================================================
           ACTION PANEL
        ===================================================== */

        .action-panel-title {
          margin: 0 0 5px;
          color: var(--att-text);
          font-size: 14px;
          font-weight: 750;
        }

        .action-panel-description {
          margin: 0 0 20px;
          color: var(--att-muted);
          font-size: 11px;
          line-height: 1.5;
        }

        .action-stack {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .attendance-action {
          width: 100%;
          min-height: 43px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition:
            transform 0.15s ease,
            background 0.15s ease,
            border-color 0.15s ease,
            opacity 0.15s ease;
        }

        .attendance-action:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .attendance-action:disabled {
          cursor: not-allowed;
          opacity: 0.48;
          transform: none;
        }

        .attendance-action.primary {
          border: 1px solid var(--att-primary);
          background: var(--att-primary);
          color: #ffffff;
        }

        .attendance-action.primary:hover:not(:disabled) {
          background: var(--att-primary-dark);
          border-color: var(--att-primary-dark);
        }

        .attendance-action.secondary {
          border: 1px solid var(--att-border-strong);
          background: var(--att-card);
          color: var(--att-text-2);
        }

        .attendance-action.secondary:hover:not(:disabled) {
          border-color: var(--att-primary);
          color: var(--att-primary);
        }

        .attendance-action.break {
          border: 1px solid rgba(217, 119, 6, 0.35);
          background: var(--att-orange-soft);
          color: var(--att-orange);
        }

        .attendance-action.break.resume {
          border-color: rgba(22, 163, 74, 0.35);
          background: var(--att-green-soft);
          color: var(--att-green);
        }

        .remarks-box {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .remarks-input {
          width: 100%;
          height: 43px;
          padding: 0 12px;
          border: 1px solid var(--att-border-strong);
          border-radius: 9px;
          outline: none;
          background: var(--att-card);
          color: var(--att-text);
          font-size: 12px;
          transition:
            border-color 0.15s ease,
            box-shadow 0.15s ease;
        }

        .remarks-input::placeholder {
          color: var(--att-faint);
        }

        .remarks-input:focus {
          border-color: var(--att-primary);
          box-shadow:
            0 0 0 3px
            rgba(37, 99, 235, 0.1);
        }

        .remarks-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .remarks-buttons button {
          min-height: 38px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .remarks-confirm {
          border: 1px solid var(--att-primary);
          background: var(--att-primary);
          color: #fff;
        }

        .remarks-cancel {
          border: 1px solid var(--att-border-strong);
          background: var(--att-card);
          color: var(--att-text-2);
        }

        /* =====================================================
           BREAK INFO
        ===================================================== */

        .break-list {
          margin-top: 22px;
          padding-top: 18px;
          border-top: 1px solid var(--att-border);
        }

        .break-list-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .break-list-title span:first-child {
          color: var(--att-text-2);
          font-size: 11px;
          font-weight: 750;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .break-list-count {
          color: var(--att-muted);
          font-size: 10px;
        }

        .break-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 9px 0;
          border-bottom: 1px solid var(--att-border);
        }

        .break-row:last-child {
          border-bottom: none;
        }

        .break-time {
          color: var(--att-text-2);
          font-size: 11px;
          font-weight: 650;
        }

        .break-duration {
          color: var(--att-muted);
          font-size: 10px;
        }

        .break-duration.flagged {
          color: var(--att-red);
          font-weight: 650;
        }

        /* =====================================================
           STATS
        ===================================================== */

        .section-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin: 26px 0 12px;
        }

        .section-heading-left h2 {
          margin: 0;
          color: var(--att-text);
          font-size: 14px;
          font-weight: 750;
        }

        .section-heading-left p {
          margin: 3px 0 0;
          color: var(--att-muted);
          font-size: 11px;
        }

        .attendance-stats {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .attendance-stat-card {
          display: flex;
          align-items: center;
          gap: 13px;
          min-height: 95px;
          padding: 17px;
          border: 1px solid var(--att-border);
          border-radius: 12px;
          background: var(--att-card);
          box-shadow: var(--att-shadow);
        }

        .attendance-stat-icon {
          width: 40px;
          height: 40px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
        }

        .attendance-stat-icon.blue {
          background: var(--att-primary-soft);
          color: var(--att-primary);
        }

        .attendance-stat-icon.green {
          background: var(--att-green-soft);
          color: var(--att-green);
        }

        .attendance-stat-icon.orange {
          background: var(--att-orange-soft);
          color: var(--att-orange);
        }

        .attendance-stat-icon.red {
          background: var(--att-red-soft);
          color: var(--att-red);
        }

        .attendance-stat-icon.purple {
          background: var(--att-purple-soft);
          color: var(--att-purple);
        }

        .attendance-stat-content {
          min-width: 0;
        }

        .attendance-stat-label {
          display: block;
          margin-bottom: 3px;
          color: var(--att-muted);
          font-size: 10px;
          font-weight: 650;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .attendance-stat-value {
          display: block;
          color: var(--att-text);
          font-size: 22px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -0.4px;
        }

        .attendance-stat-description {
          display: block;
          margin-top: 3px;
          color: var(--att-faint);
          font-size: 9px;
        }

        /* =====================================================
           HISTORY CARD
        ===================================================== */

        .history-card {
          overflow: hidden;
          margin-bottom: 30px;
          border: 1px solid var(--att-border);
          border-radius: 14px;
          background: var(--att-card);
          box-shadow: var(--att-shadow);
        }

        .history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          min-height: 67px;
          padding: 13px 18px;
          border-bottom: 1px solid var(--att-border);
        }

        .history-title-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .history-title-icon {
          width: 33px;
          height: 33px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          background: var(--att-primary-soft);
          color: var(--att-primary);
        }

        .history-title {
          margin: 0;
          color: var(--att-text);
          font-size: 13px;
          font-weight: 750;
        }

        .history-count {
          margin-top: 2px;
          color: var(--att-muted);
          font-size: 10px;
        }

        .history-tools {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .clear-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-height: 34px;
          padding: 0 10px;
          border: 1px solid
            rgba(220, 38, 38, 0.25);
          border-radius: 8px;
          background: var(--att-red-soft);
          color: var(--att-red);
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .clear-button:hover:not(:disabled) {
          border-color: var(--att-red);
        }

        .clear-button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }

        /* =====================================================
           TABLE
        ===================================================== */

        .attendance-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }

        .attendance-table {
          width: 100%;
          min-width: 850px;
          border-collapse: collapse;
        }

        .attendance-table th {
          height: 42px;
          padding: 0 15px;
          border-bottom: 1px solid var(--att-border);
          background: var(--att-surface);
          color: var(--att-muted);
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 0.06em;
          text-align: left;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .attendance-table td {
          height: 66px;
          padding: 0 15px;
          border-bottom: 1px solid var(--att-border);
          color: var(--att-text-2);
          font-size: 11px;
          vertical-align: middle;
        }

        .attendance-table tbody tr {
          transition: background 0.15s ease;
        }

        .attendance-table tbody tr:hover {
          background: var(--att-surface);
        }

        .attendance-table tbody tr:last-child td {
          border-bottom: none;
        }

        .date-cell {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .date-square {
          width: 35px;
          height: 35px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--att-border);
          border-radius: 8px;
          background: var(--att-surface);
        }

        .date-square-day {
          color: var(--att-primary);
          font-size: 8px;
          font-weight: 750;
          text-transform: uppercase;
        }

        .date-square-number {
          color: var(--att-text);
          font-size: 13px;
          line-height: 1;
          font-weight: 800;
        }

        .date-main {
          color: var(--att-text);
          font-size: 11px;
          font-weight: 700;
        }

        .date-sub {
          margin-top: 2px;
          color: var(--att-muted);
          font-size: 9px;
        }

        .time-cell {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-weight: 700;
        }

        .time-cell.in {
          color: var(--att-green);
        }

        .time-cell.out {
          color: var(--att-orange);
        }

        .hours-cell {
          color: var(--att-text);
          font-weight: 750;
        }

        .remark-cell {
          max-width: 180px;
          overflow: hidden;
          color: var(--att-muted);
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .delete-button {
          width: 32px;
          height: 32px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid
            rgba(220, 38, 38, 0.22);
          border-radius: 8px;
          background: transparent;
          color: var(--att-red);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .delete-button:hover:not(:disabled) {
          background: var(--att-red-soft);
          border-color: var(--att-red);
        }

        .delete-button:disabled {
          cursor: not-allowed;
          opacity: 0.45;
        }

        /* =====================================================
           STATUS
        ===================================================== */

        .attendance-status {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-height: 25px;
          padding: 0 8px;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 750;
          white-space: nowrap;
        }

        .attendance-status-present {
          background: var(--att-green-soft);
          color: var(--att-green);
        }

        .attendance-status-absent {
          background: var(--att-red-soft);
          color: var(--att-red);
        }

        .attendance-status-half {
          background: var(--att-orange-soft);
          color: var(--att-orange);
        }

        .attendance-status-late {
          background: var(--att-purple-soft);
          color: var(--att-purple);
        }

        .attendance-status-default {
          background: var(--att-surface-2);
          color: var(--att-muted);
        }

        /* =====================================================
           EMPTY / LOADING
        ===================================================== */

        .attendance-loading,
        .attendance-empty {
          min-height: 270px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
          text-align: center;
        }

        .loading-icon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          border-radius: 11px;
          background: var(--att-primary-soft);
          color: var(--att-primary);
        }

        .loading-icon svg {
          animation: attendance-spin 1s linear infinite;
        }

        .empty-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          border: 1px solid var(--att-border);
          border-radius: 12px;
          background: var(--att-surface);
          color: var(--att-muted);
        }

        .empty-title {
          margin: 0 0 4px;
          color: var(--att-text);
          font-size: 13px;
          font-weight: 750;
        }

        .empty-text {
          margin: 0;
          color: var(--att-muted);
          font-size: 11px;
        }

        /* =====================================================
           PAGINATION
        ===================================================== */

        .pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          min-height: 58px;
          padding: 10px 18px;
          border-top: 1px solid var(--att-border);
        }

        .pagination-info {
          color: var(--att-muted);
          font-size: 10px;
        }

        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .page-button {
          width: 31px;
          height: 31px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--att-border);
          border-radius: 7px;
          background: var(--att-card);
          color: var(--att-text-2);
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .page-button:hover:not(:disabled) {
          border-color: var(--att-primary);
          color: var(--att-primary);
        }

        .page-button:disabled {
          cursor: not-allowed;
          opacity: 0.4;
        }

        .page-number {
          min-width: 31px;
          height: 31px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 7px;
          background: var(--att-primary);
          color: #fff;
          font-size: 10px;
          font-weight: 750;
        }

        /* =====================================================
           RESPONSIVE
        ===================================================== */

        @media (max-width: 1100px) {
          .today-workspace {
            grid-template-columns: 1fr;
          }

          .today-side {
            border-top: 1px solid var(--att-border);
            border-left: none;
          }

          .action-stack {
            display: grid;
            grid-template-columns:
              repeat(3, minmax(0, 1fr));
          }

          .remarks-box {
            grid-column: 1 / -1;
          }

          .attendance-stats {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .attendance-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .attendance-date {
            width: 100%;
          }

          .today-main {
            padding: 20px;
          }

          .today-side {
            padding: 20px;
          }

          .today-hero {
            align-items: flex-start;
            flex-direction: column;
            margin-bottom: 24px;
          }

          .today-clock {
            font-size: 36px;
          }

          .today-metrics {
            grid-template-columns:
              repeat(2, minmax(0, 1fr));
            gap: 16px 0;
          }

          .today-metric:nth-child(2) {
            border-right: none;
          }

          .today-metric:nth-child(3) {
            padding-left: 0;
          }

          .action-stack {
            grid-template-columns: 1fr;
          }

          .attendance-stats {
            grid-template-columns: 1fr;
          }

          .history-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .history-tools {
            width: 100%;
            justify-content: space-between;
          }

          .pagination {
            align-items: flex-start;
            flex-direction: column;
          }

          .pagination-controls {
            width: 100%;
            justify-content: flex-end;
          }
        }

        @media (max-width: 480px) {
          .attendance-title {
            font-size: 21px;
          }

          .attendance-heading-icon {
            width: 38px;
            height: 38px;
          }

          .today-clock {
            font-size: 32px;
          }

          .today-metrics {
            grid-template-columns: 1fr;
          }

          .today-metric,
          .today-metric:not(:first-child) {
            padding: 0 0 12px;
            border-right: none;
            border-bottom: 1px solid var(--att-border);
          }

          .today-metric:last-child {
            padding-bottom: 0;
            border-bottom: none;
          }

          .attendance-stat-card {
            min-height: 85px;
          }
        }

        @keyframes attendance-spin {
          from {
            transform: rotate(0deg);
          }

          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <div className="attendance-page">
        {/* =====================================================
            PAGE HEADER
        ====================================================== */}

        <header className="attendance-header">
          <div className="attendance-heading">
            <div className="attendance-heading-icon">
              <CalendarCheck2
                size={21}
                strokeWidth={2}
              />
            </div>

            <div>
              <h1 className="attendance-title">
                Attendance
              </h1>

              <p className="attendance-subtitle">
                Manage your daily attendance, breaks
                and working hours.
              </p>
            </div>
          </div>

          <div className="attendance-date">
            <CalendarDays size={14} />
            {headerDate}
          </div>
        </header>

        {/* =====================================================
            TODAY WORKSPACE
        ====================================================== */}

        <section className="today-workspace">
          <div className="today-main">
            <div className="today-topline">
              <div className="today-label">
                <span className="today-label-dot" />
                Today's Attendance
              </div>

              {onBreak ? (
                <div className="today-status break">
                  <Pause size={12} />
                  Currently on break
                </div>
              ) : hasCheckedOut ? (
                <div className="today-status done">
                  <CheckCircle2 size={12} />
                  Day completed
                </div>
              ) : hasCheckedIn ? (
                <div className="today-status">
                  <Activity size={12} />
                  Working
                </div>
              ) : (
                <div className="today-status done">
                  <CircleDot size={12} />
                  Not checked in
                </div>
              )}
            </div>

            <div className="today-hero">
              <div>
                <span className="today-clock-label">
                  Current work hours
                </span>

                <h2 className="today-clock">
                  {todayAtt?.workHours
                    ? `${todayAtt.workHours}h`
                    : '--'}
                </h2>

                <div className="today-date-line">
                  {headerDate}
                </div>
              </div>
            </div>

            <div className="today-metrics">
              <TodayMetric
                icon={LogIn}
                label="Check in"
                value={formatTime(
                  todayAtt?.checkIn
                )}
                muted={!todayAtt?.checkIn}
              />

              <TodayMetric
                icon={LogOut}
                label="Check out"
                value={formatTime(
                  todayAtt?.checkOut
                )}
                muted={!todayAtt?.checkOut}
              />

              <TodayMetric
                icon={Coffee}
                label="Break time"
                value={formatDuration(
                  totalBreakMinutes
                )}
              />

              <TodayMetric
                icon={Timer}
                label="Work hours"
                value={
                  todayAtt?.workHours
                    ? `${todayAtt.workHours}h`
                    : '--'
                }
                muted={!todayAtt?.workHours}
              />
            </div>

            {/* TODAY BREAKS */}

            {todayAtt?.breaks?.length > 0 && (
              <div className="break-list">
                <div className="break-list-title">
                  <span>Today's breaks</span>

                  <span className="break-list-count">
                    {todayAtt.breaks.length}{' '}
                    {todayAtt.breaks.length === 1
                      ? 'break'
                      : 'breaks'}
                  </span>
                </div>

                {todayAtt.breaks.map((breakItem) => (
                  <div
                    className="break-row"
                    key={breakItem.id}
                  >
                    <div className="break-time">
                      {formatTime(
                        breakItem.breakStart
                      )}{' '}
                      –{' '}
                      {breakItem.breakEnd
                        ? formatTime(
                            breakItem.breakEnd
                          )
                        : 'Ongoing'}
                    </div>

                    <div
                      className={
                        breakItem.flagged
                          ? 'break-duration flagged'
                          : 'break-duration'
                      }
                    >
                      {breakItem.breakEnd
                        ? formatDuration(
                            breakItem.durationMinutes
                          )
                        : 'In progress'}

                      {breakItem.flagged &&
                        ' · Long break'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ===================================================
              ACTION PANEL
          ==================================================== */}

          <aside className="today-side">
            <h3 className="action-panel-title">
              Attendance actions
            </h3>

            <p className="action-panel-description">
              Record your work status for today.
            </p>

            {!showRemarks ? (
              <div className="action-stack">
                <button
                  type="button"
                  className="attendance-action primary"
                  onClick={handleCheckIn}
                  disabled={
                    loading ||
                    hasCheckedIn ||
                    checkingIn
                  }
                >
                  {checkingIn ? (
                    <>
                      <RefreshCw
                        size={15}
                        className="attendance-spin"
                      />
                      Checking in...
                    </>
                  ) : (
                    <>
                      <LogIn size={16} />
                      {hasCheckedIn
                        ? 'Checked in'
                        : 'Check in'}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className={
                    onBreak
                      ? 'attendance-action break resume'
                      : 'attendance-action break'
                  }
                  onClick={handleToggleBreak}
                  disabled={
                    loading ||
                    !canBreak ||
                    togglingBreak
                  }
                >
                  {togglingBreak ? (
                    <>
                      <RefreshCw size={15} />
                      Updating...
                    </>
                  ) : onBreak ? (
                    <>
                      <Play size={15} />
                      Resume work
                    </>
                  ) : (
                    <>
                      <Pause size={15} />
                      Take a break
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="attendance-action secondary"
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
                >
                  <LogOut size={16} />

                  {hasCheckedOut
                    ? 'Checked out'
                    : 'Check out'}
                </button>
              </div>
            ) : (
              <div className="remarks-box">
                <input
                  type="text"
                  value={remarks}
                  onChange={(event) =>
                    setRemarks(event.target.value)
                  }
                  placeholder="Add a remark (optional)"
                  className="remarks-input"
                  autoFocus
                />

                <div className="remarks-buttons">
                  <button
                    type="button"
                    className="remarks-confirm"
                    onClick={handleCheckOut}
                    disabled={checkingOut}
                  >
                    {checkingOut
                      ? 'Checking out...'
                      : 'Confirm checkout'}
                  </button>

                  <button
                    type="button"
                    className="remarks-cancel"
                    onClick={() => {
                      setShowRemarks(false);
                      setRemarks('');
                    }}
                    disabled={checkingOut}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {todayAtt?.remarks && (
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginTop: '18px',
                  paddingTop: '15px',
                  borderTop:
                    '1px solid var(--att-border)',
                }}
              >
                <MessageSquareText
                  size={14}
                  color="var(--att-muted)"
                  style={{
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                />

                <div>
                  <div
                    style={{
                      marginBottom: 3,
                      color:
                        'var(--att-muted)',
                      fontSize: 9,
                      fontWeight: 700,
                      textTransform:
                        'uppercase',
                    }}
                  >
                    Remarks
                  </div>

                  <div
                    style={{
                      color:
                        'var(--att-text-2)',
                      fontSize: 10,
                      lineHeight: 1.5,
                    }}
                  >
                    {todayAtt.remarks}
                  </div>
                </div>
              </div>
            )}
          </aside>
        </section>

        {/* =====================================================
            MONTHLY OVERVIEW
        ====================================================== */}

        <div className="section-heading">
          <div className="section-heading-left">
            <h2>Attendance overview</h2>

            <p>
              {monthName} attendance summary
            </p>
          </div>
        </div>

        <section className="attendance-stats">
          <StatCard
            label="Present"
            value={presentCount}
            description="Days marked present"
            icon={CheckCircle2}
            type="green"
          />

          <StatCard
            label="Half days"
            value={halfDayCount}
            description="Partial attendance"
            icon={AlertCircle}
            type="orange"
          />

          <StatCard
            label="Absent"
            value={absentCount}
            description="Days marked absent"
            icon={XCircle}
            type="red"
          />

          <StatCard
            label="Late"
            value={lateCount}
            description="Late attendance"
            icon={Clock3}
            type="purple"
          />
        </section>

        {/* =====================================================
            ATTENDANCE HISTORY
        ====================================================== */}

        <section className="history-card">
          <div className="history-header">
            <div className="history-title-wrap">
              <div className="history-title-icon">
                <BriefcaseBusiness
                  size={16}
                  strokeWidth={2}
                />
              </div>

              <div>
                <h2 className="history-title">
                  Attendance history
                </h2>

                <div className="history-count">
                  {records.length} records on this
                  page
                </div>
              </div>
            </div>

            <div className="history-tools">
              <button
                type="button"
                className="clear-button"
                onClick={
                  handleClearAllAttendance
                }
                disabled={
                  clearingAll ||
                  records.length === 0
                }
              >
                <Trash2
                  size={13}
                  strokeWidth={2.2}
                />

                {clearingAll
                  ? 'Clearing...'
                  : 'Clear all'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="attendance-loading">
              <div className="loading-icon">
                <RefreshCw size={19} />
              </div>

              <h3 className="empty-title">
                Loading attendance
              </h3>

              <p className="empty-text">
                Please wait while your attendance
                records are loaded.
              </p>
            </div>
          ) : records.length === 0 ? (
            <div className="attendance-empty">
              <div className="empty-icon">
                <CalendarDays size={22} />
              </div>

              <h3 className="empty-title">
                No attendance records
              </h3>

              <p className="empty-text">
                Your attendance history will appear
                here once you check in.
              </p>
            </div>
          ) : (
            <>
              <div className="attendance-table-wrapper">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Check in</th>
                      <th>Check out</th>
                      <th>Break</th>
                      <th>Work hours</th>
                      <th>Status</th>
                      <th>Remarks</th>
                      <th />
                    </tr>
                  </thead>

                  <tbody>
                    {records.map((record, index) => {
                      const parsedDate =
                        new Date(record.date);

                      const dayNumber =
                        Number.isNaN(
                          parsedDate.getTime()
                        )
                          ? '--'
                          : parsedDate.getDate();

                      return (
                        <tr
                          key={
                            record.id ||
                            record.date ||
                            index
                          }
                        >
                          {/* DATE */}

                          <td>
                            <div className="date-cell">
                              <div className="date-square">
                                <span className="date-square-day">
                                  {formatDay(
                                    record.date
                                  )}
                                </span>

                                <span className="date-square-number">
                                  {dayNumber}
                                </span>
                              </div>

                              <div>
                                <div className="date-main">
                                  {formatShortDate(
                                    record.date
                                  )}
                                </div>

                                <div className="date-sub">
                                  {formatDate(
                                    record.date
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* CHECK IN */}

                          <td>
                            <span className="time-cell in">
                              <LogIn
                                size={13}
                              />

                              {formatTime(
                                record.checkIn
                              )}
                            </span>
                          </td>

                          {/* CHECK OUT */}

                          <td>
                            <span className="time-cell out">
                              <LogOut
                                size={13}
                              />

                              {formatTime(
                                record.checkOut
                              )}
                            </span>
                          </td>

                          {/* BREAK */}

                          <td>
                            <span
                              style={{
                                display:
                                  'inline-flex',
                                alignItems:
                                  'center',
                                gap: 5,
                              }}
                            >
                              <Coffee
                                size={13}
                                color="var(--att-muted)"
                              />

                              {formatDuration(
                                record.totalBreakMinutes
                              )}
                            </span>
                          </td>

                          {/* WORK HOURS */}

                          <td>
                            <span className="hours-cell">
                              {record.workHours
                                ? `${record.workHours}h`
                                : '--'}
                            </span>
                          </td>

                          {/* STATUS */}

                          <td>
                            <StatusBadge
                              status={
                                record.status
                              }
                            />
                          </td>

                          {/* REMARKS */}

                          <td>
                            <div
                              className="remark-cell"
                              title={
                                record.remarks ||
                                ''
                              }
                            >
                              {record.remarks ||
                                'No remarks'}
                            </div>
                          </td>

                          {/* DELETE */}

                          <td>
                            <button
                              type="button"
                              className="delete-button"
                              title="Delete attendance"
                              aria-label="Delete attendance"
                              onClick={() =>
                                handleDeleteAttendance(
                                  record.id
                                )
                              }
                              disabled={
                                deletingId ===
                                  record.id ||
                                clearingAll
                              }
                            >
                              {deletingId ===
                              record.id ? (
                                <RefreshCw
                                  size={14}
                                  style={{
                                    animation:
                                      'attendance-spin 1s linear infinite',
                                  }}
                                />
                              ) : (
                                <Trash2
                                  size={14}
                                  strokeWidth={2}
                                />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* =================================================
                  PAGINATION
              ================================================== */}
              {totalPages > 1 && (
                <div className="pagination">
                  <span className="pagination-info">
                    Page {page + 1} of{' '}
                    {totalPages}
                  </span>
                  <div className="pagination-controls">
                    <button
                      type="button"
                      className="page-button"
                      onClick={() =>
                        setPage((currentPage) =>
                          Math.max(
                            0,
                            currentPage - 1
                          )
                        )
                      }
                      disabled={page === 0}
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="page-number">
                      {page + 1}
                    </span>

                    <button
                      type="button"
                      className="page-button"
                      onClick={() =>
                        setPage((currentPage) =>
                          Math.min(
                            totalPages - 1,
                            currentPage + 1
                          )
                        )
                      }
                      disabled={
                        page >= totalPages - 1
                      }
                      aria-label="Next page"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}