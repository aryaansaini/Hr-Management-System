'use client';

import { useEffect, useMemo, useState } from 'react';

import {
    getAttendanceSummaryByDate,
    exportAttendanceRange,
} from '@/lib/adminApi';

import { downloadBlob } from '@/lib/downloadFile';
import EmployeeAttendanceModal from './EmployeeAttendanceModal';

import toast from 'react-hot-toast';

import {
    Download,
    Loader2,
    Search,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Eye,
    Clock3,
    Users,
    CheckCircle2,
    XCircle,
    Coffee,
    RefreshCw,
    SlidersHorizontal,
    Building2,
} from 'lucide-react';

/* =========================================================
   STATUS COLORS
========================================================= */

const STATUS_COLORS = {
    PRESENT: {
        bg: '#ecfdf5',
        color: '#15803d',
        border: '#bbf7d0',
    },

    HALF_DAY: {
        bg: '#fff7ed',
        color: '#c2410c',
        border: '#fed7aa',
    },

    ON_LEAVE: {
        bg: '#eff6ff',
        color: '#2563eb',
        border: '#bfdbfe',
    },

    ABSENT: {
        bg: '#fef2f2',
        color: '#dc2626',
        border: '#fecaca',
    },
};

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
    const style =
        STATUS_COLORS[status] || {
            bg: '#f1f5f9',
            color: '#64748b',
            border: '#e2e8f0',
        };

    return (
        <span
            className="status-badge"
            style={{
                backgroundColor: style.bg,
                color: style.color,
                borderColor: style.border,
            }}
        >
            <span className="status-dot" />

            {status
                ? status.replace(/_/g, ' ')
                : '--'}
        </span>
    );
}

/* =========================================================
   FORMAT DURATION
========================================================= */

function formatDuration(mins) {
    if (!mins && mins !== 0) {
        return '--';
    }

    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    return `${minutes}m`;
}

/* =========================================================
   FORMAT BREAK TIMES
========================================================= */

function formatBreakTimes(breaks) {
    if (!breaks || breaks.length === 0) {
        return '--';
    }

    return breaks
        .map((breakItem) => {
            const start = breakItem?.breakStart
                ? String(
                    breakItem.breakStart
                ).slice(0, 5)
                : '--';

            const end = breakItem?.breakEnd
                ? String(
                    breakItem.breakEnd
                ).slice(0, 5)
                : '...';

            return `${start}-${end}`;
        })
        .join(', ');
}

/* =========================================================
   TODAY IST
========================================================= */

function todayIST() {
    const now = new Date();

    const ist = new Date(
        now.toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
        })
    );

    return ist.toISOString().split('T')[0];
}

/* =========================================================
   DISPLAY DATE
========================================================= */

