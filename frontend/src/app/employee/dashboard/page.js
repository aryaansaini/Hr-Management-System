
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import {
  getMyAttendance,
  checkIn,
  checkOut,
  getMyLeaves,
  getLeaveBalance,
  getUnreadCount,
  getMyNotifications,
} from '@/lib/employeeApi';
import toast from 'react-hot-toast';

import {
  CalendarDays,
  Clock3,
  Bell,
  CheckCircle2,
  LogIn,
  LogOut,
  ArrowRight,
  Palmtree,
  Thermometer,
  Sun,
  Baby,
  ClipboardList,
  BriefcaseBusiness,
  FileText,
  UserRound,
  Sparkles,
  ChevronRight,
  Timer,
  TrendingUp,
} from 'lucide-react';

/* =========================================================
   CSS
   ========================================================= */

const dashboardCSS = `
@keyframes employeeDashboardSpin {
    from {
    transform: rotate(0deg);
  }

    to {
    transform: rotate(360deg);
  }
}

  .employee - dashboard * {
  box- sizing: border - box;
  }

  .employee - kpi {
  transition:
      transform 0.2s ease,
    box - shadow 0.2s ease,
      border - color 0.2s ease;
}

  .employee - kpi.clickable:hover {
  transform: translateY(-3px);
  box - shadow: 0 14px 35px rgba(15, 23, 42, 0.09)!important;
  border - color: rgba(59, 130, 246, 0.25)!important;
}

  .quick - action - button {
  border: 1px solid var(--card - border);
  background: var(--bg - primary);
  color: var(--text - primary);
  border - radius: 13px;
  padding: 12px;
  cursor: pointer;
  display: flex;
  align - items: center;
  gap: 10px;
  font - size: 11px;
  font - weight: 700;
  transition:
      transform 0.2s ease,
    background 0.2s ease,
      border - color 0.2s ease;
  width: 100 %;
  text - align: left;
}

  .quick - action - button:hover {
  transform: translateY(-2px);
  border - color: rgba(59, 130, 246, 0.30);
  background: rgba(59, 130, 246, 0.05);
}

@media(max - width: 1100px) {
    .employee - dashboard - grid {
    grid - template - columns: repeat(2, 1fr)!important;
  }

    .employee - two - column {
    grid - template - columns: 1fr!important;
  }

    .employee - bottom - grid {
    grid - template - columns: 1fr!important;
  }
}

@media(max - width: 750px) {
    .employee - dashboard {
    margin: -16px!important;
    padding: 16px!important;
  }

    .quick - action - grid {
    grid - template - columns: 1fr 1fr!important;
  }

    .header - content {
    align - items: flex - start!important;
    flex - direction: column!important;
  }

    .header - date {
    align - items: flex - start!important;
    text - align: left!important;
  }
}

@media(max - width: 520px) {
    .employee - dashboard - grid {
    grid - template - columns: 1fr!important;
  }

    .quick - action - grid {
    grid - template - columns: 1fr!important;
  }

    .attendance - time - grid {
    gap: 10px!important;
  }

    .leave - balance - grid {
    grid - template - columns: 1fr!important;
  }

    .leave - request - row {
    align - items: flex - start!important;
    flex - direction: column!important;
  }

    .notification - row {
    align - items: flex - start!important;
  }
}
`;

/* =========================================================
   LEAVE STYLES
   ========================================================= */

const leaveStyles = {
  ANNUAL: {
    color: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.10)',
    icon: Palmtree,
  },

  SICK: {
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.10)',
    icon: Thermometer,
  },

  CASUAL: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.10)',
    icon: Sun,
  },

  PATERNITY: {
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.10)',
    icon: Baby,
  },

  MATERNITY: {
    color: '#ec4899',
    bg: 'rgba(236, 72, 153, 0.10)',
    icon: Baby,
  },

  UNPAID: {
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.10)',
    icon: ClipboardList,
  },
};

/* =========================================================
   STATUS STYLES
   ========================================================= */

const statusStyles = {
  APPROVED: {
    color: '#10b981',
    bg: 'rgba(16, 185, 129, 0.10)',
    border: 'rgba(16, 185, 129, 0.22)',
  },

  PENDING: {
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.10)',
    border: 'rgba(245, 158, 11, 0.22)',
  },

  REJECTED: {
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.10)',
    border: 'rgba(239, 68, 68, 0.22)',
  },

  CANCELLED: {
    color: '#64748b',
    bg: 'rgba(100, 116, 139, 0.10)',
    border: 'rgba(100, 116, 139, 0.22)',
  },

  CANCELLATION_PENDING: {
    color: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.10)',
    border: 'rgba(168, 85, 247, 0.22)',
  },
};

