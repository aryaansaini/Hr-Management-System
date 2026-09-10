"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
    Search,
    MapPin,
    Building2,
    BriefcaseBusiness,
    Clock3,
    Wallet,
    ChevronRight,
    RefreshCw,
    Users,
    FileText,
    X,
} from "lucide-react";

export default function JobOpenings() {
    const [jobs, setJobs] = useState([]);
    const [referrals, setReferrals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingReferrals, setLoadingReferrals] = useState(true);

    const [search, setSearch] = useState("");

    const router = useRouter();

    // =========================
    // GET JOBS
    // =========================
    const fetchJobs = async () => {
        try {
            setLoading(true);

            const res = await api.get("/api/recruitment/jobs");

            setJobs(
                res.data?.data?.content ||
                res.data?.data ||
                []
            );
        } catch (error) {
            console.error("Error fetching jobs:", error);
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    // =========================
    // GET MY REFERRALS
    // =========================
    const fetchMyReferrals = async () => {
        try {
            setLoadingReferrals(true);

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
            setLoadingReferrals(false);
        }
    };

    // =========================
    // LOAD DATA
    // =========================
    useEffect(() => {
        fetchJobs();
        fetchMyReferrals();
    }, []);

    // =========================
    // FILTER JOBS
    // =========================
    const filteredJobs = useMemo(() => {
        const value = search.trim().toLowerCase();

        if (!value) {
            return jobs;
        }

        return jobs.filter((job) => {
            const title = String(
                job?.title || ""
            ).toLowerCase();

            const department = String(
                job?.department || ""
            ).toLowerCase();

            const location = String(
                job?.location || ""
            ).toLowerCase();

            const employmentType = String(
                job?.employmentType || ""
            ).toLowerCase();

            const experience = String(
                job?.experienceRequired || ""
            ).toLowerCase();

            return (
                title.includes(value) ||
                department.includes(value) ||
                location.includes(value) ||
                employmentType.includes(value) ||
                experience.includes(value)
            );
        });
    }, [jobs, search]);

    // =========================
    // CHECK REFERRAL
    // =========================
    const hasReferral = (jobId) => {
        return referrals.some(
            (referral) =>
                String(
                    referral?.jobId ||
                    referral?.job?.id ||
                    referral?.jobPostingId ||
                    referral?.jobPosting?.id
                ) === String(jobId)
        );
    };

    // =========================
    // LOADING
    // =========================
    if (loading) {
        return (
            <>
                <style jsx global>{`
                    .jobs-page {
                        min-height: 100vh;
                        background: #f8fafc;
                    }

                    .dark .jobs-page {
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

                <div className="jobs-page min-h-screen p-6 md:p-8">
                    <div className="loading-card flex min-h-[300px] items-center justify-center rounded-2xl border">
                        <div className="text-center">
                            <RefreshCw
                                size={28}
                                className="mx-auto mb-3 animate-spin text-blue-600 dark:text-blue-400"
                            />

                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                Loading job openings...
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

                .jobs-page {
                    min-height: 100vh;
                    background: #f8fafc;
                    color: #0f172a;
                }

                .dark .jobs-page {
                    background: #0b1220;
                    color: #f8fafc;
                }

                /* =====================================
                   BREADCRUMB
                ===================================== */

                .breadcrumb {
                    color: #64748b;
                }

                .dark .breadcrumb {
                    color: #64748b;
                }

                /* =====================================
                   HEADER
                ===================================== */

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
                   REFRESH
                ===================================== */

                .refresh-btn {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    color: #64748b;
                }

                .dark .refresh-btn {
                    background: #111827;
                    border-color: #243047;
                    color: #94a3b8;
                }

                .refresh-btn:hover {
                    border-color: #2563eb;
                    color: #2563eb;
                }

                .dark .refresh-btn:hover {
                    border-color: #3b82f6;
                    color: #60a5fa;
                }

                /* =====================================
                   SUMMARY
                ===================================== */

                .summary-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 3px 12px rgba(15, 23, 42, 0.035);
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
                   SEARCH
                ===================================== */

                .search-box {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                }

                .dark .search-box {
                    background: #111827;
                    border-color: #243047;
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
                   JOB CARD
                ===================================== */

                .job-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.035);
                    transition: all 0.2s ease;
                }

                .dark .job-card {
                    background: #111827;
                    border-color: #243047;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                }

                .job-card:hover {
                    border-color: rgba(37, 99, 235, 0.4);
                    box-shadow: 0 8px 24px rgba(37, 99, 235, 0.08);
                    transform: translateY(-1px);
                }

                .dark .job-card:hover {
                    border-color: rgba(59, 130, 246, 0.45);
                    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.25);
                }

                /* =====================================
                   JOB TITLE
                ===================================== */

                .job-title {
                    color: #0f172a;
                }

                .dark .job-title {
                    color: #f8fafc;
                }

                .job-title:hover {
                    color: #2563eb;
                }

                .dark .job-title:hover {
                    color: #60a5fa;
                }

                /* =====================================
                   JOB META
                ===================================== */

                .meta-item {
                    color: #64748b;
                }

                .dark .meta-item {
                    color: #94a3b8;
                }

                .meta-value {
                    color: #334155;
                }

                .dark .meta-value {
                    color: #cbd5e1;
                }

                .meta-icon {
                    color: #64748b;
                }

                .dark .meta-icon {
                    color: #94a3b8;
                }

                /* =====================================
                   STATUS
                ===================================== */

                .status-badge {
                    background: #ecfdf5;
                    color: #047857;
                    border: 1px solid #a7f3d0;
                }

                .dark .status-badge {
                    background: rgba(16, 185, 129, 0.12);
                    color: #34d399;
                    border-color: rgba(16, 185, 129, 0.25);
                }

                /* =====================================
                   REFERRAL
                ===================================== */

                .referral-badge {
                    background: #eff6ff;
                    color: #2563eb;
                    border: 1px solid #bfdbfe;
                }

                .dark .referral-badge {
                    background: rgba(37, 99, 235, 0.12);
                    color: #60a5fa;
                    border-color: rgba(59, 130, 246, 0.25);
                }

                /* =====================================
                   DIVIDER
                ===================================== */

                .job-divider {
                    border-color: #e2e8f0;
                }

                .dark .job-divider {
                    border-color: #243047;
                }

                /* =====================================
                   VIEW DETAILS
                ===================================== */

                .details-btn {
                    color: #2563eb;
                }

                .details-btn:hover {
                    color: #1d4ed8;
                }

                .dark .details-btn {
                    color: #60a5fa;
                }

                .dark .details-btn:hover {
                    color: #93c5fd;
                }

                /* =====================================
                   EMPTY
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

                /* =====================================
                   RESPONSIVE
                ===================================== */

                @media (max-width: 640px) {
                    .jobs-page {
                        padding: 16px !important;
                    }

                    .job-card {
                        padding: 18px !important;
                    }
                }
            `}</style>

            <div className="jobs-page p-6 md:p-8">

                {/* =====================================
                    HEADER
                ===================================== */}

                <div className="mb-7">
                    <div className="breadcrumb mb-2 text-xs font-medium">
                        Employee Portal / Job Openings
                    </div>

                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="page-title text-2xl font-bold tracking-tight md:text-3xl">
                                Job Openings
                            </h1>

                            <p className="page-description mt-1 text-sm">
                                Explore current career opportunities
                                available within the organization.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                fetchJobs();
                                fetchMyReferrals();
                            }}
                            className="refresh-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition"
                            title="Refresh"
                        >
                            <RefreshCw size={17} />
                        </button>
                    </div>
                </div>

                {/* =====================================
                    SUMMARY CARDS
                ===================================== */}

                <div className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">

                    <div className="summary-card rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="summary-label text-xs font-medium">
                                    Available Positions
                                </p>

                                <p className="summary-value mt-2 text-2xl font-bold">
                                    {jobs.length}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                <BriefcaseBusiness size={19} />
                            </div>
                        </div>
                    </div>

                    <div className="summary-card rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="summary-label text-xs font-medium">
                                    My Referrals
                                </p>

                                <p className="summary-value mt-2 text-2xl font-bold">
                                    {referrals.length}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                                <Users size={19} />
                            </div>
                        </div>
                    </div>

                    <div className="summary-card rounded-xl p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="summary-label text-xs font-medium">
                                    Search Results
                                </p>

                                <p className="summary-value mt-2 text-2xl font-bold">
                                    {filteredJobs.length}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
                                <Search size={19} />
                            </div>
                        </div>
                    </div>

                </div>

                {/* =====================================
                    SEARCH
                ===================================== */}

                <div className="search-box mb-7 flex h-12 items-center gap-3 rounded-xl px-4">
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
                        placeholder="Search by job title, department, location or experience..."
                        className="search-input w-full text-sm"
                    />

                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="text-slate-400 transition hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                        >
                            <X size={17} />
                        </button>
                    )}
                </div>

                {/* =====================================
                    SECTION HEADER
                ===================================== */}

                <div className="mb-4">
                    <h2 className="section-title text-lg font-bold">
                        Available Opportunities
                    </h2>

                    <p className="section-description mt-1 text-xs">
                        {filteredJobs.length} position
                        {filteredJobs.length !== 1
                            ? "s"
                            : ""}{" "}
                        available
                    </p>
                </div>

                {/* =====================================
                    JOB LIST
                ===================================== */}

                <div className="space-y-4">

                    {filteredJobs.length === 0 ? (
                        <div className="empty-card rounded-2xl p-10 text-center">
                            <div className="empty-icon mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl">
                                <BriefcaseBusiness size={22} />
                            </div>

                            <h3 className="empty-title text-base font-bold">
                                No job openings found
                            </h3>

                            <p className="empty-text mt-1 text-sm">
                                {search
                                    ? "Try adjusting your search criteria."
                                    : "There are currently no job openings available."}
                            </p>

                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="mt-4 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    Clear Search
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredJobs.map((job) => (
                            <div
                                key={job.id}
                                className="job-card rounded-2xl p-5 md:p-6"
                            >

                                {/* JOB HEADER */}

                                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">

                                    <div className="min-w-0">
                                        <div className="mb-2 flex flex-wrap items-center gap-2">

                                            <h3 className="job-title text-lg font-bold transition md:text-xl">
                                                {job.title}
                                            </h3>

                                            {hasReferral(job.id) && (
                                                <span className="referral-badge inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold">
                                                    <Users size={12} />
                                                    Referred
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Building2
                                                size={15}
                                                className="meta-icon"
                                            />

                                            <span className="meta-item text-sm">
                                                {job.department ||
                                                    "Department not specified"}
                                            </span>
                                        </div>
                                    </div>

                                    <span className="status-badge inline-flex w-fit items-center rounded-full px-3 py-1.5 text-[11px] font-semibold">
                                        Open Position
                                    </span>

                                </div>

                                {/* JOB INFORMATION */}

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

                                    {/* LOCATION */}

                                    <div className="flex items-start gap-3">
                                        <MapPin
                                            size={17}
                                            className="meta-icon mt-0.5 shrink-0"
                                        />

                                        <div className="min-w-0">
                                            <p className="meta-item text-[11px] font-medium">
                                                Location
                                            </p>

                                            <p className="meta-value mt-1 truncate text-sm font-semibold">
                                                {job.location ||
                                                    "Not specified"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* EMPLOYMENT */}

                                    <div className="flex items-start gap-3">
                                        <BriefcaseBusiness
                                            size={17}
                                            className="meta-icon mt-0.5 shrink-0"
                                        />

                                        <div className="min-w-0">
                                            <p className="meta-item text-[11px] font-medium">
                                                Employment Type
                                            </p>

                                            <p className="meta-value mt-1 truncate text-sm font-semibold">
                                                {job.employmentType ||
                                                    "Not specified"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* EXPERIENCE */}

                                    <div className="flex items-start gap-3">
                                        <Clock3
                                            size={17}
                                            className="meta-icon mt-0.5 shrink-0"
                                        />

                                        <div className="min-w-0">
                                            <p className="meta-item text-[11px] font-medium">
                                                Experience
                                            </p>

                                            <p className="meta-value mt-1 truncate text-sm font-semibold">
                                                {job.experienceRequired ||
                                                    "Not specified"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* SALARY */}

                                    <div className="flex items-start gap-3">
                                        <Wallet
                                            size={17}
                                            className="meta-icon mt-0.5 shrink-0"
                                        />

                                        <div className="min-w-0">
                                            <p className="meta-item text-[11px] font-medium">
                                                Salary
                                            </p>

                                            <p className="meta-value mt-1 truncate text-sm font-semibold">
                                                {job.salaryRange ||
                                                    "Not specified"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* DEPARTMENT */}

                                    <div className="flex items-start gap-3">
                                        <FileText
                                            size={17}
                                            className="meta-icon mt-0.5 shrink-0"
                                        />

                                        <div className="min-w-0">
                                            <p className="meta-item text-[11px] font-medium">
                                                Department
                                            </p>

                                            <p className="meta-value mt-1 truncate text-sm font-semibold">
                                                {job.department ||
                                                    "Not specified"}
                                            </p>
                                        </div>
                                    </div>

                                </div>

                                {/* DIVIDER */}

                                <div className="job-divider my-5 border-t" />

                                {/* FOOTER */}

                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                                    <p className="meta-item text-xs">
                                        Review the complete job description
                                        and requirements before referring a
                                        candidate.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            router.push(
                                                `/employee/jobs/details/?id=${job.id}`
                                            )
                                        }
                                        className="details-btn inline-flex items-center justify-center gap-1.5 text-sm font-semibold transition"
                                    >
                                        View Details
                                        <ChevronRight size={16} />
                                    </button>

                                </div>

                            </div>
                        ))
                    )}

                </div>

               

            </div>
        </>
    );
}