function formatDisplayDate(value) {
    if (!value) {
        return '--';
    }

    const date = new Date(
        `${value}T00:00:00`
    );

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

/* =========================================================
   EMPLOYEE INITIALS
========================================================= */

function getEmployeeInitials(name) {
    const value = String(
        name || 'Employee'
    ).trim();

    if (!value) {
        return 'E';
    }

    return value
        .split(/\s+/)
        .map((part) => part.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AttendanceReport() {
    const maxDate = useMemo(
        () => todayIST(),
        []
    );

    const [fromDate, setFromDate] =
        useState(todayIST());

    const [toDate, setToDate] =
        useState(todayIST());

    const [search, setSearch] =
        useState('');

    const [statusFilter, setStatusFilter] =
        useState('ALL');

    const [rows, setRows] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [page, setPage] =
        useState(0);

    const [totalPages, setTotalPages] =
        useState(1);

    const [
        selectedEmployeeId,
        setSelectedEmployeeId,
    ] = useState(null);

    const [exporting, setExporting] =
        useState(false);

    /* =====================================================
       LOAD ATTENDANCE
    ===================================================== */

    useEffect(() => {
        let active = true;

        const loadAttendance = async () => {
            setLoading(true);

            try {
                const response =
                    await getAttendanceSummaryByDate(
                        toDate,
                        page,
                        50
                    );

                if (!active) {
                    return;
                }

                const pageData =
                    response?.data?.data;

                setRows(
                    pageData?.content || []
                );

                setTotalPages(
                    Math.max(
                        1,
                        pageData?.totalPages ?? 1
                    )
                );
            } catch (error) {
                if (!active) {
                    return;
                }

                console.error(
                    'Attendance API error:',
                    error
                );

                toast.error(
                    error?.response?.data
                        ?.message ||
                    'Failed to load attendance'
                );

                setRows([]);
                setTotalPages(1);
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadAttendance();

        return () => {
            active = false;
        };
    }, [toDate, page]);

    /* =====================================================
       FILTER ROWS
    ===================================================== */

    const filteredRows = useMemo(() => {
        const normalizedSearch =
            search.trim().toLowerCase();

        return rows.filter((row) => {
            const employeeName =
                String(
                    row?.employeeName || ''
                ).toLowerCase();

            const employeeCode =
                String(
                    row?.employeeCode || ''
                ).toLowerCase();

            const employeeId =
                String(
                    row?.employeeId || ''
                ).toLowerCase();

            const matchesSearch =
                !normalizedSearch ||
                employeeName.includes(
                    normalizedSearch
                ) ||
                employeeCode.includes(
                    normalizedSearch
                ) ||
                employeeId.includes(
                    normalizedSearch
                );

            const matchesStatus =
                statusFilter === 'ALL' ||
                row?.status === statusFilter;

            return (
                matchesSearch &&
                matchesStatus
            );
        });
    }, [
        rows,
        search,
        statusFilter,
    ]);

    /* =====================================================
       SUMMARY
    ===================================================== */

    const summary = useMemo(() => {
        const total = rows.length;

        const present = rows.filter(
            (row) =>
                row?.status === 'PRESENT'
        ).length;

        const absent = rows.filter(
            (row) =>
                row?.status === 'ABSENT'
        ).length;

        const leave = rows.filter(
            (row) =>
                row?.status === 'ON_LEAVE'
        ).length;

        const halfDay = rows.filter(
            (row) =>
                row?.status === 'HALF_DAY'
        ).length;

        const onBreak = rows.filter(
            (row) => row?.onBreak
        ).length;

        return {
            total,
            present,
            absent,
            leave,
            halfDay,
            onBreak,
        };
    }, [rows]);

    /* =====================================================
       FROM DATE CHANGE
    ===================================================== */

    const handleFromDateChange = (
        event
    ) => {
        const value =
            event.target.value;

        if (!value) {
            return;
        }

        if (value > maxDate) {
            toast.error(
                'Future dates are not allowed'
            );
            return;
        }

        if (value > toDate) {
            toast.error(
                'From date cannot be after To date'
            );
            return;
        }

        setFromDate(value);
        setPage(0);
    };

    /* =====================================================
       TO DATE CHANGE
    ===================================================== */

    const handleToDateChange = (
        event
    ) => {
        const value =
            event.target.value;

        if (!value) {
            return;
        }

        if (value > maxDate) {
            toast.error(
                'Future dates are not allowed'
            );
            return;
        }

        if (value < fromDate) {
            toast.error(
                'To date cannot be before From date'
            );
            return;
        }

        setToDate(value);
        setPage(0);
    };

    /* =====================================================
       EXPORT
    ===================================================== */

    const handleExport = async () => {
        if (exporting) {
            return;
        }

        setExporting(true);

        try {
            const response =
                await exportAttendanceRange(
                    fromDate,
                    toDate,
                    statusFilter,
                    search
                );

            downloadBlob(
                response,
                `attendance_${fromDate}_to_${toDate}.xlsx`
            );

            toast.success(
                'Attendance exported successfully'
            );
        } catch (error) {
            console.error(
                'Attendance export error:',
                error
            );

            toast.error(
                error?.response?.data
                    ?.message ||
                'Export failed'
            );
        } finally {
            setExporting(false);
        }
    };

    /* =====================================================
       RESET FILTERS
    ===================================================== */

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('ALL');
        setPage(0);
    };

    const hasFilters =
        search.trim().length > 0 ||
        statusFilter !== 'ALL';

    /* =====================================================
       UI
    ===================================================== */

    return (
        <div className="attendance-page">
            <style jsx>{`

                /* =================================================
                   IMPORTANT:
                   LIGHT THEME IS THE DEFAULT.
                   DO NOT USE GLOBAL THEME VARIABLES HERE.
                ================================================= */

                .attendance-page {
                    --attendance-page-bg: #f6f8fc;

                    --attendance-surface: #ffffff;

                    --attendance-surface-soft: #f8fafc;

                    --attendance-surface-hover: #f5f8fc;

                    --attendance-border: #e2e8f0;

                    --attendance-border-soft: #edf1f5;

                    --attendance-text: #172033;

                    --attendance-text-secondary: #475569;

                    --attendance-text-muted: #64748b;

                    --attendance-text-faint: #94a3b8;

                    --attendance-primary: #2563eb;

                    --attendance-primary-soft: #eff6ff;

                    --attendance-primary-border: #bfdbfe;

                    width: 100%;

                    min-height: 100%;

                    color: var(--attendance-text);

                    background:
                        var(--attendance-page-bg);

                    font-family:
                        Inter,
                        ui-sans-serif,
                        system-ui,
                        -apple-system,
                        BlinkMacSystemFont,
                        "Segoe UI",
                        sans-serif;

                    font-size: 15px;

                    letter-spacing: -0.01em;
                }

                /* =================================================
                   DARK MODE
                   ONLY WHEN PARENT HAS .dark
                ================================================= */

                :global(.dark) .attendance-page {
                    --attendance-page-bg: #070b14;

                    --attendance-surface: #0d1422;

                    --attendance-surface-soft: #111a2b;

                    --attendance-surface-hover: #131e30;

                    --attendance-border: #1e2a3d;

                    --attendance-border-soft:
                        rgba(
                            148,
                            163,
                            184,
                            0.10
                        );

                    --attendance-text: #f8fafc;

                    --attendance-text-secondary:
                        #cbd5e1;

                    --attendance-text-muted:
                        #94a3b8;

                    --attendance-text-faint:
                        #64748b;

                    --attendance-primary: #60a5fa;

                    --attendance-primary-soft:
                        rgba(
                            59,
                            130,
                            246,
                            0.10
                        );

                    --attendance-primary-border:
                        rgba(
                            96,
                            165,
                            250,
                            0.20
                        );
                }

                /* =================================================
                   PAGE HEADER
                ================================================= */

                .page-header {
                    display: flex;

                    align-items: flex-start;

                    justify-content:
                        space-between;

                    gap: 24px;

                    margin-bottom: 26px;
                }

                .header-left {
                    min-width: 0;
                }

                .title-row {
                    display: flex;

                    align-items: center;

                    gap: 13px;

                    margin-bottom: 8px;
                }

                .title-icon {
                    width: 48px;

                    height: 48px;

                    flex-shrink: 0;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    border-radius: 14px;

                    background:
                        linear-gradient(
                            135deg,
                            #2563eb,
                            #4f46e5
                        );

                    color: #ffffff;

                    box-shadow:
                        0 9px 22px
                            rgba(
                                37,
                                99,
                                235,
                                0.20
                            );
                }

                .page-title {
                    margin: 0;

                    color:
                        var(
                            --attendance-text
                        ) !important;

                    font-size: 30px;

                    line-height: 1.15;

                    font-weight: 850;

                    letter-spacing: -0.8px;
                }

                .page-subtitle {
                    margin: 0;

                    color:
                        var(
                            --attendance-text-muted
                        ) !important;

                    font-size: 15px;

                    line-height: 1.6;

                    font-weight: 500;
                }

                .date-summary {
                    min-height: 45px;

                    display: inline-flex;

                    align-items: center;

                    gap: 9px;

                    padding: 0 15px;

                    border: 1px solid
                        var(
                            --attendance-border
                        );

                    border-radius: 12px;

                    background:
                        var(
                            --attendance-surface
                        );

                    color:
                        var(
                            --attendance-text-secondary
                        );

                    font-size: 14px;

                    font-weight: 750;

                    white-space: nowrap;

                    box-shadow:
                        0 4px 16px
                            rgba(
                                15,
                                23,
                                42,
                                0.05
                            );
                }

                .date-summary svg {
                    color:
                        var(
                            --attendance-primary
                        );
                }

                /* =================================================
                   KPI GRID
                ================================================= */

                .stats-grid {
                    display: grid;

                    grid-template-columns:
                        repeat(
                            5,
                            minmax(0, 1fr)
                        );

                    gap: 15px;

                    margin-bottom: 22px;
                }

                .stat-card {
                    position: relative;

                    min-height: 138px;

                    padding: 20px;

                    overflow: hidden;

                    border: 1px solid
                        var(
                            --attendance-border
                        );

                    border-radius: 17px;

                    background:
                        var(
                            --attendance-surface
                        );

                    box-shadow:
                        0 5px 20px
                            rgba(
                                15,
                                23,
                                42,
                                0.055
                            );

                    transition:
                        transform 0.2s ease,
                        box-shadow 0.2s ease,
                        border-color 0.2s ease;
                }

                .stat-card:hover {
                    transform:
                        translateY(-2px);

                    border-color:
                        var(
                            --attendance-primary-border
                        );

                    box-shadow:
                        0 11px 28px
                            rgba(
                                15,
                                23,
                                42,
                                0.085
                            );
                }

                :global(.dark)
                    .stat-card {
                    box-shadow:
                        0 9px 30px
                            rgba(
                                0,
                                0,
                                0,
                                0.18
                            );
                }

                .stat-top {
                    display: flex;

                    align-items: center;

                    justify-content:
                        space-between;

                    gap: 10px;

                    margin-bottom: 17px;
                }

                .stat-label {
                    color:
                        var(
                            --attendance-text-muted
                        );

                    font-size: 14px;

                    font-weight: 750;
                }

                .stat-icon {
                    width: 41px;

                    height: 41px;

                    flex-shrink: 0;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    border-radius: 12px;
                }

                .stat-icon-blue {
                    background: #eff6ff;

                    color: #2563eb;

                    border: 1px solid
                        #dbeafe;
                }

                .stat-icon-green {
                    background: #ecfdf5;

                    color: #16a34a;

                    border: 1px solid
                        #d1fae5;
                }

                .stat-icon-red {
                    background: #fef2f2;

                    color: #dc2626;

                    border: 1px solid
                        #fee2e2;
                }

                .stat-icon-amber {
                    background: #fff7ed;

                    color: #d97706;

                    border: 1px solid
                        #ffedd5;
                }

                :global(.dark)
                    .stat-icon-blue {
                    background:
                        rgba(
                            59,
                            130,
                            246,
                            0.12
                        );

                    color: #60a5fa;

                    border-color:
                        rgba(
                            96,
                            165,
                            250,
                            0.13
                        );
                }

                :global(.dark)
                    .stat-icon-green {
                    background:
                        rgba(
                            34,
                            197,
                            94,
                            0.12
                        );

                    color: #4ade80;

                    border-color:
                        rgba(
                            74,
                            222,
                            128,
                            0.13
                        );
                }

                :global(.dark)
                    .stat-icon-red {
                    background:
                        rgba(
                            239,
                            68,
                            68,
                            0.12
                        );

                    color: #f87171;

                    border-color:
                        rgba(
                            248,
                            113,
                            113,
                            0.13
                        );
                }

                :global(.dark)
                    .stat-icon-amber {
                    background:
                        rgba(
                            245,
                            158,
                            11,
                            0.12
                        );

                    color: #fbbf24;

                    border-color:
                        rgba(
                            251,
                            191,
                            36,
                            0.13
                        );
                }

                .stat-value {
                    color:
                        var(
                            --attendance-text
                        ) !important;

                    font-size: 30px;

                    line-height: 1;

                    font-weight: 850;

                    letter-spacing: -0.7px;
                }

                .stat-note {
                    margin-top: 9px;

                    color:
                        var(
                            --attendance-text-faint
                        );

                    font-size: 12px;

                    font-weight: 600;
                }

                /* =================================================
                   FILTER CARD
                ================================================= */

                .filter-card {
                    padding: 20px;

                    margin-bottom: 20px;

                    border: 1px solid
                        var(
                            --attendance-border
                        );

                    border-radius: 17px;

                    background:
                        var(
                            --attendance-surface
                        );

                    box-shadow:
                        0 5px 20px
                            rgba(
                                15,
                                23,
                                42,
                                0.045
                            );
                }

                .filter-header {
                    display: flex;

                    align-items: center;

                    justify-content:
                        space-between;

                    gap: 15px;

                    margin-bottom: 17px;
                }

                .filter-title {
                    display: flex;

                    align-items: center;

                    gap: 9px;

                    margin: 0;

                    color:
                        var(
                            --attendance-text
                        ) !important;

                    font-size: 17px;

                    font-weight: 800;
                }

                .filter-title svg {
                    color:
                        var(
                            --attendance-primary
                        );
                }

                .filter-subtitle {
                    margin: 4px 0 0 27px;

                    color:
                        var(
                            --attendance-text-muted
                        );

                    font-size: 13px;

                    font-weight: 500;
                }

                .filters-grid {
                    display: grid;

                    grid-template-columns:
                        minmax(250px, 1.8fr)
                        minmax(160px, 1fr)
                        minmax(160px, 1fr)
                        minmax(150px, 0.9fr)
                        auto;

                    gap: 12px;

                    align-items: end;
                }

                .field-group {
                    min-width: 0;
                }

                .field-label {
                    display: block;

                    margin-bottom: 7px;

                    color:
                        var(
                            --attendance-text-secondary
                        );

                    font-size: 12px;

                    font-weight: 850;

                    text-transform: uppercase;

                    letter-spacing: 0.45px;
                }

                .field-wrapper {
                    position: relative;
                }

                .field-icon {
                    position: absolute;

                    left: 14px;

                    top: 50%;

                    transform:
                        translateY(-50%);

                    pointer-events: none;

                    color:
                        var(
                            --attendance-text-muted
                        );
                }

                .field-input,
                .field-select {
                    width: 100%;

                    height: 48px;

                    padding: 0 14px;

                    border: 1px solid
                        var(
                            --attendance-border
                        );

                    border-radius: 11px;

                    background:
                        var(
                            --attendance-surface-soft
                        );

                    color:
                        var(
                            --attendance-text
                        ) !important;

                    font-family: inherit;

                    font-size: 14px;

                    font-weight: 650;

                    outline: none;

                    transition:
                        border-color 0.2s ease,
                        background 0.2s ease,
                        box-shadow 0.2s ease;
                }

                .field-input.search-input {
                    padding-left: 43px;
                }

                .field-input:hover,
                .field-select:hover {
                    border-color: #cbd5e1;

                    background: #ffffff;
                }

                :global(.dark)
                    .field-input:hover,
                :global(.dark)
                    .field-select:hover {
                    border-color: #334155;

                    background: #111a2b;
                }

                .field-input:focus,
                .field-select:focus {
                    border-color: #60a5fa;

                    box-shadow:
                        0 0 0 3px
                            rgba(
                                59,
                                130,
                                246,
                                0.12
                            );
                }

                .field-input::placeholder {
                    color:
                        var(
                            --attendance-text-faint
                        ) !important;

                    opacity: 1;
                }

                .field-input[type='date'] {
                    color-scheme: light;
                }

                :global(.dark)
                    .field-input[type='date'] {
                    color-scheme: dark;
                }

                .field-select {
                    cursor: pointer;
                }

                .field-select option {
                    background: #ffffff;

                    color: #172033;
                }

                :global(.dark)
                    .field-select option {
                    background: #0d1422;

                    color: #f8fafc;
                }

                /* =================================================
                   EXPORT BUTTON
                ================================================= */

                .export-button {
                    width: 100%;

                    height: 48px;

                    min-width: 135px;

                    padding: 0 18px;

                    display: inline-flex;

                    align-items: center;

                    justify-content: center;

                    gap: 8px;

                    border: none;

                    border-radius: 11px;

                    background:
                        linear-gradient(
                            135deg,
                            #2563eb,
                            #4f46e5
                        );

                    color: #ffffff !important;

                    font-family: inherit;

                    font-size: 14px;

                    font-weight: 800;

                    cursor: pointer;

                    box-shadow:
                        0 7px 17px
                            rgba(
                                37,
                                99,
                                235,
                                0.18
                            );

                    transition:
                        transform 0.2s ease,
                        box-shadow 0.2s ease,
                        opacity 0.2s ease;
                }

                .export-button:hover:not(
                    :disabled
                ) {
                    transform:
                        translateY(-1px);

                    box-shadow:
                        0 10px 23px
                            rgba(
                                37,
                                99,
                                235,
                                0.25
                            );
                }

                .export-button:disabled {
                    opacity: 0.55;

                    cursor: not-allowed;
                }

                /* =================================================
                   RESET
                ================================================= */

                .reset-button {
                    display: inline-flex;

                    align-items: center;

                    gap: 7px;

                    padding: 8px 12px;

                    border: 1px solid
                        var(
                            --attendance-border
                        );

                    border-radius: 9px;

                    background:
                        var(
                            --attendance-surface-soft
                        );

                    color:
                        var(
                            --attendance-text-muted
                        );

                    font-family: inherit;

                    font-size: 13px;

                    font-weight: 700;

                    cursor: pointer;

                    transition:
                        background 0.18s ease,
                        border-color 0.18s ease,
                        color 0.18s ease;
                }

                .reset-button:hover {
                    background:
                        var(
                            --attendance-primary-soft
                        );

                    border-color:
                        var(
                            --attendance-primary-border
                        );

                    color:
                        var(
                            --attendance-primary
                        );
                }

                /* =================================================
                   TABLE CARD
                ================================================= */

                .table-card {
                    overflow: hidden;

                    border: 1px solid
                        var(
                            --attendance-border
                        );

                    border-radius: 17px;

                    background:
                        var(
                            --attendance-surface
                        );

                    box-shadow:
                        0 5px 22px
                            rgba(
                                15,
                                23,
                                42,
                                0.055
                            );
                }

                :global(.dark)
                    .table-card {
                    box-shadow:
                        0 9px 30px
                            rgba(
                                0,
                                0,
                                0,
                                0.18
                            );
                }

                .table-topbar {
                    min-height: 69px;

                    padding: 15px 22px;

                    display: flex;

                    align-items: center;

                    justify-content:
                        space-between;

                    gap: 15px;

                    border-bottom: 1px solid
                        var(
                            --attendance-border
                        );

                    background:
                        var(
                            --attendance-surface
                        );
                }

                .table-heading {
                    display: flex;

                    align-items: center;

                    gap: 11px;
                }

                .table-heading-icon {
                    width: 37px;

                    height: 37px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    border-radius: 10px;

                    background: #eff6ff;

                    border: 1px solid
                        #dbeafe;

                    color: #2563eb;
                }

                :global(.dark)
                    .table-heading-icon {
                    background:
                        rgba(
                            59,
                            130,
                            246,
                            0.11
                        );

                    border-color:
                        rgba(
                            96,
                            165,
                            250,
                            0.13
                        );

                    color: #60a5fa;
                }

                .table-title {
                    margin: 0;

                    color:
                        var(
                            --attendance-text
                        ) !important;

                    font-size: 17px;

                    font-weight: 800;
                }

                .record-count {
                    display: inline-flex;

                    align-items: center;

                    justify-content: center;

                    min-width: 30px;

                    height: 26px;

                    padding: 0 9px;

                    margin-left: 8px;

                    border-radius: 20px;

                    background: #eff6ff;

                    border: 1px solid
                        #dbeafe;

                    color: #2563eb;

                    font-size: 12px;

                    font-weight: 850;
                }

                :global(.dark)
                    .record-count {
                    background:
                        rgba(
                            59,
                            130,
                            246,
                            0.11
                        );

                    border-color:
                        rgba(
                            96,
                            165,
                            250,
                            0.16
                        );

                    color: #93c5fd;
                }

                .table-date {
                    display: flex;

                    align-items: center;

                    gap: 8px;

                    color:
                        var(
                            --attendance-text-muted
                        );

                    font-size: 13px;

                    font-weight: 700;
                }

                .table-date svg {
                    color:
                        var(
                            --attendance-primary
                        );
                }

                /* =================================================
                   TABLE
                ================================================= */

                .table-scroll {
                    width: 100%;

                    overflow-x: auto;
                }

                .table-inner {
                    min-width: 1040px;
                }

                .table-header,
                .table-row {
                    display: grid;

                    grid-template-columns:
                        1.75fr
                        1.2fr
                        1fr
                        0.9fr
                        0.9fr
                        1.05fr
                        0.8fr;

                    align-items: center;
                }

                .table-header {
                    min-height: 53px;

                    padding: 0 24px;

                    background:
                        var(
                            --attendance-surface-soft
                        );

                    border-bottom: 1px solid
                        var(
                            --attendance-border
                        );
                }

                .header-cell {
                    color:
                        var(
                            --attendance-text-muted
                        );

                    font-size: 11px;

                    font-weight: 850;

                    text-transform: uppercase;

                    letter-spacing: 0.7px;
                }

                .table-row {
                    min-height: 81px;

                    padding: 0 24px;

                    background:
                        var(
                            --attendance-surface
                        );

                    border-bottom: 1px solid
                        var(
                            --attendance-border-soft
                        );

                    transition:
                        background 0.18s ease;
                }

                .table-row:last-child {
                    border-bottom: none;
                }

                .table-row:hover {
                    background:
                        var(
                            --attendance-surface-hover
                        );
                }

                /* =================================================
                   EMPLOYEE CELL
                ================================================= */

                .employee-cell {
                    display: flex;

                    align-items: center;

                    gap: 12px;

                    min-width: 0;
                }

                .employee-avatar {
                    width: 43px;

                    height: 43px;

                    flex-shrink: 0;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    border-radius: 12px;

                    background:
                        linear-gradient(
                            135deg,
                            #dbeafe,
                            #e0e7ff
                        );

                    border: 1px solid
                        #bfdbfe;

                    color: #1d4ed8;

                    font-size: 14px;

                    font-weight: 850;
                }

                :global(.dark)
                    .employee-avatar {
                    background:
                        linear-gradient(
                            135deg,
                            rgba(
                                37,
                                99,
                                235,
                                0.18
                            ),
                            rgba(
                                79,
                                70,
                                229,
                                0.18
                            )
                        );

                    border-color:
                        rgba(
                            96,
                            165,
                            250,
                            0.16
                        );

                    color: #93c5fd;
                }

                .employee-info {
                    min-width: 0;
                }

                .employee-name {
                    overflow: hidden;

                    text-overflow: ellipsis;

                    white-space: nowrap;

                    color:
                        var(
                            --attendance-text
                        ) !important;

                    font-size: 15px;

                    line-height: 1.35;

                    font-weight: 800;
                }

                .employee-code {
                    margin-top: 4px;

                    overflow: hidden;

                    text-overflow: ellipsis;

                    white-space: nowrap;

                    color:
                        var(
                            --attendance-text-faint
                        );

                    font-size: 12px;

                    font-weight: 600;
                }

                /* =================================================
                   TABLE DATA
                ================================================= */

                .department-cell,
                .time-cell,
                .break-cell {
                    color:
                        var(
                            --attendance-text-secondary
                        );

                    font-size: 14px;

                    line-height: 1.4;

                    font-weight: 600;
                }

                .department-cell {
                    overflow: hidden;

                    text-overflow: ellipsis;

                    white-space: nowrap;
                }

                .time-cell {
                    display: flex;

                    align-items: center;

                    gap: 7px;
                }

                .time-icon {
                    flex-shrink: 0;

                    color:
                        var(
                            --attendance-text-faint
                        );
                }

                .break-cell {
                    overflow: hidden;

                    text-overflow: ellipsis;

                    white-space: nowrap;
                }

                .break-cell.active {
                    width: fit-content;

                    padding: 6px 9px;

                    border-radius: 8px;

                    background: #fff7ed;

                    border: 1px solid
                        #fed7aa;

                    color: #d97706;

                    font-weight: 800;
                }

                :global(.dark)
                    .break-cell.active {
                    background:
                        rgba(
                            245,
                            158,
                            11,
                            0.10
                        );

                    border-color:
                        rgba(
                            245,
                            158,
                            11,
                            0.18
                        );

                    color: #fbbf24;
                }

                /* =================================================
                   STATUS BADGE
                ================================================= */

                .status-badge {
                    display: inline-flex;

                    align-items: center;

                    justify-content: center;

                    gap: 7px;

                    min-height: 31px;

                    padding: 5px 11px;

                    border: 1px solid;

                    border-radius: 20px;

                    font-size: 11px;

                    line-height: 1;

                    font-weight: 850;

                    white-space: nowrap;

                    text-transform: uppercase;

                    letter-spacing: 0.35px;
                }

                .status-dot {
                    width: 7px;

                    height: 7px;

                    flex-shrink: 0;

                    border-radius: 50%;

                    background: currentColor;
                }

                /* =================================================
                   DARK STATUS BADGES
                ================================================= */

                :global(.dark)
                    .status-badge[
                        style*="rgb(22, 163, 74)"
                    ] {
                    background:
                        rgba(
                            34,
                            197,
                            94,
                            0.12
                        ) !important;

                    color: #4ade80 !important;

                    border-color:
                        rgba(
                            34,
                            197,
                            94,
                            0.24
                        ) !important;
                }

                /* =================================================
                   VIEW BUTTON
                ================================================= */

                .view-button {
                    display: inline-flex;

                    align-items: center;

                    justify-content: center;

                    gap: 6px;

                    min-height: 38px;

                    padding: 0 13px;

                    border: 1px solid
                        #bfdbfe;

                    border-radius: 10px;

                    background: #eff6ff;

                    color: #2563eb;

                    font-family: inherit;

                    font-size: 13px;

                    font-weight: 800;

                    cursor: pointer;

                    transition:
                        background 0.18s ease,
                        border-color 0.18s ease,
                        color 0.18s ease,
                        transform 0.18s ease;
                }

                .view-button:hover {
                    transform:
                        translateY(-1px);

                    background: #dbeafe;

                    border-color: #93c5fd;

                    color: #1d4ed8;
                }

                :global(.dark)
                    .view-button {
                    background:
                        rgba(
                            59,
                            130,
                            246,
                            0.09
                        );

                    border-color:
                        rgba(
                            96,
                            165,
                            250,
                            0.18
                        );

                    color: #93c5fd;
                }

                :global(.dark)
                    .view-button:hover {
                    background:
                        rgba(
                            59,
                            130,
                            246,
                            0.16
                        );

                    border-color:
                        rgba(
                            96,
                            165,
                            250,
                            0.32
                        );

                    color: #bfdbfe;
                }

                /* =================================================
                   LOADING
                ================================================= */

                .loading-state,
                .empty-state {
                    min-height: 310px;

                    display: flex;

                    flex-direction: column;

                    align-items: center;

                    justify-content: center;

                    padding: 50px;

                    text-align: center;

                    background:
                        var(
                            --attendance-surface
                        );
                }

                .loading-spinner {
                    color:
                        var(
                            --attendance-primary
                        );

                    animation:
                        attendance-spin
                        0.9s linear infinite;
                }

                .loading-state
                    .loading-spinner {
                    margin-bottom: 13px;
                }

                .loading-text {
                    color:
                        var(
                            --attendance-text-muted
                        );

                    font-size: 14px;

                    font-weight: 700;
                }

                /* =================================================
                   EMPTY STATE
                ================================================= */

                .empty-icon {
                    width: 54px;

                    height: 54px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    margin-bottom: 14px;

                    border: 1px solid
                        var(
                            --attendance-border
                        );

                    border-radius: 15px;

                    background:
                        var(
                            --attendance-surface-soft
                        );

                    color:
                        var(
                            --attendance-text-muted
                        );
                }

                .empty-title {
                    margin: 0 0 6px;

                    color:
                        var(
                            --attendance-text
                        );

                    font-size: 17px;

                    font-weight: 800;
                }

                .empty-description {
                    margin: 0;

                    color:
                        var(
                            --attendance-text-muted
                        );

                    font-size: 13px;

                    font-weight: 500;
                }

                /* =================================================
                   PAGINATION
                ================================================= */

                .pagination {
                    min-height: 70px;

                    padding: 13px 21px;

                    display: flex;

                    align-items: center;

                    justify-content:
                        space-between;

                    gap: 15px;

                    border-top: 1px solid
                        var(
                            --attendance-border
                        );

                    background:
                        var(
                            --attendance-surface
                        );
                }

                .pagination-info {
                    color:
                        var(
                            --attendance-text-muted
                        );

                    font-size: 13px;

                    font-weight: 700;
                }

                .pagination-controls {
                    display: flex;

                    align-items: center;

                    gap: 8px;
                }

                .page-button {
                    min-width: 40px;

                    height: 40px;

                    padding: 0 12px;

                    display: inline-flex;

                    align-items: center;

                    justify-content: center;

                    gap: 6px;

                    border: 1px solid
                        var(
                            --attendance-border
                        );

                    border-radius: 9px;

                    background:
                        var(
                            --attendance-surface-soft
                        );

                    color:
                        var(
                            --attendance-text-secondary
                        );

                    font-family: inherit;

                    font-size: 13px;

                    font-weight: 800;

                    cursor: pointer;

                    transition:
                        background 0.18s ease,
                        border-color 0.18s ease,
                        color 0.18s ease;
                }

                .page-button:hover:not(
                    :disabled
                ) {
                    background:
                        var(
                            --attendance-primary-soft
                        );

                    border-color:
                        var(
                            --attendance-primary-border
                        );

                    color:
                        var(
                            --attendance-primary
                        );
                }

                .page-button:disabled {
                    opacity: 0.4;

                    cursor: not-allowed;
                }

                .page-number {
                    min-width: 40px;

                    height: 40px;

                    display: inline-flex;

                    align-items: center;

                    justify-content: center;

                    border-radius: 9px;

                    background: #eff6ff;

                    border: 1px solid
                        #dbeafe;

                    color: #2563eb;

                    font-size: 13px;

                    font-weight: 850;
                }

                :global(.dark)
                    .page-number {
                    background:
                        rgba(
                            59,
                            130,
                            246,
                            0.11
                        );

                    border-color:
                        rgba(
                            96,
                            165,
                            250,
                            0.18
                        );

                    color: #93c5fd;
                }

                /* =================================================
                   SCROLLBAR
                ================================================= */

                .attendance-page
                    ::-webkit-scrollbar {
                    width: 7px;

                    height: 7px;
                }

                .attendance-page
                    ::-webkit-scrollbar-track {
                    background: transparent;
                }

                .attendance-page
                    ::-webkit-scrollbar-thumb {
                    background: #cbd5e1;

                    border-radius: 20px;
                }

                :global(.dark)
                    .attendance-page
                    ::-webkit-scrollbar-thumb {
                    background: #26344a;
                }

                /* =================================================
                   RESPONSIVE
                ================================================= */

                @media (max-width: 1250px) {
                    .stats-grid {
                        grid-template-columns:
                            repeat(
                                3,
                                minmax(0, 1fr)
                            );
                    }

                    .filters-grid {
                        grid-template-columns:
                            repeat(
                                2,
                                minmax(0, 1fr)
                            );
                    }
                }

                @media (max-width: 800px) {
                    .page-header {
                        flex-direction: column;
                    }

                    .date-summary {
                        width: 100%;

                        justify-content: center;
                    }

                    .page-title {
                        font-size: 27px;
                    }

                    .stats-grid {
                        grid-template-columns:
                            repeat(
                                2,
                                minmax(0, 1fr)
                            );
                    }

                    .filters-grid {
                        grid-template-columns: 1fr;
                    }

                    .filter-header {
                        align-items:
                            flex-start;
                    }

                    .table-topbar {
                        align-items:
                            flex-start;

                        flex-direction: column;
                    }

                    .pagination {
                        flex-direction: column;

                        align-items:
                            stretch;
                    }

                    .pagination-controls {
                        justify-content: center;
                    }
                }

                @media (max-width: 520px) {
                    .stats-grid {
                        grid-template-columns: 1fr;
                    }

                    .title-icon {
                        width: 43px;

                        height: 43px;

                        border-radius: 13px;
                    }

                    .page-title {
                        font-size: 24px;
                    }

                    .filter-card {
                        padding: 16px;
                    }

                    .table-topbar {
                        padding: 14px 16px;
                    }
                }

                @keyframes attendance-spin {
                    from {
                        transform:
                            rotate(0deg);
                    }

                    to {
                        transform:
                            rotate(360deg);
                    }
                }

                /* =================================================
                   INPUT PLACEHOLDER
                ================================================= */

                .attendance-page
                    input::placeholder {
                    color:
                        var(
                            --attendance-text-faint
                        ) !important;

                    opacity: 1 !important;
                }

            `}</style>

            {/* =====================================================
                HEADER
            ===================================================== */}

            <div className="page-header">
                <div className="header-left">
                    <div className="title-row">
                        <div className="title-icon">
                            <Clock3 size={23} />
                        </div>

                        <h1 className="page-title">
                            Attendance Report
                        </h1>
                    </div>

                    <p className="page-subtitle">
                        Monitor employee attendance,
                        working hours and daily
                        attendance status.
                    </p>
                </div>

                <div className="date-summary">
                    <CalendarDays size={17} />

                    <span>
                        {fromDate === toDate
                            ? formatDisplayDate(
                                toDate
                            )
                            : `${formatDisplayDate(
                                fromDate
                            )} → ${formatDisplayDate(
                                toDate
                            )}`}
                    </span>
                </div>
            </div>

            {/* =====================================================
                KPI CARDS
            ===================================================== */}

            <div className="stats-grid">

                {/* TOTAL */}

                <div className="stat-card">
                    <div className="stat-top">
                        <span className="stat-label">
                            Total Employees
                        </span>

                        <div className="stat-icon stat-icon-blue">
                            <Users size={20} />
                        </div>
                    </div>

                    <div className="stat-value">
                        {summary.total}
                    </div>

                    <div className="stat-note">
                        Employees on this page
                    </div>
                </div>

                {/* PRESENT */}

                <div className="stat-card">
                    <div className="stat-top">
                        <span className="stat-label">
                            Present
                        </span>

                        <div className="stat-icon stat-icon-green">
                            <CheckCircle2
                                size={20}
                            />
                        </div>
                    </div>

                    <div className="stat-value">
                        {summary.present}
                    </div>

                    <div className="stat-note">
                        Checked in today
                    </div>
                </div>

                {/* ABSENT */}

                <div className="stat-card">
                    <div className="stat-top">
                        <span className="stat-label">
                            Absent
                        </span>

                        <div className="stat-icon stat-icon-red">
                            <XCircle size={20} />
                        </div>
                    </div>

                    <div className="stat-value">
                        {summary.absent}
                    </div>

                    <div className="stat-note">
                        No attendance recorded
                    </div>
                </div>

                {/* LEAVE */}

                <div className="stat-card">
                    <div className="stat-top">
                        <span className="stat-label">
                            On Leave
                        </span>

                        <div className="stat-icon stat-icon-blue">
                            <CalendarDays
                                size={20}
                            />
                        </div>
                    </div>

                    <div className="stat-value">
                        {summary.leave}
                    </div>

                    <div className="stat-note">
                        Approved leave
                    </div>
                </div>

                {/* BREAK */}

                <div className="stat-card">
                    <div className="stat-top">
                        <span className="stat-label">
                            On Break
                        </span>

                        <div className="stat-icon stat-icon-amber">
                            <Coffee size={20} />
                        </div>
                    </div>

                    <div className="stat-value">
                        {summary.onBreak}
                    </div>

                    <div className="stat-note">
                        Currently on break
                    </div>
                </div>
            </div>

            {/* =====================================================
                FILTERS
            ===================================================== */}

            <div className="filter-card">
                <div className="filter-header">
                    <div>
                        <h2 className="filter-title">
                            <SlidersHorizontal
                                size={18}
                            />

                            Attendance Filters
                        </h2>

                        <p className="filter-subtitle">
                            Search and filter
                            attendance records.
                        </p>
                    </div>

                    {hasFilters && (
                        <button
                            type="button"
                            className="reset-button"
                            onClick={
                                clearFilters
                            }
                        >
                            <RefreshCw
                                size={14}
                            />

                            Reset filters
                        </button>
                    )}
                </div>

                <div className="filters-grid">

                    {/* SEARCH */}

                    <div className="field-group">
                        <label className="field-label">
                            Search employee
                        </label>

                        <div className="field-wrapper">
                            <Search
                                size={18}
                                className="field-icon"
                            />

                            <input
                                type="text"
                                className="field-input search-input"
                                placeholder="Search by name, employee code or ID..."
                                value={search}
                                onChange={(event) => {
                                    setSearch(
                                        event.target
                                            .value
                                    );

                                    setPage(0);
                                }}
                            />
                        </div>
                    </div>

                    {/* FROM DATE */}

                    <div className="field-group">
                        <label className="field-label">
                            From date
                        </label>

                        <input
                            type="date"
                            className="field-input"
                            value={fromDate}
                            max={maxDate}
                            onChange={
                                handleFromDateChange
                            }
                        />
                    </div>

                    {/* TO DATE */}

                    <div className="field-group">
                        <label className="field-label">
                            To date
                        </label>

                        <input
                            type="date"
                            className="field-input"
                            value={toDate}
                            max={maxDate}
                            onChange={
                                handleToDateChange
                            }
                        />
                    </div>

                    {/* STATUS */}

                    <div className="field-group">
                        <label className="field-label">
                            Status
                        </label>

                        <select
                            className="field-select"
                            value={
                                statusFilter
                            }
                            onChange={(event) => {
                                setStatusFilter(
                                    event.target
                                        .value
                                );

                                setPage(0);
                            }}
                        >
                            <option value="ALL">
                                All Status
                            </option>

                            <option value="PRESENT">
                                Present
                            </option>

                            <option value="HALF_DAY">
                                Half Day
                            </option>

                            <option value="ON_LEAVE">
                                On Leave
                            </option>

                            <option value="ABSENT">
                                Absent
                            </option>
                        </select>
                    </div>

                    {/* EXPORT */}

                    <div className="field-group">
                        <label className="field-label">
                            &nbsp;
                        </label>

                        <button
                            type="button"
                            className="export-button"
                            onClick={
                                handleExport
                            }
                            disabled={exporting}
                        >
                            {exporting ? (
                                <>
                                    <Loader2
                                        size={18}
                                        className="loading-spinner"
                                        style={{
                                            margin: 0,
                                        }}
                                    />

                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download
                                        size={18}
                                    />

                                    Export Excel
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* =====================================================
                ATTENDANCE TABLE
            ===================================================== */}

            <div className="table-card">

                {/* TABLE TOP BAR */}

                <div className="table-topbar">
                    <div className="table-heading">
                        <div className="table-heading-icon">
                            <Building2
                                size={18}
                            />
                        </div>

                        <h2 className="table-title">
                            Employee Attendance

                            <span className="record-count">
                                {
                                    filteredRows.length
                                }
                            </span>
                        </h2>
                    </div>

                    <div className="table-date">
                        <CalendarDays
                            size={16}
                        />

                        {formatDisplayDate(
                            toDate
                        )}
                    </div>
                </div>

                {/* TABLE */}

                <div className="table-scroll">
                    <div className="table-inner">

                        {/* HEADER */}

                        <div className="table-header">
                            <div className="header-cell">
                                Employee
                            </div>

                            <div className="header-cell">
                                Department
                            </div>

                            <div className="header-cell">
                                Status
                            </div>

                            <div className="header-cell">
                                Check In
                            </div>

                            <div className="header-cell">
                                Check Out
                            </div>

                            <div className="header-cell">
                                Break
                            </div>

                            <div className="header-cell">
                                Action
                            </div>
                        </div>

                        {/* LOADING */}

                        {loading ? (
                            <div className="loading-state">
                                <Loader2
                                    size={31}
                                    className="loading-spinner"
                                />

                                <div className="loading-text">
                                    Loading attendance
                                    records...
                                </div>
                            </div>
                        ) : filteredRows.length ===
                            0 ? (
                            /* EMPTY */

                            <div className="empty-state">
                                <div className="empty-icon">
                                    <Search
                                        size={25}
                                    />
                                </div>

                                <h3 className="empty-title">
                                    No attendance
                                    records found
                                </h3>

                                <p className="empty-description">
                                    Try changing your
                                    search, date or
                                    status filters.
                                </p>
                            </div>
                        ) : (
                            /* ROWS */

                            filteredRows.map(
                                (row) => {
                                    const initials =
                                        getEmployeeInitials(
                                            row?.employeeName
                                        );

                                    return (
                                        <div
                                            key={`${row?.employeeId}-${row?.employeeCode || ''}`}
                                            className="table-row"
                                        >

                                            {/* EMPLOYEE */}

                                            <div className="employee-cell">
                                                <div className="employee-avatar">
                                                    {
                                                        initials
                                                    }
                                                </div>

                                                <div className="employee-info">
                                                    <div className="employee-name">
                                                        {
                                                            row?.employeeName
                                                        }
                                                    </div>

                                                    <div className="employee-code">
                                                        {row?.employeeCode ||
                                                            `ID: ${row?.employeeId}`}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* DEPARTMENT */}

                                            <div className="department-cell">
                                                {row?.departmentName ||
                                                    '—'}
                                            </div>

                                            {/* STATUS */}

                                            <div>
                                                <StatusBadge
                                                    status={
                                                        row?.status
                                                    }
                                                />
                                            </div>

                                            {/* CHECK IN */}

                                            <div className="time-cell">
                                                <Clock3
                                                    size={
                                                        15
                                                    }
                                                    className="time-icon"
                                                />

                                                {row?.checkIn
                                                    ? String(
                                                        row.checkIn
                                                    ).slice(
                                                        0,
                                                        5
                                                    )
                                                    : '--'}
                                            </div>

                                            {/* CHECK OUT */}

                                            <div className="time-cell">
                                                <Clock3
                                                    size={
                                                        15
                                                    }
                                                    className="time-icon"
                                                />

                                                {row?.checkOut
                                                    ? String(
                                                        row.checkOut
                                                    ).slice(
                                                        0,
                                                        5
                                                    )
                                                    : '--'}
                                            </div>

                                            {/* BREAK */}

                                            <div
                                                className={`break-cell ${row?.onBreak
                                                        ? 'active'
                                                        : ''
                                                    }`}
                                            >
                                                {row?.onBreak
                                                    ? 'On break'
                                                    : formatBreakTimes(
                                                        row?.breaks
                                                    )}
                                            </div>

                                            {/* VIEW */}

                                            <div>
                                                <button
                                                    type="button"
                                                    className="view-button"
                                                    onClick={() =>
                                                        setSelectedEmployeeId(
                                                            row?.employeeId
                                                        )
                                                    }
                                                >
                                                    <Eye
                                                        size={
                                                            16
                                                        }
                                                    />

                                                    View
                                                </button>
                                            </div>
                                        </div>
                                    );
                                }
                            )
                        )}
                    </div>
                </div>

                {/* =================================================
                    PAGINATION
                ================================================= */}

                {totalPages > 1 && (
                    <div className="pagination">

                        <div className="pagination-info">
                            Showing page{' '}
                            {page + 1} of{' '}
                            {totalPages}
                        </div>

                        <div className="pagination-controls">

                            <button
                                type="button"
                                className="page-button"
                                disabled={
                                    page === 0
                                }
                                onClick={() =>
                                    setPage(
                                        (currentPage) =>
                                            Math.max(
                                                0,
                                                currentPage -
                                                1
                                            )
                                    )
                                }
                            >
                                <ChevronLeft
                                    size={17}
                                />

                                Prev
                            </button>

                            <span className="page-number">
                                {page + 1}
                            </span>

                            <button
                                type="button"
                                className="page-button"
                                disabled={
                                    page + 1 >=
                                    totalPages
                                }
                                onClick={() =>
                                    setPage(
                                        (currentPage) =>
                                            currentPage +
                                            1
                                    )
                                }
                            >
                                Next

                                <ChevronRight
                                    size={17}
                                />
                            </button>

                        </div>
                    </div>
                )}
            </div>

            {/* =====================================================
                EMPLOYEE ATTENDANCE MODAL
            ===================================================== */}

            {selectedEmployeeId && (
                <EmployeeAttendanceModal
                    employeeId={
                        selectedEmployeeId
                    }
                    asOfDate={toDate}
                    onClose={() =>
                        setSelectedEmployeeId(
                            null
                        )
                    }
                />
            )}
        </div>
    );
}