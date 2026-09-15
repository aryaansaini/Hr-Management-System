'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

import {
  Users,
  CheckCircle2,
  Clock3,
  PartyPopper,
  XCircle,
  Loader2,
  Check,
  X,
  CalendarDays,
  UserPlus,
  Banknote,
  BriefcaseBusiness,
  ArrowUpRight,
  ArrowRight,
  UserCheck,
  Activity,
  Search,
  MoreHorizontal,
  RefreshCw,
  ChevronRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

/* =========================================================
   HELPERS
========================================================= */

function initials(name = '') {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'NA'
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  title,
  value,
  subtitle,
  icon,
  tone,
  trend,
}) {
  return (
    <div className="premium-stat-card">
      <div className="stat-top">
        <div className={`stat-icon ${tone}`}>
          {icon}
        </div>

        {trend !== undefined && trend !== null && (
          <div className="stat-trend up">
            <ArrowUpRight size={14} />
            {trend}%
          </div>
        )}
      </div>

      <div className="stat-value">
        {formatNumber(value)}
      </div>

      <div className="stat-title">
        {title}
      </div>

      <div className="stat-subtitle">
        {subtitle}
      </div>

      <div className={`stat-glow ${tone}`} />
    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
  const normalized = String(status || '').toUpperCase();

  const map = {
    APPROVED: ['Approved', 'success'],
    PENDING: ['Pending', 'warning'],
    REJECTED: ['Rejected', 'danger'],
    CANCELLED: ['Cancelled', 'muted'],
    CANCELED: ['Cancelled', 'muted'],
    CANCELLATION_PENDING: [
      'Cancellation pending',
      'purple',
    ],
    ACTIVE: ['Active', 'success'],
    INACTIVE: ['Inactive', 'muted'],
    PRESENT: ['Present', 'success'],
    ABSENT: ['Absent', 'danger'],
    HALF_DAY: ['Half day', 'warning'],
    LATE: ['Late', 'purple'],
  };

  const [label, tone] =
    map[normalized] || [
      String(status || 'Unknown'),
      'muted',
    ];

  return (
    <span className={`premium-badge ${tone}`}>
      <span />
      {label}
    </span>
  );
}

/* =========================================================
   MINI BAR
========================================================= */

function MiniBar({ value, max }) {
  const width =
    max > 0
      ? Math.min(100, (value / max) * 100)
      : 0;

  return (
    <div className="mini-bar">
      <div
        className="mini-bar-fill"
        style={{
          width: `${width}%`,
        }}
      />
    </div>
  );
}

/* =========================================================
   ATTENDANCE RING
========================================================= */

function AttendanceRing({ present, total }) {
  const safeTotal = Math.max(total || 0, 1);

  const percentage = Math.min(
    100,
    Math.round((present / safeTotal) * 100)
  );

  const circumference = 2 * Math.PI * 46;

  const offset =
    circumference -
    (percentage / 100) * circumference;

  return (
    <div className="attendance-ring-wrap">
      <svg
        viewBox="0 0 120 120"
        className="attendance-ring"
        aria-label={`${percentage}% attendance`}
      >
        <circle
          cx="60"
          cy="60"
          r="46"
          className="ring-track"
        />

        <circle
          cx="60"
          cy="60"
          r="46"
          className="ring-progress"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <div className="ring-center">
        <strong>{percentage}%</strong>
        <span>Present</span>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN DASHBOARD
========================================================= */

export default function AdminDashboard() {
  const router = useRouter();

  const [employees, setEmployees] = useState([]);
  const [pendingLeaves, setPendingLeaves] =
    useState([]);
  const [todayAttendance, setTodayAttendance] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [actioning, setActioning] =
    useState(null);

  const [search, setSearch] = useState('');
  const currentHour = new Date().getHours();

  let greeting = 'Good morning';

  if (currentHour >= 12 && currentHour < 17) {
    greeting = 'Good afternoon';
  } else if (currentHour >= 17) {
    greeting = 'Good evening';
  }
  /* =====================================================
     FETCH DASHBOARD
  ===================================================== */

  const fetchDashboardData = useCallback(
    async (silent = false) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const today = new Date();

        const todayStr =
          `${today.getFullYear()}-${String(
            today.getMonth() + 1
          ).padStart(2, '0')}-${String(
            today.getDate()
          ).padStart(2, '0')}`;

        const [
          empRes,
          leaveRes,
          attRes,
        ] = await Promise.allSettled([
          api.get(
            '/api/employees?size=1000'
          ),

          api.get(
            '/api/leaves/pending?size=1000'
          ),

          api.get(
            `/api/attendance/date/${todayStr}?size=1000`
          ),
        ]);

        /* Employees */

        if (empRes.status === 'fulfilled') {
          const d =
            empRes.value.data?.data;

          if (Array.isArray(d)) {
            setEmployees(d);
          } else if (
            Array.isArray(d?.content)
          ) {
            setEmployees(d.content);
          } else {
            setEmployees([]);
          }
        }

        /* Leaves */

        if (leaveRes.status === 'fulfilled') {
          const d =
            leaveRes.value.data?.data;

          if (Array.isArray(d)) {
            setPendingLeaves(d);
          } else if (
            Array.isArray(d?.content)
          ) {
            setPendingLeaves(d.content);
          } else {
            setPendingLeaves([]);
          }
        }

        /* Attendance */

        if (attRes.status === 'fulfilled') {
          const d =
            attRes.value.data?.data;

          if (Array.isArray(d)) {
            setTodayAttendance(d);
          } else if (
            Array.isArray(d?.content)
          ) {
            setTodayAttendance(d.content);
          } else {
            setTodayAttendance([]);
          }
        }
      } catch (error) {
        console.error(
          'Dashboard error:',
          error
        );

        toast.error(
          'Unable to load dashboard'
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /* =====================================================
     LEAVE ACTION
  ===================================================== */

  const handleLeaveAction = async (
    id,
    status
  ) => {
    setActioning(`${id}-${status}`);

    try {
      await api.put(
        `/api/leaves/${id}/action`,
        {
          action: status,
          remarks:
            'Actioned from admin dashboard',
        }
      );

      toast.success(
        `Leave ${status.toLowerCase()} successfully`
      );

      await fetchDashboardData(true);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        'Failed to update leave'
      );
    } finally {
      setActioning(null);
    }
  };

  /* =====================================================
     CALCULATIONS
  ===================================================== */

  const activeEmployees =
    employees.filter(
      (employee) => employee.active
    );

  const inactiveEmployees =
    employees.length -
    activeEmployees.length;

  const presentToday =
    todayAttendance.filter((attendance) =>
      [
        'PRESENT',
        'LATE',
        'HALF_DAY',
      ].includes(
        String(
          attendance.status || ''
        ).toUpperCase()
      )
    ).length;

  const absentToday = Math.max(
    0,
    employees.length - presentToday
  );

  const lateToday =
    todayAttendance.filter(
      (attendance) =>
        String(
          attendance.status || ''
        ).toUpperCase() === 'LATE'
    ).length;

  const pendingCount =
    pendingLeaves.filter(
      (leave) =>
        String(
          leave.status || ''
        ).toUpperCase() === 'PENDING'
    ).length;

  /* =====================================================
     SEARCH
  ===================================================== */

  const filteredEmployees =
    employees
      .filter((employee) => {
        const text =
          `${employee.firstName || ''} ${employee.lastName || ''
            } ${employee.email || ''
            } ${employee.department || ''
            } ${employee.designation || ''
            }`.toLowerCase();

        return text.includes(
          search.toLowerCase()
        );
      })
      .slice(0, 7);

  const visibleLeaves =
    pendingLeaves.slice(0, 5);

  const visibleAttendance =
    todayAttendance.slice(0, 7);

  const dateLabel =
    new Date().toLocaleDateString(
      'en-US',
      {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }
    );

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="premium-shell">
        <style jsx global>
          {styles}
        </style>

        <div className="premium-loading">
          <div className="loading-orb">
            <Sparkles size={26} />
          </div>

          <div>
            <strong>
              Preparing your workspace
            </strong>

            <span>
              Loading HR intelligence...
            </span>
          </div>

          <Loader2
            size={24}
            className="spin"
          />
        </div>
      </div>
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="premium-shell">
      <style jsx global>
        {styles}
      </style>

      {/* Background */}

      <div className="dashboard-bg-orb orb-one" />
      <div className="dashboard-bg-orb orb-two" />

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="premium-header">
        <div>
          <div className="eyebrow">
            <span className="live-dot" />
            ADMIN CONTROL CENTER
          </div>

          <h1>
            {greeting}, Admin 👋
          </h1>

          <p>
            Here&apos;s what&apos;s happening
            across your organization today.
          </p>
        </div>

        <div className="header-actions">
          <div className="date-pill">
            <CalendarDays size={18} />
            {dateLabel}
          </div>
        </div>
      </header>

      {/* =================================================
          KPI CARDS
      ================================================= */}

      <section className="stats-grid">
        <StatCard
          title="Total Employees"
          value={employees.length}
          subtitle={`${activeEmployees.length} active employees`}
          icon={<Users size={22} />}
          tone="blue"
        />

        <StatCard
          title="Attendance Today"
          value={presentToday}
          subtitle={`${lateToday} late · ${absentToday} not checked in`}
          icon={<UserCheck size={22} />}
          tone="green"
        />

        <StatCard
          title="Pending Approvals"
          value={pendingCount}
          subtitle="Leave requests waiting"
          icon={<Clock3 size={22} />}
          tone="amber"
        />

        <StatCard
          title="Active Workforce"
          value={activeEmployees.length}
          subtitle={`${inactiveEmployees} inactive accounts`}
          icon={<Activity size={22} />}
          tone="purple"
          
        />
      </section>

      {/* =================================================
          MAIN ANALYTICS
      ================================================= */}

      <section className="main-grid">

        {/* Attendance */}

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="section-kicker">
                LIVE OVERVIEW
              </div>

              <h2>
                Today&apos;s workforce
              </h2>

              <p>
                Real-time attendance snapshot
              </p>
            </div>

            <button
              className="text-button"
              onClick={() =>
                router.push(
                  '/admin/attendance'
                )
              }
            >
              Full report
              <ArrowUpRight size={17} />
            </button>
          </div>

          <div className="attendance-overview">
            <AttendanceRing
              present={presentToday}
              total={employees.length}
            />

            <div className="attendance-stats">

              <div className="attendance-stat">
                <span className="legend-dot present" />

                <div>
                  <strong>
                    {presentToday}
                  </strong>

                  <small>
                    Present
                  </small>
                </div>
              </div>

              <div className="attendance-stat">
                <span className="legend-dot late" />

                <div>
                  <strong>
                    {lateToday}
                  </strong>

                  <small>
                    Late
                  </small>
                </div>
              </div>

              <div className="attendance-stat">
                <span className="legend-dot absent" />

                <div>
                  <strong>
                    {absentToday}
                  </strong>

                  <small>
                    Not checked in
                  </small>
                </div>
              </div>

            </div>
          </div>

          <div className="attendance-health">
            <div>
              <span>
                Workforce attendance health
              </span>

              <strong>
                {employees.length
                  ? `${Math.round(
                    (presentToday /
                      employees.length) *
                    100
                  )}%`
                  : '0%'}
              </strong>
            </div>

            <MiniBar
              value={presentToday}
              max={Math.max(
                employees.length,
                1
              )}
            />
          </div>
        </div>

        {/* Quick Actions */}

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="section-kicker">
                COMMAND CENTER
              </div>

              <h2>
                Quick actions
              </h2>

              <p>
                Jump directly into daily
                operations
              </p>
            </div>

            <ShieldCheck
              size={25}
              className="header-accent"
            />
          </div>

          <div className="quick-actions">
            {[
              {
                label: 'Add employee',
                hint: 'Create a profile',
                icon: <UserPlus />,
                tone: 'blue',
                route:
                  '/admin/employees',
              },
              {
                label: 'Approve leave',
                hint: `${pendingCount} awaiting action`,
                icon: <CheckCircle2 />,
                tone: 'green',
                route: '/admin/leave',
              },
              {
                label: 'Run payroll',
                hint: 'Open payroll center',
                icon: <Banknote />,
                tone: 'amber',
                route: '/admin/payroll',
              },
              {
                label: 'Recruitment',
                hint: 'Manage hiring pipeline',
                icon:
                  <BriefcaseBusiness />,
                tone: 'purple',
                route:
                  '/admin/recruitment',
              },
            ].map((action) => (
              <button
                key={action.label}
                className="quick-action"
                onClick={() =>
                  router.push(
                    action.route
                  )
                }
              >
                <div
                  className={`quick-icon ${action.tone}`}
                >
                  {action.icon}
                </div>

                <div className="quick-content">
                  <strong>
                    {action.label}
                  </strong>

                  <span>
                    {action.hint}
                  </span>
                </div>

                <ChevronRight size={19} />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =================================================
          LEAVES + ATTENDANCE
      ================================================= */}

      <section className="main-grid">

        {/* Leave Requests */}

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="section-kicker">
                ACTION REQUIRED
              </div>

              <h2>
                Leave requests
              </h2>

              <p>
                Review employee leave
                applications
              </p>
            </div>

            <button
              className="text-button"
              onClick={() =>
                router.push(
                  '/admin/leave'
                )
              }
            >
              View all
              <ArrowRight size={17} />
            </button>
          </div>

          {visibleLeaves.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <PartyPopper size={28} />
              </div>

              <strong>
                All clear
              </strong>

              <span>
                No leave requests need
                your attention.
              </span>
            </div>
          ) : (
            <div>
              {visibleLeaves.map(
                (leave, index) => {
                  const cancelled =
                    [
                      'CANCELLED',
                      'CANCELED',
                      'CANCELLATION_PENDING',
                    ].includes(
                      String(
                        leave.status || ''
                      ).toUpperCase()
                    );

                  const approveKey =
                    `${leave.id}-APPROVED`;

                  const rejectKey =
                    `${leave.id}-REJECTED`;

                  return (
                    <div
                      className="leave-item"
                      key={
                        leave.id ||
                        index
                      }
                    >
                      <div className="avatar blue">
                        {initials(
                          leave.employeeName
                        )}
                      </div>

                      <div className="leave-main">
                        <div className="leave-title-row">
                          <strong>
                            {
                              leave.employeeName ||
                              'Employee'
                            }
                          </strong>

                          <StatusBadge
                            status={
                              leave.status
                            }
                          />
                        </div>

                        <span>
                          {
                            leave.leaveType ||
                            'Leave'
                          }
                          {' · '}
                          {
                            leave.startDate ||
                            '--'
                          }
                          {' → '}
                          {
                            leave.endDate ||
                            '--'
                          }
                          {' · '}
                          {
                            leave.totalDays ||
                            0
                          }
                          {' day(s)'}
                        </span>

                        {leave.reason && (
                          <em>
                            &quot;
                            {
                              leave.reason
                            }
                            &quot;
                          </em>
                        )}
                      </div>

                      {cancelled ? (
                        <div className="cancelled-label">
                          <XCircle size={17} />
                          Cancelled
                        </div>
                      ) : leave.status ===
                        'PENDING' ? (
                        <div className="leave-actions">
                          <button
                            className="approve-btn"
                            disabled={
                              actioning ===
                              approveKey
                            }
                            onClick={() =>
                              handleLeaveAction(
                                leave.id,
                                'APPROVED'
                              )
                            }
                          >
                            {actioning ===
                              approveKey ? (
                              <Loader2
                                size={15}
                                className="spin"
                              />
                            ) : (
                              <Check
                                size={15}
                              />
                            )}

                            Approve
                          </button>

                          <button
                            className="reject-btn"
                            disabled={
                              actioning ===
                              rejectKey
                            }
                            onClick={() =>
                              handleLeaveAction(
                                leave.id,
                                'REJECTED'
                              )
                            }
                          >
                            {actioning ===
                              rejectKey ? (
                              <Loader2
                                size={15}
                                className="spin"
                              />
                            ) : (
                              <X
                                size={15}
                              />
                            )}

                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="actioned-label">
                          Actioned
                        </span>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* Attendance Feed */}

        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="section-kicker">
                LIVE ACTIVITY
              </div>

              <h2>
                Attendance feed
              </h2>

              <p>
                Latest employee
                check-ins
              </p>
            </div>

            <button
              className="text-button"
              onClick={() =>
                router.push(
                  '/admin/attendance'
                )
              }
            >
              View all
              <ArrowRight size={17} />
            </button>
          </div>

          {visibleAttendance.length ===
            0 ? (
            <div className="empty-state">
              <div className="empty-icon green">
                <CalendarDays size={28} />
              </div>

              <strong>
                No activity yet
              </strong>

              <span>
                Attendance records
                will appear here.
              </span>
            </div>
          ) : (
            <div>
              {visibleAttendance.map(
                (attendance, index) => (
                  <div
                    className="activity-item"
                    key={
                      attendance.id ||
                      attendance.employeeId ||
                      index
                    }
                  >
                    <div className="avatar green">
                      {initials(
                        attendance.employeeName
                      )}
                    </div>

                    <div className="activity-main">
                      <strong>
                        {
                          attendance.employeeName ||
                          'Employee'
                        }
                      </strong>

                      <span>
                        Check-in{' '}
                        {
                          attendance.checkIn
                            ?.substring(0, 5) ||
                          '--:--'
                        }

                        {attendance.checkOut
                          ? ` · Check-out ${attendance.checkOut.substring(
                            0,
                            5
                          )}`
                          : ''}
                      </span>
                    </div>

                    <StatusBadge
                      status={
                        attendance.status
                      }
                    />
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>

      {/* =================================================
          EMPLOYEE DIRECTORY
      ================================================= */}

      <section className="panel employee-panel">
        <div className="panel-header employee-header">
          <div>
            <div className="section-kicker">
              PEOPLE DIRECTORY
            </div>

            <h2>
              Employees
            </h2>

            <p>
              Your latest workforce
              records
            </p>
          </div>

          <div className="employee-tools">
            <div className="search-box">
              <Search size={18} />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search employees..."
              />
            </div>

            <button
              className="more-button"
              onClick={() =>
                router.push(
                  '/admin/employees'
                )
              }
              aria-label="Manage employees"
            >
              <MoreHorizontal
                size={21}
              />
            </button>
          </div>
        </div>

        <div className="employee-table-wrap">
          <table className="employee-table">
            <thead>
              <tr>
                <th>
                  EMPLOYEE
                </th>

                <th>
                  DEPARTMENT
                </th>

                <th>
                  DESIGNATION
                </th>

                <th>
                  ROLE
                </th>

                <th>
                  STATUS
                </th>

                <th />
              </tr>
            </thead>

            <tbody>
              {filteredEmployees.map(
                (employee, index) => (
                  <tr
                    key={
                      employee.id ||
                      employee.employeeId ||
                      index
                    }
                  >
                    <td>
                      <div className="employee-cell">
                        <div className="avatar purple">
                          {initials(
                            `${employee.firstName ||
                            ''
                            } ${employee.lastName ||
                            ''
                            }`
                          )}
                        </div>

                        <div>
                          <strong>
                            {
                              employee.firstName
                            }{' '}
                            {
                              employee.lastName
                            }
                          </strong>

                          <span>
                            {
                              employee.email ||
                              '—'
                            }
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      {
                        employee.department ||
                        '—'
                      }
                    </td>

                    <td>
                      {
                        employee.designation ||
                        '—'
                      }
                    </td>

                    <td>
                      <span
                        className={`role-pill ${String(
                          employee.role ||
                          ''
                        ).toLowerCase()}`}
                      >
                        {
                          employee.role ||
                          'EMPLOYEE'
                        }
                      </span>
                    </td>

                    <td>
                      <StatusBadge
                        status={
                          employee.active
                            ? 'ACTIVE'
                            : 'INACTIVE'
                        }
                      />
                    </td>

                    <td>
                      <button
                        className="row-arrow"
                        onClick={() =>
                          router.push(
                            '/admin/employees'
                          )
                        }
                        aria-label="Open employee directory"
                      >
                        <ArrowUpRight
                          size={18}
                        />
                      </button>
                    </td>
                  </tr>
                )
              )}

              {filteredEmployees.length ===
                0 && (
                  <tr>
                    <td colSpan="6">
                      <div className="table-empty">
                        No employees match
                        your search.
                      </div>
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <span>
            Showing{' '}
            {filteredEmployees.length}{' '}
            of {employees.length}{' '}
            employees
          </span>

          <button
            onClick={() =>
              router.push(
                '/admin/employees'
              )
            }
          >
            Manage directory
            <ArrowRight size={17} />
          </button>
        </div>
      </section>

      {/* =================================================
          ADMIN INSIGHT
      ================================================= */}

      <div className="insight-bar">
        <div className="insight-icon">
          <Sparkles size={20} />
        </div>

        <div>
          <strong>
            Admin insight
          </strong>

          <span>
            {pendingCount > 0
              ? `You have ${pendingCount} leave ${pendingCount === 1
                ? 'request'
                : 'requests'
              } requiring attention.`
              : 'Your approval queue is clear. Great job keeping operations moving.'}
          </span>
        </div>

        <button
          onClick={() =>
            router.push(
              '/admin/leave'
            )
          }
        >
          Review queue
          <ArrowRight size={17} />
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   PREMIUM STYLES
========================================================= */

const styles = `
@import url(
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap'
);

/* =========================================================
   BASE
========================================================= */

.premium-shell {
  --p-bg: var(--bg-primary, #07111f);
  --p-card: var(--card-bg, #0d1828);
  --p-border: var(
    --card-border,
    rgba(148, 163, 184, 0.16)
  );

  --p-text: var(
    --text-primary,
    #f8fafc
  );

  --p-muted: var(
    --text-secondary,
    #94a3b8
  );

  min-height: 100vh;

  margin: -24px;

  padding: 34px;

  position: relative;

  overflow: hidden;

  background:
    radial-gradient(
      circle at 82% 0%,
      rgba(79, 70, 229, 0.15),
      transparent 28%
    ),
    radial-gradient(
      circle at 8% 28%,
      rgba(6, 182, 212, 0.07),
      transparent 22%
    ),
    var(--p-bg);

  color: var(--p-text);

  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  font-size: 14px;
}

.premium-shell *,
.premium-shell *::before,
.premium-shell *::after {
  box-sizing: border-box;
}

.premium-shell button,
.premium-shell input {
  font: inherit;
}

/* =========================================================
   BACKGROUND
========================================================= */

.dashboard-bg-orb {
  position: absolute;

  border-radius: 50%;

  filter: blur(80px);

  pointer-events: none;

  opacity: 0.32;
}

.orb-one {
  width: 260px;
  height: 260px;

  right: -100px;
  top: 160px;

  background:
    rgba(79, 70, 229, 0.14);
}

.orb-two {
  width: 220px;
  height: 220px;

  left: -110px;
  bottom: 180px;

  background:
    rgba(6, 182, 212, 0.09);
}

/* =========================================================
   HEADER
========================================================= */

.premium-header {
  position: relative;
  z-index: 1;

  display: flex;

  justify-content: space-between;

  align-items: flex-end;

  gap: 28px;

  margin-bottom: 30px;
}

.eyebrow,
.section-kicker {
  display: flex;

  align-items: center;

  gap: 8px;

  color: #818cf8;

  font-size: 12px;

  font-weight: 800;

  letter-spacing: 1.5px;

  line-height: 1.2;
}

.live-dot {
  width: 7px;
  height: 7px;

  flex-shrink: 0;

  border-radius: 50%;

  background: #22c55e;

  box-shadow:
    0 0 0 4px
    rgba(34, 197, 94, 0.1);
}

.premium-header h1 {
  margin: 10px 0 7px;

  font-size: 34px;

  line-height: 1.15;

  letter-spacing: -1.2px;

  font-weight: 800;
}

.premium-header p {
  margin: 0;

  color: var(--p-muted);

  font-size: 15px;

  line-height: 1.6;
}

.header-actions {
  display: flex;

  align-items: center;

  gap: 10px;
}

.date-pill,
.icon-action,
.more-button {
  height: 44px;

  border:
    1px solid var(--p-border);

  background:
    rgba(255, 255, 255, 0.035);

  color: var(--p-text);

  border-radius: 13px;
}

.date-pill {
  display: flex;

  align-items: center;

  gap: 9px;

  padding: 0 15px;

  color: var(--p-muted);

  font-size: 13px;

  font-weight: 600;

  white-space: nowrap;
}

.icon-action,
.more-button {
  width: 44px;

  display: grid;

  place-items: center;

  cursor: pointer;

  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.icon-action:hover,
.more-button:hover {
  background:
    rgba(255, 255, 255, 0.08);

  border-color:
    rgba(129, 140, 248, 0.4);

  transform: translateY(-1px);
}

/* =========================================================
   STAT CARDS
========================================================= */

.stats-grid {
  position: relative;

  z-index: 1;

  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  gap: 16px;

  margin-bottom: 20px;
}

.premium-stat-card {
  position: relative;

  overflow: hidden;

  min-height: 170px;

  padding: 21px;

  border:
    1px solid var(--p-border);

  border-radius: 20px;

  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.055),
      rgba(255, 255, 255, 0.018)
    );

  box-shadow:
    0 15px 40px
    rgba(0, 0, 0, 0.14);

  transition:
    transform 0.25s ease,
    border-color 0.25s ease,
    box-shadow 0.25s ease;
}

.premium-stat-card:hover {
  transform: translateY(-4px);

  border-color:
    rgba(129, 140, 248, 0.28);

  box-shadow:
    0 22px 48px
    rgba(0, 0, 0, 0.2);
}

.stat-top {
  display: flex;

  justify-content: space-between;

  align-items: center;
}

.stat-icon {
  width: 44px;
  height: 44px;

  display: grid;

  place-items: center;

  border-radius: 13px;

  border:
    1px solid currentColor;
}

.stat-icon.blue {
  color: #818cf8;

  background:
    rgba(79, 70, 229, 0.12);
}

.stat-icon.green {
  color: #34d399;

  background:
    rgba(16, 185, 129, 0.11);
}

.stat-icon.amber {
  color: #fbbf24;

  background:
    rgba(245, 158, 11, 0.11);
}

.stat-icon.purple {
  color: #a78bfa;

  background:
    rgba(139, 92, 246, 0.11);
}

.stat-trend {
  display: flex;

  align-items: center;

  gap: 4px;

  padding: 5px 8px;

  border-radius: 8px;

  font-size: 12px;

  font-weight: 800;

  color: #34d399;

  background:
    rgba(16, 185, 129, 0.09);
}

.stat-value {
  margin-top: 18px;

  font-size: 32px;

  line-height: 1;

  font-weight: 800;

  letter-spacing: -0.8px;
}

.stat-title {
  margin-top: 8px;

  font-size: 15px;

  font-weight: 700;
}

.stat-subtitle {
  margin-top: 5px;

  color: var(--p-muted);

  font-size: 12px;

  line-height: 1.5;
}

.stat-glow {
  position: absolute;

  width: 100px;
  height: 100px;

  right: -38px;
  bottom: -48px;

  border-radius: 50%;

  filter: blur(28px);

  opacity: 0.2;
}

/* =========================================================
   PANELS
========================================================= */

.main-grid {
  position: relative;

  z-index: 1;

  display: grid;

  grid-template-columns:
    1.08fr 0.92fr;

  gap: 20px;

  margin-bottom: 20px;
}

.panel {
  overflow: hidden;

  border:
    1px solid var(--p-border);

  border-radius: 20px;

  background:
    linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.045),
      rgba(255, 255, 255, 0.018)
    );

  box-shadow:
    0 15px 40px
    rgba(0, 0, 0, 0.11);
}

.panel-header {
  display: flex;

  justify-content: space-between;

  align-items: flex-start;

  gap: 20px;

  padding: 23px;

  border-bottom:
    1px solid var(--p-border);
}

.panel-header h2 {
  margin:
    7px 0 5px;

  font-size: 21px;

  line-height: 1.25;

  font-weight: 800;

  letter-spacing: -0.3px;
}

.panel-header p {
  margin: 0;

  color: var(--p-muted);

  font-size: 13px;

  line-height: 1.5;
}

.text-button {
  display: flex;

  align-items: center;

  gap: 6px;

  border: 0;

  background: transparent;

  color: #a5b4fc;

  cursor: pointer;

  font-size: 13px;

  font-weight: 700;

  white-space: nowrap;

  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.text-button:hover {
  color: #c7d2fe;

  transform: translateX(2px);
}

.header-accent {
  color: #a78bfa;

  flex-shrink: 0;
}

/* =========================================================
   ATTENDANCE
========================================================= */

.attendance-overview {
  display: flex;

  align-items: center;

  gap: 38px;

  padding:
    28px 28px 23px;
}

.attendance-ring-wrap {
  width: 158px;
  height: 158px;

  position: relative;

  flex-shrink: 0;
}

.attendance-ring {
  width: 100%;
  height: 100%;

  transform:
    rotate(-90deg);
}

.ring-track {
  fill: none;

  stroke:
    rgba(148, 163, 184, 0.1);

  stroke-width: 9;
}

.ring-progress {
  fill: none;

  stroke: #10b981;

  stroke-width: 9;

  stroke-linecap: round;

  filter:
    drop-shadow(
      0 0 8px
      rgba(16, 185, 129, 0.25)
    );
}

.ring-center {
  position: absolute;

  inset: 0;

  display: flex;

  flex-direction: column;

  justify-content: center;

  align-items: center;
}

.ring-center strong {
  font-size: 29px;

  line-height: 1;

  font-weight: 800;
}

.ring-center span {
  margin-top: 6px;

  color: var(--p-muted);

  font-size: 11px;

  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 1px;
}

.attendance-stats {
  flex: 1;

  display: grid;

  gap: 18px;
}

.attendance-stat {
  display: flex;

  align-items: center;

  gap: 12px;
}

.attendance-stat div {
  display: flex;

  flex-direction: column;
}

.attendance-stat strong {
  font-size: 19px;

  line-height: 1.1;

  font-weight: 800;
}

.attendance-stat small {
  color: var(--p-muted);

  font-size: 12px;

  margin-top: 4px;
}

.legend-dot {
  width: 10px;
  height: 10px;

  flex-shrink: 0;

  border-radius: 50%;
}

.legend-dot.present {
  background: #10b981;
}

.legend-dot.late {
  background: #8b5cf6;
}

.legend-dot.absent {
  background: #ef4444;
}

.attendance-health {
  margin:
    0 22px 22px;

  padding: 15px;

  border-radius: 13px;

  background:
    rgba(255, 255, 255, 0.025);

  border:
    1px solid var(--p-border);
}

.attendance-health > div {
  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 9px;

  color: var(--p-muted);

  font-size: 12px;
}

.attendance-health strong {
  color: var(--p-text);

  font-size: 14px;
}

.mini-bar {
  height: 7px;

  border-radius: 99px;

  background:
    rgba(148, 163, 184, 0.1);

  overflow: hidden;
}

.mini-bar-fill {
  height: 100%;

  border-radius: 99px;

  background:
    linear-gradient(
      90deg,
      #10b981,
      #34d399
    );

  transition:
    width 0.5s ease;
}

/* =========================================================
   QUICK ACTIONS
========================================================= */

.quick-actions {
  padding:
    14px 15px 16px;

  display: grid;

  grid-template-columns:
    1fr 1fr;

  gap: 10px;
}

.quick-action {
  min-height: 88px;

  display: flex;

  align-items: center;

  gap: 13px;

  text-align: left;

  padding: 13px;

  border:
    1px solid transparent;

  border-radius: 14px;

  color: var(--p-text);

  background:
    rgba(255, 255, 255, 0.025);

  cursor: pointer;

  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    background 0.2s ease;
}

.quick-action:hover {
  transform: translateY(-2px);

  border-color:
    rgba(129, 140, 248, 0.22);

  background:
    rgba(129, 140, 248, 0.055);
}

.quick-icon {
  width: 42px;
  height: 42px;

  display: grid;

  place-items: center;

  flex-shrink: 0;

  border-radius: 12px;
}

.quick-icon svg {
  width: 21px;
  height: 21px;
}

.quick-icon.blue {
  color: #818cf8;

  background:
    rgba(79, 70, 229, 0.12);
}

.quick-icon.green {
  color: #34d399;

  background:
    rgba(16, 185, 129, 0.11);
}

.quick-icon.amber {
  color: #fbbf24;

  background:
    rgba(245, 158, 11, 0.11);
}

.quick-icon.purple {
  color: #a78bfa;

  background:
    rgba(139, 92, 246, 0.11);
}

.quick-content {
  flex: 1;

  min-width: 0;
}

.quick-action strong {
  display: block;

  font-size: 14px;

  line-height: 1.3;

  font-weight: 700;
}

.quick-action span {
  display: block;

  margin-top: 5px;

  color: var(--p-muted);

  font-size: 12px;

  line-height: 1.4;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;
}

.quick-action > svg {
  flex-shrink: 0;

  color: #64748b;
}

/* =========================================================
   LISTS
========================================================= */

.leave-item,
.activity-item {
  display: flex;

  align-items: center;

  gap: 13px;

  padding:
    15px 21px;

  border-bottom:
    1px solid var(--p-border);

  transition:
    background 0.18s ease;
}

.leave-item:last-child,
.activity-item:last-child {
  border-bottom: 0;
}

.leave-item:hover,
.activity-item:hover {
  background:
    rgba(255, 255, 255, 0.025);
}

.avatar {
  width: 40px;
  height: 40px;

  border-radius: 12px;

  display: grid;

  place-items: center;

  flex-shrink: 0;

  font-size: 12px;

  font-weight: 800;
}

.avatar.blue {
  color: #818cf8;

  background:
    rgba(79, 70, 229, 0.12);
}

.avatar.green {
  color: #34d399;

  background:
    rgba(16, 185, 129, 0.11);
}

.avatar.purple {
  color: #a78bfa;

  background:
    rgba(139, 92, 246, 0.11);
}

.leave-main,
.activity-main {
  flex: 1;

  min-width: 0;
}

.leave-title-row {
  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 12px;
}

.leave-main strong,
.activity-main strong {
  font-size: 14px;

  line-height: 1.35;

  font-weight: 800;
}

.leave-main > span,
.activity-main > span {
  display: block;

  color: var(--p-muted);

  font-size: 12px;

  line-height: 1.5;

  margin-top: 4px;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;
}

.leave-main em {
  display: block;

  color: #64748b;

  font-size: 11px;

  line-height: 1.4;

  margin-top: 5px;

  white-space: nowrap;

  overflow: hidden;

  text-overflow: ellipsis;
}

/* =========================================================
   BADGES
========================================================= */

.premium-badge {
  display: inline-flex;

  align-items: center;

  gap: 6px;

  padding:
    5px 9px;

  border-radius: 8px;

  font-size: 11px;

  line-height: 1.2;

  font-weight: 800;

  white-space: nowrap;
}

.premium-badge span {
  width: 6px;
  height: 6px;

  border-radius: 50%;

  background: currentColor;
}

.premium-badge.success {
  color: #34d399;

  background:
    rgba(16, 185, 129, 0.1);
}

.premium-badge.warning {
  color: #fbbf24;

  background:
    rgba(245, 158, 11, 0.1);
}

.premium-badge.danger {
  color: #f87171;

  background:
    rgba(239, 68, 68, 0.1);
}

.premium-badge.purple {
  color: #a78bfa;

  background:
    rgba(139, 92, 246, 0.1);
}

.premium-badge.muted {
  color: #94a3b8;

  background:
    rgba(148, 163, 184, 0.08);
}

/* =========================================================
   LEAVE BUTTONS
========================================================= */

.leave-actions {
  display: flex;

  gap: 7px;

  flex-shrink: 0;
}

.approve-btn,
.reject-btn {
  display: inline-flex;

  align-items: center;

  justify-content: center;

  gap: 5px;

  min-height: 34px;

  padding:
    7px 11px;

  border-radius: 8px;

  cursor: pointer;

  font-size: 12px;

  font-weight: 800;

  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.approve-btn:hover,
.reject-btn:hover {
  transform: translateY(-1px);
}

.approve-btn:disabled,
.reject-btn:disabled {
  cursor: not-allowed;

  opacity: 0.6;
}

.approve-btn {
  color: #34d399;

  border:
    1px solid
    rgba(16, 185, 129, 0.25);

  background:
    rgba(16, 185, 129, 0.08);
}

.reject-btn {
  color: #f87171;

  border:
    1px solid
    rgba(239, 68, 68, 0.22);

  background:
    rgba(239, 68, 68, 0.06);
}

.cancelled-label,
.actioned-label {
  color: var(--p-muted);

  font-size: 12px;

  font-weight: 600;

  white-space: nowrap;
}

.cancelled-label {
  display: flex;

  align-items: center;

  gap: 5px;
}

/* =========================================================
   EMPLOYEE TABLE
========================================================= */

.employee-panel {
  position: relative;

  z-index: 1;

  margin-bottom: 20px;
}

.employee-header {
  align-items: center;
}

.employee-tools {
  display: flex;

  align-items: center;

  gap: 9px;
}

.search-box {
  width: 270px;
  height: 42px;

  display: flex;

  align-items: center;

  gap: 9px;

  padding:
    0 12px;

  border:
    1px solid var(--p-border);

  border-radius: 10px;

  background:
    rgba(255, 255, 255, 0.025);

  color: #64748b;

  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.search-box:focus-within {
  border-color:
    rgba(129, 140, 248, 0.4);

  background:
    rgba(255, 255, 255, 0.04);
}

.search-box input {
  width: 100%;

  border: 0;

  outline: 0;

  color: var(--p-text);

  background: transparent;

  font-size: 13px;
}

.search-box input::placeholder {
  color: #64748b;
}

.more-button {
  width: 42px;
}

.employee-table-wrap {
  overflow-x: auto;
}

.employee-table {
  width: 100%;

  min-width: 820px;

  border-collapse: collapse;
}

.employee-table th {
  padding:
    14px 21px;

  color: #64748b;

  background:
    rgba(255, 255, 255, 0.018);

  border-bottom:
    1px solid var(--p-border);

  text-align: left;

  font-size: 11px;

  letter-spacing: 1px;

  font-weight: 800;
}

.employee-table td {
  padding:
    15px 21px;

  border-bottom:
    1px solid var(--p-border);

  color: #cbd5e1;

  font-size: 13px;

  line-height: 1.5;
}

.employee-table tbody tr {
  transition:
    background 0.18s ease;
}

.employee-table tbody tr:hover {
  background:
    rgba(255, 255, 255, 0.025);
}

.employee-cell {
  display: flex;

  align-items: center;

  gap: 11px;
}

.employee-cell strong {
  display: block;

  color: var(--p-text);

  font-size: 14px;

  line-height: 1.35;

  font-weight: 700;
}

.employee-cell span {
  display: block;

  margin-top: 4px;

  color: #64748b;

  font-size: 11px;

  line-height: 1.4;
}

.role-pill {
  display: inline-flex;

  padding:
    5px 9px;

  border-radius: 7px;

  font-size: 11px;

  line-height: 1.2;

  font-weight: 800;

  background:
    rgba(148, 163, 184, 0.07);

  color: #94a3b8;
}

.role-pill.admin {
  color: #818cf8;

  background:
    rgba(79, 70, 229, 0.1);
}

.role-pill.hr {
  color: #a78bfa;

  background:
    rgba(139, 92, 246, 0.1);
}

.row-arrow {
  width: 32px;
  height: 32px;

  display: grid;

  place-items: center;

  border:
    1px solid var(--p-border);

  background: transparent;

  color: #94a3b8;

  border-radius: 8px;

  cursor: pointer;

  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.row-arrow:hover {
  background:
    rgba(129, 140, 248, 0.1);

  color: #a5b4fc;

  transform: translateY(-1px);
}

.table-footer {
  display: flex;

  justify-content: space-between;

  align-items: center;

  gap: 15px;

  padding:
    15px 21px;

  color: #64748b;

  font-size: 12px;
}

.table-footer button {
  display: flex;

  align-items: center;

  gap: 6px;

  border: 0;

  background: transparent;

  color: #a5b4fc;

  cursor: pointer;

  font-size: 12px;

  font-weight: 800;
}

.table-footer button:hover {
  color: #c7d2fe;
}

.table-empty {
  padding: 38px 25px;

  text-align: center;

  color: #64748b;

  font-size: 13px;
}

/* =========================================================
   EMPTY STATE
========================================================= */

.empty-state {
  min-height: 210px;

  display: flex;

  flex-direction: column;

  justify-content: center;

  align-items: center;

  text-align: center;

  padding: 30px;
}

.empty-icon {
  width: 54px;
  height: 54px;

  display: grid;

  place-items: center;

  margin-bottom: 12px;

  color: #a78bfa;

  border-radius: 16px;

  background:
    rgba(139, 92, 246, 0.08);
}

.empty-icon.green {
  color: #34d399;

  background:
    rgba(16, 185, 129, 0.08);
}

.empty-state strong {
  font-size: 15px;

  line-height: 1.4;

  font-weight: 800;
}

.empty-state span {
  margin-top: 6px;

  color: #64748b;

  font-size: 12px;

  line-height: 1.5;
}

/* =========================================================
   INSIGHT
========================================================= */

.insight-bar {
  position: relative;

  z-index: 1;

  display: flex;

  align-items: center;

  gap: 13px;

  padding:
    16px 18px;

  border:
    1px solid
    rgba(129, 140, 248, 0.16);

  border-radius: 16px;

  background:
    rgba(79, 70, 229, 0.06);
}

.insight-icon {
  width: 38px;
  height: 38px;

  display: grid;

  place-items: center;

  color: #a78bfa;

  border-radius: 10px;

  background:
    rgba(139, 92, 246, 0.1);

  flex-shrink: 0;
}

.insight-bar > div:nth-child(2) {
  flex: 1;

  min-width: 0;
}

.insight-bar strong,
.insight-bar span {
  display: block;
}

.insight-bar strong {
  font-size: 13px;

  line-height: 1.3;

  font-weight: 800;
}

.insight-bar span {
  margin-top: 3px;

  color: var(--p-muted);

  font-size: 12px;

  line-height: 1.5;
}

.insight-bar button {
  display: flex;

  align-items: center;

  gap: 6px;

  border: 0;

  background: transparent;

  color: #a5b4fc;

  cursor: pointer;

  font-size: 12px;

  font-weight: 800;

  white-space: nowrap;
}

.insight-bar button:hover {
  color: #c7d2fe;
}

/* =========================================================
   LOADING
========================================================= */

.premium-loading {
  min-height: 70vh;

  display: flex;

  align-items: center;

  justify-content: center;

  gap: 15px;
}

.loading-orb {
  width: 48px;
  height: 48px;

  display: grid;

  place-items: center;

  color: #a78bfa;

  border:
    1px solid
    rgba(139, 92, 246, 0.25);

  border-radius: 14px;

  background:
    rgba(139, 92, 246, 0.08);
}

.premium-loading div:nth-child(2) {
  display: flex;

  flex-direction: column;

  gap: 5px;
}

.premium-loading strong {
  font-size: 16px;

  line-height: 1.3;
}

.premium-loading span {
  color: var(--p-muted);

  font-size: 12px;

  line-height: 1.4;
}

/* =========================================================
   ANIMATION
========================================================= */

.spin {
  animation:
    spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform:
      rotate(360deg);
  }
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns:
      repeat(2, 1fr);
  }

  .main-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 850px) {
  .premium-shell {
    padding: 27px;
  }

  .premium-header {
    align-items: flex-start;

    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .date-pill {
    flex: 1;
  }

  .employee-header {
    align-items: flex-start;

    flex-direction: column;
  }

  .employee-tools {
    width: 100%;
  }

  .search-box {
    flex: 1;

    width: auto;
  }
}

@media (max-width: 700px) {
  .premium-shell {
    margin: -16px;

    padding: 20px;

    font-size: 14px;
  }

  .premium-header {
    margin-bottom: 24px;
  }

  .premium-header h1 {
    font-size: 29px;

    letter-spacing: -0.8px;
  }

  .premium-header p {
    font-size: 14px;
  }

  .stats-grid {
    grid-template-columns: 1fr;

    gap: 13px;
  }

  .premium-stat-card {
    min-height: 155px;

    padding: 19px;
  }

  .stat-value {
    font-size: 30px;
  }

  .quick-actions {
    grid-template-columns: 1fr;
  }

  .quick-action {
    min-height: 82px;
  }

  .attendance-overview {
    gap: 20px;

    padding: 22px;
  }

  .attendance-ring-wrap {
    width: 125px;
    height: 125px;
  }

  .ring-center strong {
    font-size: 25px;
  }

  .panel-header {
    padding: 20px;
  }

  .panel-header h2 {
    font-size: 19px;
  }

  .panel-header p {
    font-size: 12px;
  }

  .leave-item,
  .activity-item {
    align-items: flex-start;

    padding:
      14px 17px;
  }

  .leave-title-row {
    align-items: flex-start;

    flex-direction: column;

    gap: 6px;
  }

  .leave-actions {
    flex-direction: column;

    width: 82px;
  }

  .approve-btn,
  .reject-btn {
    width: 100%;
  }

  .insight-bar {
    align-items: flex-start;

    padding: 15px;
  }

  .insight-bar button {
    display: none;
  }

  .table-footer {
    align-items: flex-start;

    flex-direction: column;

    padding:
      15px 17px;
  }
}

@media (max-width: 480px) {
  .premium-shell {
    padding: 16px;
  }

  .premium-header h1 {
    font-size: 26px;
  }

  .date-pill {
    font-size: 12px;
  }

  .attendance-overview {
    flex-direction: column;

    text-align: center;
  }

  .attendance-stats {
    width: 100%;
  }

  .attendance-stat {
    justify-content: center;
  }

  .attendance-health {
    margin:
      0 16px 16px;
  }

  .employee-tools {
    flex-direction: column;

    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }

  .more-button {
    display: none;
  }
}
`;