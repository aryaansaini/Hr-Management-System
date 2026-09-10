"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/axios";
import {
    Users,
    Search,
    RefreshCw,
    Mail,
    Phone,
    BriefcaseBusiness,
    FileText,
    Clock3,
    CheckCircle2,
    XCircle,
    ChevronDown,
    UserRound,
} from "lucide-react";

export default function MyReferrals() {
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // =========================
    // VIEW RESUME
    // =========================
    const handleViewResume = async (e, resumeUrl) => {
        e.preventDefault();

        try {
            const url = resumeUrl.startsWith("http")
                ? new URL(resumeUrl).pathname
                : resumeUrl;

            const res = await api.get(url, {
                responseType: "blob",
            });

            const contentType =
                res.headers["content-type"] ||
                "application/pdf";

            const blob = new Blob([res.data], {
                type: contentType,
            });

            const blobUrl =
                window.URL.createObjectURL(blob);

            window.open(blobUrl, "_blank");
        } catch (err) {
            console.error(err);
            alert("Failed to open resume");
        }
    };

    // =========================
    // GET MY REFERRALS
    // =========================
    const fetchMyReferrals = async () => {
        try {
            setLoading(true);

            const res = await api.get(
                "/api/recruitment/my-referrals"
            );

            setReferrals(
                res.data?.data?.content ||
                res.data?.data ||
                []
            );
        } catch (error) {
            console.error(
                "Error fetching referrals:",
                error
            );

            setReferrals([]);
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // LOAD REFERRALS
    // =========================
    useEffect(() => {
        fetchMyReferrals();
    }, []);

    // =========================
    // STATUS TEXT
    // =========================
    const getStatusText = (status) => {
        if (status === "APPLIED") {
            return "Pending";
        }

        if (status === "SHORTLISTED") {
            return "Approved";
        }

        if (status === "REJECTED") {
            return "Rejected";
        }

        return status || "Pending";
    };

    // =========================
    // STATUS STYLE
    // =========================
    const getStatusStyle = (status) => {
        if (status === "SHORTLISTED") {
            return {
                background: "#ecfdf5",
                color: "#047857",
                border: "#a7f3d0",
            };
        }

        if (status === "REJECTED") {
            return {
                background: "#fef2f2",
                color: "#b91c1c",
                border: "#fecaca",
            };
        }

        return {
            background: "#fffbeb",
            color: "#b45309",
            border: "#fde68a",
        };
    };

    // =========================
    // STATUS ICON
    // =========================
    const getStatusIcon = (status) => {
        if (status === "SHORTLISTED") {
            return <CheckCircle2 size={14} />;
        }

        if (status === "REJECTED") {
            return <XCircle size={14} />;
        }

        return <Clock3 size={14} />;
    };

    // =========================
    // FILTER REFERRALS
    // =========================
    const filteredReferrals = useMemo(() => {
        const value = search.trim().toLowerCase();

        return referrals.filter((referral) => {
            const candidateName = String(
                referral?.candidateName || ""
            ).toLowerCase();

            const candidateEmail = String(
                referral?.candidateEmail || ""
            ).toLowerCase();

            const candidatePhone = String(
                referral?.candidatePhone || ""
            ).toLowerCase();

            const jobTitle = String(
                referral?.jobTitle || ""
            ).toLowerCase();

            const matchesSearch =
                !value ||
                candidateName.includes(value) ||
                candidateEmail.includes(value) ||
                candidatePhone.includes(value) ||
                jobTitle.includes(value);

            const matchesStatus =
                statusFilter === "ALL" ||
                referral?.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [referrals, search, statusFilter]);

    // =========================
    // COUNTS
    // =========================
    const pendingCount = referrals.filter(
        (item) => item?.status === "APPLIED"
    ).length;

    const approvedCount = referrals.filter(
        (item) => item?.status === "SHORTLISTED"
    ).length;

    const rejectedCount = referrals.filter(
        (item) => item?.status === "REJECTED"
    ).length;

    // =========================
    // LOADING
    // =========================
    if (loading) {
        return (
            <>
                <style jsx global>{`
                    .referrals-page {
                        min-height: 100vh;
                        background: #f8fafc;
                    }

                    .dark .referrals-page {
                        background: #0b1220;
                    }

                    .loading-card {
                        background: #ffffff;
                        border: 1px solid #e2e8f0;
                    }

                    .dark .loading-card {
                        background: #111827;
                        border-color: #243047;
                    }
                `}</style>

                <div className="referrals-page min-h-screen p-6 md:p-8">
                    <div className="loading-card flex min-h-[300px] items-center justify-center rounded-2xl border">
                        <div className="text-center">
                            <RefreshCw
                                size={28}
                                className="mx-auto mb-3 animate-spin text-blue-600 dark:text-blue-400"
                            />

                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Loading referrals...
                            </p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <style jsx global>{`
                /* =====================================
                   PAGE
                ===================================== */

                .referrals-page {
                    min-height: 100vh;
                    background: #f8fafc;
                    color: #0f172a;
                }

                .dark .referrals-page {
                    background: #0b1220;
                    color: #f8fafc;
                }

                /* =====================================
                   HEADER
                ===================================== */

                .breadcrumb {
                    color: #64748b;
                }

                .dark .breadcrumb {
                    color: #64748b;
                }

                .page-title {
                    color: #0f172a;
                }

                .dark .page-title {
                    color: #f8fafc;
                }

                .page-description {
                    color: #64748b;
                }

                .dark .page-description {
                    color: #94a3b8;
                }

                /* =====================================
                   REFRESH BUTTON
                ===================================== */

                .refresh-button {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                }

                .dark .refresh-button {
                    background: #111827;
                    border-color: #243047;
                    color: #94a3b8;
                }

                .refresh-button:hover {
                    border-color: #2563eb;
                    color: #2563eb;
                }

                .dark .refresh-button:hover {
                    border-color: #3b82f6;
                    color: #60a5fa;
                }

                /* =====================================
                   SUMMARY CARDS
                ===================================== */

                .summary-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.035);
                }

                .dark .summary-card {
                    background: #111827;
                    border-color: #243047;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.18);
                }

                .summary-label {
                    color: #64748b;
                }

                .dark .summary-label {
                    color: #94a3b8;
                }

                .summary-value {
                    color: #0f172a;
                }

                .dark .summary-value {
                    color: #f8fafc;
                }

                /* =====================================
                   SEARCH AREA
                ===================================== */

                .filter-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                }

                .dark .filter-card {
                    background: #111827;
                    border-color: #243047;
                }

                .search-box {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                }

                .dark .search-box {
                    background: #0f172a;
                    border-color: #2b3850;
                }

                .search-input {
                    background: transparent;
                    color: #0f172a;
                    outline: none;
                }

                .dark .search-input {
                    color: #f8fafc;
                }

                .search-input::placeholder {
                    color: #94a3b8;
                }

                .filter-select {
                    background: #f8fafc;
                    color: #334155;
                    border: 1px solid #e2e8f0;
                    outline: none;
                }

                .dark .filter-select {
                    background: #0f172a;
                    color: #cbd5e1;
                    border-color: #2b3850;
                }

                /* =====================================
                   SECTION
                ===================================== */

                .section-title {
                    color: #0f172a;
                }

                .dark .section-title {
                    color: #f8fafc;
                }

                .section-description {
                    color: #64748b;
                }

                .dark .section-description {
                    color: #94a3b8;
                }

                /* =====================================
                   REFERRAL CARD
                ===================================== */

                .referral-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.035);
                    transition: all 0.2s ease;
                }

                .dark .referral-card {
                    background: #111827;
                    border-color: #243047;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                }

                .referral-card:hover {
                    border-color: rgba(37, 99, 235, 0.35);
                    transform: translateY(-1px);
                }

                .dark .referral-card:hover {
                    border-color: rgba(59, 130, 246, 0.45);
                }

                /* =====================================
                   CANDIDATE
                ===================================== */

                .candidate-name {
                    color: #0f172a;
                }

                .dark .candidate-name {
                    color: #f8fafc;
                }

                .job-name {
                    color: #64748b;
                }

                .dark .job-name {
                    color: #94a3b8;
                }

                /* =====================================
                   DETAILS
                ===================================== */

                .detail-label {
                    color: #64748b;
                }

                .dark .detail-label {
                    color: #94a3b8;
                }

                .detail-value {
                    color: #334155;
                }

                .dark .detail-value {
                    color: #cbd5e1;
                }

                .detail-icon {
                    color: #64748b;
                }

                .dark .detail-icon {
                    color: #94a3b8;
                }

                /* =====================================
                   DIVIDER
                ===================================== */

                .referral-divider {
                    border-color: #e2e8f0;
                }

                .dark .referral-divider {
                    border-color: #243047;
                }

                /* =====================================
                   RESUME
                ===================================== */

                .resume-button {
                    color: #2563eb;
                }

                .resume-button:hover {
                    color: #1d4ed8;
                }

                .dark .resume-button {
                    color: #60a5fa;
                }

                .dark .resume-button:hover {
                    color: #93c5fd;
                }

                /* =====================================
                   STATUS MESSAGE
                ===================================== */

                .pending-message {
                    color: #b45309;
                    background: #fffbeb;
                    border: 1px solid #fde68a;
                }

                .dark .pending-message {
                    color: #fbbf24;
                    background: rgba(245, 158, 11, 0.08);
                    border-color: rgba(245, 158, 11, 0.2);
                }

                .approved-message {
                    color: #047857;
                    background: #ecfdf5;
                    border: 1px solid #a7f3d0;
                }

                .dark .approved-message {
                    color: #34d399;
                    background: rgba(16, 185, 129, 0.08);
                    border-color: rgba(16, 185, 129, 0.2);
                }

                .rejected-message {
                    color: #b91c1c;
                    background: #fef2f2;
                    border: 1px solid #fecaca;
                }

                .dark .rejected-message {
                    color: #f87171;
                    background: rgba(239, 68, 68, 0.08);
                    border-color: rgba(239, 68, 68, 0.2);
                }

                /* =====================================
                   EMPTY STATE
                ===================================== */

                .empty-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                }

                .dark .empty-card {
                    background: #111827;
                    border-color: #243047;
                }

                .empty-icon {
                    background: #f1f5f9;
                    color: #64748b;
                }

                .dark .empty-icon {
                    background: #1e293b;
                    color: #94a3b8;
                }

                .empty-title {
                    color: #0f172a;
                }

                .dark .empty-title {
                    color: #f8fafc;
                }

                .empty-text {
                    color: #64748b;
                }

                .dark .empty-text {
                    color: #94a3b8;
                }

                @media (max-width: 640px) {
                    .referrals-page {
                        padding: 16px !important;
                    }
                }
            `}</style>

            <div className="referrals-page p-6 md:p-8">

                {/* =====================================
                    HEADER
                ===================================== */}

                <div className="mb-7">
                    <div className="breadcrumb mb-2 text-xs font-medium">
                        Employee Portal / My Referrals
                    </div>

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="page-title text-2xl font-bold tracking-tight md:text-3xl">
                                My Referrals
                            </h1>

                            <p className="page-description mt-1 text-sm">
                                Track candidates you have referred
                                and monitor their application status.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={fetchMyReferrals}
                            className="refresh-button flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition"
                            title="Refresh referrals"
                        >
                            <RefreshCw size={17} />
                        </button>
                    </div>
                </div>

                {/* =====================================
                    SUMMARY
                ===================================== */}

                <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    {/* Total */}
                    <div className="summary-card rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="summary-label text-xs font-medium">
                                    Total Referrals
                                </p>

                                <p className="summary-value mt-2 text-2xl font-bold">
                                    {referrals.length}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                <Users size={19} />
                            </div>
                        </div>
                    </div>

                    {/* Pending */}
                    <div className="summary-card rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="summary-label text-xs font-medium">
                                    Pending
                                </p>

                                <p className="summary-value mt-2 text-2xl font-bold">
                                    {pendingCount}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
                                <Clock3 size={19} />
                            </div>
                        </div>
                    </div>

                    {/* Approved */}
                    <div className="summary-card rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="summary-label text-xs font-medium">
                                    Approved
                                </p>

                                <p className="summary-value mt-2 text-2xl font-bold">
                                    {approvedCount}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                <CheckCircle2 size={19} />
                            </div>
                        </div>
                    </div>

                    {/* Rejected */}
                    <div className="summary-card rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="summary-label text-xs font-medium">
                                    Rejected
                                </p>

                                <p className="summary-value mt-2 text-2xl font-bold">
                                    {rejectedCount}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                                <XCircle size={19} />
                            </div>
                        </div>
                    </div>

                </div>

                {/* =====================================
                    SEARCH & FILTER
                ===================================== */}

                <div className="filter-card mb-7 rounded-xl p-4">
                    <div className="flex flex-col gap-3 md:flex-row">

                        <div className="search-box flex h-11 flex-1 items-center gap-3 rounded-lg px-3">
                            <Search
                                size={18}
                                className="shrink-0 text-slate-400 dark:text-slate-500"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) =>
                                    setSearch(e.target.value)
                                }
                                placeholder="Search candidate or job..."
                                className="search-input w-full text-sm"
                            />

                            {search && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSearch("")
                                    }
                                    className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                                >
                                    <XCircle size={17} />
                                </button>
                            )}
                        </div>

                        <div className="relative md:w-48">
                            <select
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(
                                        e.target.value
                                    )
                                }
                                className="filter-select h-11 w-full appearance-none rounded-lg px-3 pr-9 text-sm"
                            >
                                <option value="ALL">
                                    All Status
                                </option>

                                <option value="APPLIED">
                                    Pending
                                </option>

                                <option value="SHORTLISTED">
                                    Approved
                                </option>

                                <option value="REJECTED">
                                    Rejected
                                </option>
                            </select>

                            <ChevronDown
                                size={16}
                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </div>

                    </div>
                </div>

                {/* =====================================
                    SECTION HEADER
                ===================================== */}

                <div className="mb-4">
                    <h2 className="section-title text-lg font-bold">
                        Referral History
                    </h2>

                    <p className="section-description mt-1 text-xs">
                        Showing {filteredReferrals.length} of{" "}
                        {referrals.length} referral
                        {referrals.length !== 1
                            ? "s"
                            : ""}
                    </p>
                </div>

                {/* =====================================
                    REFERRALS
                ===================================== */}

                {filteredReferrals.length === 0 ? (
                    <div className="empty-card rounded-2xl p-10 text-center">

                        <div className="empty-icon mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                            <Users size={22} />
                        </div>

                        <h3 className="empty-title text-base font-bold">
                            {referrals.length === 0
                                ? "No referrals yet"
                                : "No referrals found"}
                        </h3>

                        <p className="empty-text mt-1 text-sm">
                            {referrals.length === 0
                                ? "Candidates you refer will appear here."
                                : "Try adjusting your search or status filter."}
                        </p>

                        {(search ||
                            statusFilter !== "ALL") && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearch("");
                                        setStatusFilter("ALL");
                                    }}
                                    className="mt-4 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    Clear Filters
                                </button>
                            )}
                    </div>
                ) : (
                    <div className="space-y-4">

                        {filteredReferrals.map(
                            (referral) => {
                                const statusStyle =
                                    getStatusStyle(
                                        referral.status
                                    );

                                return (
                                    <div
                                        key={referral.id}
                                        className="referral-card rounded-2xl p-5 md:p-6"
                                    >

                                        {/* =====================================
                                            TOP
                                        ===================================== */}

                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                                            <div className="flex min-w-0 items-start gap-3">

                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                                    <UserRound
                                                        size={20}
                                                    />
                                                </div>

                                                <div className="min-w-0">
                                                    <h3 className="candidate-name truncate text-lg font-bold">
                                                        {
                                                            referral.candidateName
                                                        }
                                                    </h3>

                                                    <p className="job-name mt-1 flex items-center gap-1.5 text-sm">
                                                        <BriefcaseBusiness
                                                            size={14}
                                                        />

                                                        <span>
                                                            {referral.jobTitle ||
                                                                "Job not specified"}
                                                        </span>
                                                    </p>
                                                </div>

                                            </div>

                                            <span
                                                className="inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold"
                                                style={{
                                                    background:
                                                        statusStyle.background,
                                                    color:
                                                        statusStyle.color,
                                                    borderColor:
                                                        statusStyle.border,
                                                }}
                                            >
                                                {getStatusIcon(
                                                    referral.status
                                                )}

                                                {getStatusText(
                                                    referral.status
                                                )}
                                            </span>

                                        </div>

                                        {/* =====================================
                                            DETAILS
                                        ===================================== */}

                                        <div className="mt-5 grid grid-cols-1 gap-4 border-t pt-5 sm:grid-cols-2 lg:grid-cols-3 referral-divider">

                                            {/* EMAIL */}

                                            <div className="flex items-start gap-3">
                                                <Mail
                                                    size={17}
                                                    className="detail-icon mt-0.5 shrink-0"
                                                />

                                                <div className="min-w-0">
                                                    <p className="detail-label text-[11px] font-medium">
                                                        Email
                                                    </p>

                                                    <p className="detail-value mt-1 truncate text-sm font-semibold">
                                                        {
                                                            referral.candidateEmail
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            {/* PHONE */}

                                            <div className="flex items-start gap-3">
                                                <Phone
                                                    size={17}
                                                    className="detail-icon mt-0.5 shrink-0"
                                                />

                                                <div className="min-w-0">
                                                    <p className="detail-label text-[11px] font-medium">
                                                        Phone
                                                    </p>

                                                    <p className="detail-value mt-1 text-sm font-semibold">
                                                        {
                                                            referral.candidatePhone
                                                        }
                                                    </p>
                                                </div>
                                            </div>

                                            {/* EXPERIENCE */}

                                            <div className="flex items-start gap-3">
                                                <BriefcaseBusiness
                                                    size={17}
                                                    className="detail-icon mt-0.5 shrink-0"
                                                />

                                                <div className="min-w-0">
                                                    <p className="detail-label text-[11px] font-medium">
                                                        Experience
                                                    </p>

                                                    <p className="detail-value mt-1 text-sm font-semibold">
                                                        {
                                                            referral.experienceYears ??
                                                            0
                                                        }{" "}
                                                        {(referral.experienceYears ??
                                                            0) ===
                                                            1
                                                            ? "year"
                                                            : "years"}{" "}
                                                        {
                                                            referral.experienceMonths ??
                                                            0
                                                        }{" "}
                                                        {(referral.experienceMonths ??
                                                            0) ===
                                                            1
                                                            ? "month"
                                                            : "months"}
                                                    </p>
                                                </div>
                                            </div>

                                        </div>

                                        {/* =====================================
                                            RESUME
                                        ===================================== */}

                                        {referral.resumeUrl && (
                                            <div className="mt-5">
                                                <button
                                                    type="button"
                                                    onClick={(e) =>
                                                        handleViewResume(
                                                            e,
                                                            referral.resumeUrl
                                                        )
                                                    }
                                                    className="resume-button inline-flex items-center gap-2 text-sm font-semibold transition"
                                                >
                                                    <FileText
                                                        size={16}
                                                    />

                                                    View Resume

                                                    <ChevronDown
                                                        size={14}
                                                        className="-rotate-90"
                                                    />
                                                </button>
                                            </div>
                                        )}

                                        {/* =====================================
                                            STATUS MESSAGE
                                        ===================================== */}

                                        {referral.status ===
                                            "APPLIED" && (
                                                <div className="pending-message mt-5 rounded-lg px-4 py-3 text-xs font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Clock3
                                                            size={15}
                                                        />

                                                        <span>
                                                            Your referral
                                                            is waiting for
                                                            HR review.
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                        {referral.status ===
                                            "SHORTLISTED" && (
                                                <div className="approved-message mt-5 rounded-lg px-4 py-3 text-xs font-semibold">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle2
                                                            size={15}
                                                        />

                                                        <span>
                                                            HR has approved
                                                            this candidate.
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                        {referral.status ===
                                            "REJECTED" && (
                                                <div className="rejected-message mt-5 rounded-lg px-4 py-3 text-xs font-semibold">
                                                    <div className="flex items-center gap-2">
                                                        <XCircle
                                                            size={15}
                                                        />

                                                        <span>
                                                            HR has rejected
                                                            this candidate.
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                    </div>
                                );
                            }
                        )}

                    </div>
                )}

            </div>
        </>
    );
}