/* =========================================================
   STATUS BADGE
   ========================================================= */

function StatusBadge({ status }) {
  const style = statusStyles[status] || {
    color: 'var(--text-secondary)',
    bg: 'rgba(148, 163, 184, 0.10)',
    border: 'rgba(148, 163, 184, 0.20)',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 9px',
        borderRadius: '999px',
        background: style.bg,
        color: style.color,
        border: '1px solid ' + style.border,
        fontSize: '9px',
        fontWeight: 800,
        letterSpacing: '0.4px',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {status ? status.replace(/_/g, ' ') : 'UNKNOWN'}
    </span>
  );
}

/* =========================================================
   KPI
   ========================================================= */

function KPI({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={
        onClick
          ? 'employee-kpi clickable'
          : 'employee-kpi'
      }
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '18px',
        padding: '20px',
        minHeight: '132px',
        cursor: onClick ? 'pointer' : 'default',
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: '120px',
          height: '120px',
          right: '-55px',
          top: '-55px',
          borderRadius: '50%',
          background: accent,
          opacity: 0.07,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
            fontWeight: 700,
          }}
        >
          {title}
        </span>

        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accent,
            background: accent + '12',
            border: '1px solid ' + accent + '25',
          }}
        >
          <Icon size={18} />
        </div>
      </div>

      <div
        style={{
          fontSize: '27px',
          lineHeight: 1,
          fontWeight: 800,
          color: 'var(--text-primary)',
          marginBottom: '7px',
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-secondary)',
        }}
      >
        {subtitle}
      </div>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
   ========================================================= */

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  action,
  onAction,
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '11px',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(59, 130, 246, 0.10)',
            color: '#3b82f6',
          }}
        >
          <Icon size={18} />
        </div>

        <div>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 800,
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </div>

          {subtitle && (
            <div
              style={{
                fontSize: '10px',
                marginTop: '3px',
                color: 'var(--text-secondary)',
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {action && (
        <button
          type="button"
          onClick={onAction}
          style={{
            border: 'none',
            background: 'transparent',
            color: '#3b82f6',
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '5px',
          }}
        >
          {action}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

/* =========================================================
   LEAVE RING
   ========================================================= */

function LeaveRing({ percentage, color }) {
  const size = 48;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const safePercentage = Math.max(
    0,
    Math.min(100, Number(percentage) || 0)
  );

  const offset =
    circumference -
    (safePercentage / 100) * circumference;

  return (
    <div
      style={{
        width: size,
        height: size,
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={'0 0 ' + size + ' ' + size}
        style={{
          transform: 'rotate(-90deg)',
          display: 'block',
        }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--card-border)"
          strokeWidth={stroke}
        />

        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '9px',
          fontWeight: 800,
          color: 'var(--text-primary)',
        }}
      >
        {Math.round(safePercentage)}%
      </div>
    </div>
  );
}

/* =========================================================
   LOADER
   ========================================================= */

function DashboardLoader() {
  return (
    <div
      style={{
        minHeight: '450px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            border: '3px solid var(--card-border)',
            borderTopColor: '#3b82f6',
            animation:
              'employeeDashboardSpin 0.8s linear infinite',
            margin: '0 auto 12px',
          }}
        />

        <div
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary)',
          }}
        >
          Loading your dashboard...
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   EMPTY STATE
   ========================================================= */

function EmptyState({
  icon: Icon,
  title,
  text,
}) {
  return (
    <div
      style={{
        minHeight: '165px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: 'var(--text-secondary)',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '14px',
          background: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '10px',
        }}
      >
        <Icon size={19} />
      </div>

      <div
        style={{
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '4px',
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: '10px',
          maxWidth: '240px',
          lineHeight: 1.5,
        }}
      >
        {text}
      </div>
    </div>
  );
}

/* =========================================================
   MAIN DASHBOARD
   ========================================================= */

export default function EmployeeDashboard() {
  const { user } = useSelector(
    (state) => state.auth
  );

  const router = useRouter();

  const [attendance, setAttendance] = useState([]);
  const [todayAtt, setTodayAtt] = useState(null);
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState([]);
  const [notifications, setNotifications] =
    useState([]);
  const [unreadCount, setUnreadCount] =
    useState(0);

  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] =
    useState(false);
  const [checkingOut, setCheckingOut] =
    useState(false);

  /* =======================================================
     FETCH DATA
     ======================================================= */

  const fetchAll = useCallback(async () => {
    setLoading(true);

    try {
      const [
        attendanceResult,
        leavesResult,
        balanceResult,
        notificationsResult,
        unreadResult,
      ] = await Promise.allSettled([
        getMyAttendance(0, 35),
        getMyLeaves(0, 5),
        getLeaveBalance(),
        getMyNotifications(0, 5),
        getUnreadCount(),
      ]);

      /* Attendance */

      if (
        attendanceResult.status ===
        'fulfilled'
      ) {
        const records =
          attendanceResult.value?.data?.data
            ?.content || [];

        setAttendance(records);

        const now = new Date();

        const today =
          now.getFullYear() +
          '-' +
          String(
            now.getMonth() + 1
          ).padStart(2, '0') +
          '-' +
          String(
            now.getDate()
          ).padStart(2, '0');

        const todayRecord = records.find(
          (record) =>
            record.date === today
        );

        setTodayAtt(
          todayRecord || null
        );
      } else {
        setAttendance([]);
        setTodayAtt(null);
      }

      /* Leaves */

      if (
        leavesResult.status ===
        'fulfilled'
      ) {
        setLeaves(
          leavesResult.value?.data?.data
            ?.content || []
        );
      } else {
        setLeaves([]);
      }

      /* Balance */

      if (
        balanceResult.status ===
        'fulfilled'
      ) {
        setBalance(
          balanceResult.value?.data
            ?.data || []
        );
      } else {
        setBalance([]);
      }

      /* Notifications */

      if (
        notificationsResult.status ===
        'fulfilled'
      ) {
        setNotifications(
          notificationsResult.value
            ?.data?.data?.content || []
        );
      } else {
        setNotifications([]);
      }

      /* Unread */

      if (
        unreadResult.status ===
        'fulfilled'
      ) {
        setUnreadCount(
          Number(
            unreadResult.value?.data
              ?.data || 0
          )
        );
      } else {
        setUnreadCount(0);
      }
    } catch (error) {
      console.error(
        'Employee dashboard error:',
        error
      );

      toast.error(
        'Failed to load dashboard data'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /* =======================================================
     INITIAL LOAD
     ======================================================= */

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* =======================================================
     CHECK IN
     ======================================================= */

  const handleCheckIn = async () => {
    if (
      todayAtt?.checkIn ||
      checkingIn
    ) {
      return;
    }

    setCheckingIn(true);

    try {
      await checkIn();

      toast.success(
        'You are checked in successfully'
      );

      await fetchAll();
    } catch (error) {
      console.error(
        'Check-in error:',
        error
      );

      toast.error(
        error?.response?.data
          ?.message ||
          'Check-in failed'
      );
    } finally {
      setCheckingIn(false);
    }
  };

  /* =======================================================
     CHECK OUT
     ======================================================= */

  const handleCheckOut = async () => {
    if (
      !todayAtt?.checkIn ||
      todayAtt?.checkOut ||
      checkingOut
    ) {
      return;
    }

    setCheckingOut(true);

    try {
      await checkOut();

      toast.success(
        'You are checked out successfully'
      );

      await fetchAll();
    } catch (error) {
      console.error(
        'Check-out error:',
        error
      );

      toast.error(
        error?.response?.data
          ?.message ||
          'Check-out failed'
      );
    } finally {
      setCheckingOut(false);
    }
  };

  /* =======================================================
     CALCULATIONS
     ======================================================= */

  const presentDays =
    attendance.filter(
      (item) =>
        item.status === 'PRESENT' ||
        item.status === 'HALF_DAY'
    ).length;

  const pendingLeaves =
    leaves.filter(
      (item) =>
        item.status === 'PENDING'
    ).length;

  const annualBalance =
    balance.find(
      (item) =>
        item.leaveType === 'ANNUAL'
    );

  const firstName =
    user?.name?.split(' ')?.[0] ||
    'Employee';

  const initials =
    user?.name
      ?.split(' ')
      ?.map(
        (part) => part[0]
      )
      ?.join('')
      ?.slice(0, 2)
      ?.toUpperCase() || 'EM';

  const now = new Date();

  const formattedDate =
    now.toLocaleDateString(
      'en-IN',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    );

  const checkInTime =
    todayAtt?.checkIn
      ? todayAtt.checkIn.substring(
          0,
          5
        )
      : '--:--';

  const checkOutTime =
    todayAtt?.checkOut
      ? todayAtt.checkOut.substring(
          0,
          5
        )
      : '--:--';

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div
      className="employee-dashboard"
      style={{
        minHeight: '100vh',
        margin: '-24px',
        padding: '24px',
        background:
          'var(--bg-primary)',
        color:
          'var(--text-primary)',
      }}
    >
      {/* SAFE CSS */}

      <style
        dangerouslySetInnerHTML={{
          __html: dashboardCSS,
        }}
      />

      {/* ===================================================
          HEADER
      =================================================== */}

      <div
        className="employee-card"
        style={{
          padding: '24px',
          marginBottom: '18px',
          position: 'relative',
          overflow: 'hidden',
          background:
            'linear-gradient(135deg, var(--card-bg), rgba(59, 130, 246, 0.035))',
          border:
            '1px solid var(--card-border)',
          borderRadius: '18px',
          boxShadow:
            'var(--card-shadow)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            right: '-110px',
            top: '-130px',
            background:
              'radial-gradient(circle, rgba(59,130,246,.15), transparent 68%)',
            pointerEvents: 'none',
          }}
        />

        <div
          className="header-content"
          style={{
            display: 'flex',
            justifyContent:
              'space-between',
            alignItems: 'center',
            gap: '20px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '15px',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '17px',
                background:
                  'linear-gradient(135deg, #3b82f6, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent:
                  'center',
                color: '#fff',
                fontWeight: 900,
                fontSize: '17px',
                boxShadow:
                  '0 8px 22px rgba(59,130,246,.22)',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  marginBottom: '5px',
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontSize: '22px',
                    fontWeight: 850,
                  }}
                >
                  {new Date().getHours() < 12
                    ? 'Good morning'
                    : new Date().getHours() < 17
                      ? 'Good afternoon'
                      : 'Good evening'}
                  , {firstName}
                </span>

                <Sparkles
                  size={17}
                  color="#f59e0b"
                />
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color:
                    'var(--text-secondary)',
                }}
              >
                {user?.designation ||
                  'Employee'}

                {user?.department
                  ? ' • ' +
                    user.department
                  : ''}
              </div>
            </div>
          </div>

          <div
            className="header-date"
            style={{
              textAlign: 'right',
              display: 'flex',
              flexDirection:
                'column',
              alignItems:
                'flex-end',
              gap: '8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems:
                  'center',
                gap: '7px',
                fontSize: '11px',
                color:
                  'var(--text-secondary)',
              }}
            >
              <CalendarDays
                size={14}
              />

              {formattedDate}
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  '/employee/notifications'
                )
              }
              style={{
                display: 'flex',
                alignItems:
                  'center',
                gap: '7px',
                border: 'none',
                background:
                  'transparent',
                color:
                  'var(--text-primary)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 700,
                padding: 0,
              }}
            >
              <Bell size={15} />

              Notifications

              {unreadCount > 0 && (
                <span
                  style={{
                    minWidth: '19px',
                    height: '19px',
                    padding:
                      '0 5px',
                    borderRadius:
                      '999px',
                    background:
                      '#ef4444',
                    color: '#fff',
                    fontSize: '9px',
                    display: 'inline-flex',
                    alignItems:
                      'center',
                    justifyContent:
                      'center',
                    fontWeight: 800,
                  }}
                >
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <DashboardLoader />
      ) : (
        <>
          {/* =================================================
              KPI CARDS
          ================================================= */}

          <div
            className="employee-dashboard-grid"
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(4, minmax(0, 1fr))',
              gap: '15px',
              marginBottom: '18px',
            }}
          >
            <KPI
              title="Present Days"
              value={presentDays}
              subtitle="Recorded attendance"
              icon={CheckCircle2}
              accent="#10b981"
              onClick={() =>
                router.push(
                  '/employee/attendance'
                )
              }
            />

            <KPI
              title="Annual Leave"
              value={
                annualBalance
                  ? String(
                      annualBalance.remaining
                    ) + ' days'
                  : '0 days'
              }
              subtitle="Remaining balance"
              icon={Palmtree}
              accent="#8b5cf6"
              onClick={() =>
                router.push(
                  '/employee/leave'
                )
              }
            />

            <KPI
              title="Pending Requests"
              value={pendingLeaves}
              subtitle="Waiting for approval"
              icon={Clock3}
              accent="#f59e0b"
              onClick={() =>
                router.push(
                  '/employee/leave'
                )
              }
            />

            <KPI
              title="Notifications"
              value={unreadCount}
              subtitle="Unread messages"
              icon={Bell}
              accent="#3b82f6"
              onClick={() =>
                router.push(
                  '/employee/notifications'
                )
              }
            />
          </div>

          {/* =================================================
              ATTENDANCE + LEAVE
          ================================================= */}

          <div
            className="employee-two-column"
            style={{
              display: 'grid',
              gridTemplateColumns:
                'minmax(0, 1.1fr) minmax(0, .9fr)',
              gap: '18px',
              marginBottom: '18px',
            }}
          >
            {/* ATTENDANCE */}

            <div
              className="employee-card"
              style={{
                padding: '22px',
                overflow: 'hidden',
                position: 'relative',
                background:
                  'var(--card-bg)',
                border:
                  '1px solid var(--card-border)',
                borderRadius: '18px',
                boxShadow:
                  'var(--card-shadow)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  right: '-60px',
                  top: '-80px',
                  width: '190px',
                  height: '190px',
                  borderRadius: '50%',
                  background:
                    'radial-gradient(circle, rgba(16,185,129,.11), transparent 68%)',
                  pointerEvents: 'none',
                }}
              />

              <SectionHeader
                icon={Timer}
                title="Today's Attendance"
                subtitle="Track your working hours"
              />

              <div
                className="attendance-time-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr auto 1fr',
                  alignItems: 'center',
                  gap: '18px',
                  padding: '18px',
                  borderRadius: '15px',
                  background:
                    'var(--bg-primary)',
                  border:
                    '1px solid var(--card-border)',
                  marginBottom: '18px',
                }}
              >
                <div
                  style={{
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      color:
                        'var(--text-secondary)',
                      marginBottom:
                        '8px',
                      fontWeight: 700,
                    }}
                  >
                    CHECK IN
                  </div>

                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 900,
                      color:
                        todayAtt?.checkIn
                          ? '#10b981'
                          : 'var(--text-primary)',
                    }}
                  >
                    {checkInTime}
                  </div>

                  <div
                    style={{
                      fontSize: '9px',
                      color:
                        'var(--text-secondary)',
                      marginTop: '5px',
                    }}
                  >
                    Start of work
                  </div>
                </div>

                <div
                  style={{
                    width: '1px',
                    height: '55px',
                    background:
                      'var(--card-border)',
                  }}
                />

                <div
                  style={{
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '10px',
                      color:
                        'var(--text-secondary)',
                      marginBottom:
                        '8px',
                      fontWeight: 700,
                    }}
                  >
                    CHECK OUT
                  </div>

                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 900,
                      color:
                        todayAtt?.checkOut
                          ? '#f59e0b'
                          : 'var(--text-primary)',
                    }}
                  >
                    {checkOutTime}
                  </div>

                  <div
                    style={{
                      fontSize: '9px',
                      color:
                        'var(--text-secondary)',
                      marginTop: '5px',
                    }}
                  >
                    End of work
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'space-between',
                  gap: '12px',
                  marginBottom:
                    '18px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems:
                      'center',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius:
                        '50%',
                      background:
                        todayAtt?.checkIn &&
                        !todayAtt?.checkOut
                          ? '#10b981'
                          : todayAtt?.checkOut
                          ? '#f59e0b'
                          : '#94a3b8',
                      boxShadow:
                        todayAtt?.checkIn &&
                        !todayAtt?.checkOut
                          ? '0 0 0 4px rgba(16,185,129,.10)'
                          : 'none',
                    }}
                  />

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color:
                        'var(--text-secondary)',
                    }}
                  >
                    {todayAtt?.checkOut
                      ? 'Workday completed'
                      : todayAtt?.checkIn
                      ? 'Currently working'
                      : 'Not checked in yet'}
                  </span>
                </div>

                {todayAtt?.status && (
                  <StatusBadge
                    status={
                      todayAtt.status
                    }
                  />
                )}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    '1fr 1fr',
                  gap: '10px',
                }}
              >
                <button
                  type="button"
                  onClick={
                    handleCheckIn
                  }
                  disabled={
                    !!todayAtt?.checkIn ||
                    checkingIn
                  }
                  style={{
                    border: 'none',
                    borderRadius:
                      '12px',
                    padding: '12px',
                    background:
                      todayAtt?.checkIn
                        ? 'rgba(16,185,129,.10)'
                        : '#10b981',
                    color:
                      todayAtt?.checkIn
                        ? '#10b981'
                        : '#fff',
                    cursor:
                      todayAtt?.checkIn ||
                      checkingIn
                        ? 'not-allowed'
                        : 'pointer',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    justifyContent:
                      'center',
                    alignItems:
                      'center',
                    gap: '7px',
                    opacity:
                      checkingIn
                        ? 0.7
                        : 1,
                  }}
                >
                  {todayAtt?.checkIn ? (
                    <CheckCircle2
                      size={15}
                    />
                  ) : (
                    <LogIn size={15} />
                  )}

                  {checkingIn
                    ? 'Checking...'
                    : todayAtt?.checkIn
                    ? 'Checked In'
                    : 'Check In'}
                </button>

                <button
                  type="button"
                  onClick={
                    handleCheckOut
                  }
                  disabled={
                    !todayAtt?.checkIn ||
                    !!todayAtt?.checkOut ||
                    checkingOut
                  }
                  style={{
                    border: 'none',
                    borderRadius:
                      '12px',
                    padding: '12px',
                    background:
                      todayAtt?.checkOut
                        ? 'rgba(245,158,11,.10)'
                        : todayAtt?.checkIn
                        ? '#f59e0b'
                        : 'var(--bg-primary)',
                    color:
                      todayAtt?.checkOut
                        ? '#f59e0b'
                        : todayAtt?.checkIn
                        ? '#fff'
                        : 'var(--text-secondary)',
                    cursor:
                      !todayAtt?.checkIn ||
                      todayAtt?.checkOut ||
                      checkingOut
                        ? 'not-allowed'
                        : 'pointer',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    justifyContent:
                      'center',
                    alignItems:
                      'center',
                    gap: '7px',
                    opacity:
                      !todayAtt?.checkIn
                        ? 0.55
                        : checkingOut
                        ? 0.7
                        : 1,
                  }}
                >
                  <LogOut size={15} />

                  {checkingOut
                    ? 'Checking...'
                    : todayAtt?.checkOut
                    ? 'Checked Out'
                    : 'Check Out'}
                </button>
              </div>
            </div>

            {/* LEAVE BALANCE */}

            <div
              className="employee-card"
              style={{
                padding: '22px',
                background:
                  'var(--card-bg)',
                border:
                  '1px solid var(--card-border)',
                borderRadius: '18px',
                boxShadow:
                  'var(--card-shadow)',
              }}
            >
              <SectionHeader
                icon={Palmtree}
                title="Leave Balance"
                subtitle="Your available leave days"
                action="Manage"
                onAction={() =>
                  router.push(
                    '/employee/leave'
                  )
                }
              />

              {balance.length ===
              0 ? (
                <EmptyState
                  icon={Palmtree}
                  title="No leave balance"
                  text="Leave balance information is not available right now."
                />
              ) : (
                <div
                  className="leave-balance-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '1fr 1fr',
                    gap: '10px',
                  }}
                >
                  {balance.map(
                    (
                      item,
                      index
                    ) => {
                      const style =
                        leaveStyles[
                          item.leaveType
                        ] ||
                        leaveStyles.UNPAID;

                      const Icon =
                        style.icon;

                      const total =
                        Number(
                          item.totalAllotted
                        ) || 0;

                      const remaining =
                        Number(
                          item.remaining
                        ) || 0;

                      const percentage =
                        total > 0
                          ? Math.min(
                              100,
                              (remaining /
                                total) *
                                100
                            )
                          : 0;

                      return (
                        <div
                          key={
                            item.leaveType +
                            '-' +
                            index
                          }
                          style={{
                            padding:
                              '13px',
                            borderRadius:
                              '14px',
                            background:
                              style.bg,
                            border:
                              '1px solid var(--card-border)',
                            display:
                              'flex',
                            alignItems:
                              'center',
                            gap: '11px',
                          }}
                        >
                          <LeaveRing
                            percentage={
                              percentage
                            }
                            color={
                              style.color
                            }
                          />

                          <div
                            style={{
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                display:
                                  'flex',
                                alignItems:
                                  'center',
                                gap: '5px',
                                color:
                                  style.color,
                                fontSize:
                                  '9px',
                                fontWeight:
                                  850,
                                textTransform:
                                  'uppercase',
                                letterSpacing:
                                  '0.4px',
                              }}
                            >
                              <Icon
                                size={12}
                              />

                              {item.leaveType
                                ? item.leaveType.replace(
                                    /_/g,
                                    ' '
                                  )
                                : 'LEAVE'}
                            </div>

                            <div
                              style={{
                                marginTop:
                                  '4px',
                                fontSize:
                                  '16px',
                                fontWeight:
                                  900,
                                color:
                                  'var(--text-primary)',
                              }}
                            >
                              {item.leaveType ===
                              'UNPAID'
                                ? item.used ||
                                  0
                                : remaining}

                              <span
                                style={{
                                  fontSize:
                                    '10px',
                                  fontWeight:
                                    600,
                                  color:
                                    'var(--text-secondary)',
                                  marginLeft:
                                    '3px',
                                }}
                              >
                                {item.leaveType ===
                                'UNPAID'
                                  ? 'used'
                                  : '/ ' +
                                    total +
                                    ' days'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <div
            className="employee-card"
            style={{
              padding: '18px',
              marginBottom: '18px',
              background:
                'var(--card-bg)',
              border:
                '1px solid var(--card-border)',
              borderRadius: '18px',
              boxShadow:
                'var(--card-shadow)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems:
                  'center',
                gap: '9px',
                marginBottom:
                  '13px',
              }}
            >
              <BriefcaseBusiness
                size={16}
                color="#3b82f6"
              />

              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                }}
              >
                Quick Actions
              </span>
            </div>

            <div
              className="quick-action-grid"
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(4, 1fr)',
                gap: '10px',
              }}
            >
              <button
                type="button"
                className="quick-action-button"
                onClick={() =>
                  router.push(
                    '/employee/leave'
                  )
                }
              >
                <Palmtree
                  size={16}
                  color="#8b5cf6"
                />

                <span>
                  Apply Leave
                </span>

                <ArrowRight
                  size={13}
                  style={{
                    marginLeft:
                      'auto',
                  }}
                />
              </button>

              <button
                type="button"
                className="quick-action-button"
                onClick={() =>
                  router.push(
                    '/employee/attendance'
                  )
                }
              >
                <CalendarDays
                  size={16}
                  color="#10b981"
                />

                <span>
                  Attendance
                </span>

                <ArrowRight
                  size={13}
                  style={{
                    marginLeft:
                      'auto',
                  }}
                />
              </button>

              <button
                type="button"
                className="quick-action-button"
                onClick={() =>
                  router.push(
                    '/employee/onboarding/profile/'
                  )
                }
              >
                <UserRound
                  size={16}
                  color="#3b82f6"
                />

                <span>
                  My Profile
                </span>

                <ArrowRight
                  size={13}
                  style={{
                    marginLeft:
                      'auto',
                  }}
                />
              </button>

              <button
                type="button"
                className="quick-action-button"
                onClick={() =>
                  router.push(
                    '/employee/notifications'
                  )
                }
              >
                <Bell
                  size={16}
                  color="#f59e0b"
                />

                <span>
                  Notifications
                </span>

                <ArrowRight
                  size={13}
                  style={{
                    marginLeft:
                      'auto',
                  }}
                />
              </button>
            </div>
          </div>

          {/* =================================================
              BOTTOM GRID
          ================================================= */}

          <div
            className="employee-bottom-grid"
            style={{
              display: 'grid',
              gridTemplateColumns:
                '1fr 1fr',
              gap: '18px',
            }}
          >
            {/* RECENT LEAVES */}

            <div
              className="employee-card"
              style={{
                padding: '22px',
                background:
                  'var(--card-bg)',
                border:
                  '1px solid var(--card-border)',
                borderRadius: '18px',
                boxShadow:
                  'var(--card-shadow)',
              }}
            >
              <SectionHeader
                icon={FileText}
                title="Recent Leave Requests"
                subtitle="Latest leave activity"
                action="View all"
                onAction={() =>
                  router.push(
                    '/employee/leave'
                  )
                }
              />

              {leaves.length ===
              0 ? (
                <EmptyState
                  icon={FileText}
                  title="No leave requests"
                  text="You haven't submitted any leave requests yet."
                />
              ) : (
                <div>
                  {leaves
                    .slice(0, 4)
                    .map(
                      (
                        leave,
                        index
                      ) => (
                        <div
                          key={
                            leave.id ||
                            index
                          }
                          className="leave-request-row"
                          style={{
                            display:
                              'flex',
                            alignItems:
                              'center',
                            justifyContent:
                              'space-between',
                            gap: '15px',
                            padding:
                              '13px 0',
                            borderBottom:
                              index <
                              Math.min(
                                leaves.length,
                                4
                              ) -
                                1
                                ? '1px solid var(--card-border)'
                                : 'none',
                          }}
                        >
                          <div
                            style={{
                              display:
                                'flex',
                              alignItems:
                                'center',
                              gap: '11px',
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                width:
                                  '38px',
                                height:
                                  '38px',
                                borderRadius:
                                  '12px',
                                background:
                                  'rgba(139,92,246,.10)',
                                color:
                                  '#8b5cf6',
                                display:
                                  'flex',
                                alignItems:
                                  'center',
                                justifyContent:
                                  'center',
                                flexShrink: 0,
                              }}
                            >
                              <Palmtree
                                size={
                                  17
                                }
                              />
                            </div>

                            <div
                              style={{
                                minWidth:
                                  0,
                              }}
                            >
                              <div
                                style={{
                                  fontSize:
                                    '11px',
                                  fontWeight:
                                    800,
                                  color:
                                    'var(--text-primary)',
                                  whiteSpace:
                                    'nowrap',
                                  overflow:
                                    'hidden',
                                  textOverflow:
                                    'ellipsis',
                                }}
                              >
                                {leave.leaveType
                                  ? leave.leaveType.replace(
                                      /_/g,
                                      ' '
                                    )
                                  : 'Leave'}{' '}
                                Leave
                              </div>

                              <div
                                style={{
                                  fontSize:
                                    '9px',
                                  color:
                                    'var(--text-secondary)',
                                  marginTop:
                                    '4px',
                                }}
                              >
                                {leave.startDate ||
                                  '--'}{' '}
                                –{' '}
                                {leave.endDate ||
                                  '--'}
                              </div>
                            </div>
                          </div>

                          <div
                            style={{
                              display:
                                'flex',
                              alignItems:
                                'center',
                              gap: '10px',
                              flexShrink: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize:
                                  '10px',
                                color:
                                  'var(--text-secondary)',
                                fontWeight:
                                  700,
                              }}
                            >
                              {leave.totalDays ||
                                0}{' '}
                              days
                            </span>

                            <StatusBadge
                              status={
                                leave.status
                              }
                            />
                          </div>
                        </div>
                      )
                    )}
                </div>
              )}
            </div>

            {/* NOTIFICATIONS */}

            <div
              className="employee-card"
              style={{
                padding: '22px',
                background:
                  'var(--card-bg)',
                border:
                  '1px solid var(--card-border)',
                borderRadius: '18px',
                boxShadow:
                  'var(--card-shadow)',
              }}
            >
              <SectionHeader
                icon={Bell}
                title="Recent Notifications"
                subtitle="Stay up to date"
                action="View all"
                onAction={() =>
                  router.push(
                    '/employee/notifications'
                  )
                }
              />

              {notifications.length ===
              0 ? (
                <EmptyState
                  icon={Bell}
                  title="You're all caught up"
                  text="There are no new notifications to show."
                />
              ) : (
                <div>
                  {notifications
                    .slice(0, 4)
                    .map(
                      (
                        notification,
                        index
                      ) => (
                        <div
                          key={
                            notification.id ||
                            index
                          }
                          className="notification-row"
                          style={{
                            display:
                              'flex',
                            gap: '11px',
                            alignItems:
                              'center',
                            padding:
                              '13px 0',
                            borderBottom:
                              index <
                              Math.min(
                                notifications.length,
                                4
                              ) -
                                1
                                ? '1px solid var(--card-border)'
                                : 'none',
                          }}
                        >
                          <div
                            style={{
                              width:
                                '38px',
                              height:
                                '38px',
                              borderRadius:
                                '12px',
                              background:
                                notification.isRead
                                  ? 'var(--bg-primary)'
                                  : 'rgba(59,130,246,.10)',
                              color:
                                notification.isRead
                                  ? 'var(--text-secondary)'
                                  : '#3b82f6',
                              display:
                                'flex',
                              alignItems:
                                'center',
                              justifyContent:
                                'center',
                              flexShrink: 0,
                            }}
                          >
                            <Bell
                              size={
                                17
                              }
                            />
                          </div>

                          <div
                            style={{
                              flex: 1,
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                display:
                                  'flex',
                                alignItems:
                                  'center',
                                gap: '7px',
                              }}
                            >
                              <div
                                style={{
                                  fontSize:
                                    '11px',
                                  fontWeight:
                                    800,
                                  color:
                                    'var(--text-primary)',
                                  whiteSpace:
                                    'nowrap',
                                  overflow:
                                    'hidden',
                                  textOverflow:
                                    'ellipsis',
                                }}
                              >
                                {notification.title ||
                                  'Notification'}
                              </div>

                              {!notification.isRead && (
                                <span
                                  style={{
                                    width:
                                      '6px',
                                    height:
                                      '6px',
                                    borderRadius:
                                      '50%',
                                    background:
                                      '#3b82f6',
                                    flexShrink:
                                      0,
                                  }}
                                />
                              )}
                            </div>

                            <div
                              style={{
                                fontSize:
                                  '9px',
                                color:
                                  'var(--text-secondary)',
                                marginTop:
                                  '4px',
                                whiteSpace:
                                  'nowrap',
                                overflow:
                                  'hidden',
                                textOverflow:
                                  'ellipsis',
                              }}
                            >
                              {notification.message ||
                                ''}
                            </div>
                          </div>

                          <div
                            style={{
                              fontSize:
                                '9px',
                              color:
                                'var(--text-secondary)',
                              flexShrink: 0,
                            }}
                          >
                            {notification.createdAt
                              ? new Date(
                                  notification.createdAt
                                ).toLocaleDateString(
                                  'en-IN',
                                  {
                                    day: '2-digit',
                                    month:
                                      'short',
                                  }
                                )
                              : ''}
                          </div>
                        </div>
                      )
                    )}
                </div>
              )}
            </div>
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <div
            style={{
              marginTop: '18px',
              display: 'flex',
              justifyContent:
                'center',
              alignItems:
                'center',
              gap: '6px',
              color:
                'var(--text-secondary)',
              fontSize: '9px',
            }}
          >
            <TrendingUp
              size={12}
            />

            Your dashboard is synced
            with the latest HRMS data.
          </div>
        </>
      )}
    </div>
  );
}
