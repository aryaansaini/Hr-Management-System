"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import {
    ArrowLeft,
    MapPin,
    BriefcaseBusiness,
    Clock3,
    Wallet,
    CalendarDays,
    CircleCheck,
    FileText,
    ClipboardList,
    Users,
    Building2,
    Loader2,
    AlertCircle,
} from "lucide-react";

function JobDetailsContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get("id");

    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!id) {
            setLoading(false);
            setError("Job ID is missing");
            return;
        }

        api
            .get(`/api/recruitment/jobs/${id}`)
            .then((res) => {
                setJob(res.data?.data);
                setLoading(false);
            })
            .catch((error) => {
                console.error(error);
                setError("Unable to load job details");
                setLoading(false);
            });
    }, [id]);

    /* =========================
       LOADING
    ========================= */
    if (loading) {
        return (
            <>
                <style jsx global>{`
          .job-details-page {
            min-height: 100vh;
            background: #f8fafc;
            color: #0f172a;
          }

          .dark .job-details-page {
            background: #0b1220;
            color: #f8fafc;
          }

          .loading-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            color: #64748b;
          }

          .dark .loading-card {
            background: #111827;
            border-color: #243047;
            color: #94a3b8;
          }
        `}</style>

                <div className="job-details-page min-h-screen p-6 md:p-8">
                    <div className="loading-card flex min-h-[250px] items-center justify-center rounded-2xl border">
                        <div className="text-center">
                            <Loader2
                                size={30}
                                className="mx-auto mb-3 animate-spin text-blue-600 dark:text-blue-400"
                            />

                            <p className="text-sm font-medium">
                                Loading job details...
                            </p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    /* =========================
       ERROR
    ========================= */
    if (error) {
        return (
            <>
                <style jsx global>{`
          .job-details-page {
            min-height: 100vh;
            background: #f8fafc;
            color: #0f172a;
          }

          .dark .job-details-page {
            background: #0b1220;
            color: #f8fafc;
          }

          .error-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
          }

          .dark .error-card {
            background: #111827;
            border-color: #243047;
          }

          .error-title {
            color: #0f172a;
          }

          .dark .error-title {
            color: #f8fafc;
          }

          .error-text {
            color: #64748b;
          }

          .dark .error-text {
            color: #94a3b8;
          }
        `}</style>

                <div className="job-details-page min-h-screen p-6 md:p-8">
                    <div className="error-card max-w-4xl rounded-2xl border p-8">
                        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                            <AlertCircle size={21} />
                        </div>

                        <h2 className="error-title text-lg font-bold">
                            Unable to load job
                        </h2>

                        <p className="error-text mt-1 text-sm">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() => router.push("/employee/jobs")}
                            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            Back to Jobs
                        </button>
                    </div>
                </div>
            </>
        );
    }

    /* =========================
       JOB NOT FOUND
    ========================= */
    if (!job) {
        return (
            <>
                <style jsx global>{`
          .job-details-page {
            min-height: 100vh;
            background: #f8fafc;
            color: #0f172a;
          }

          .dark .job-details-page {
            background: #0b1220;
            color: #f8fafc;
          }

          .not-found-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
          }

          .dark .not-found-card {
            background: #111827;
            border-color: #243047;
          }

          .not-found-title {
            color: #0f172a;
          }

          .dark .not-found-title {
            color: #f8fafc;
          }

          .not-found-text {
            color: #64748b;
          }

          .dark .not-found-text {
            color: #94a3b8;
          }
        `}</style>

                <div className="job-details-page min-h-screen p-6 md:p-8">
                    <div className="not-found-card max-w-4xl rounded-2xl border p-8">
                        <h2 className="not-found-title text-lg font-bold">
                            Job not found
                        </h2>

                        <p className="not-found-text mt-1 text-sm">
                            The requested job opening could not be found.
                        </p>

                        <button
                            type="button"
                            onClick={() => router.push("/employee/jobs")}
                            className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                            Back to Jobs
                        </button>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <style jsx global>{`
        /* =========================
           PAGE
        ========================= */

        .job-details-page {
          min-height: 100vh;
          background: #f8fafc;
          color: #0f172a;
        }

        .dark .job-details-page {
          background: #0b1220;
          color: #f8fafc;
        }

        /* =========================
           BREADCRUMB
        ========================= */

        .breadcrumb {
          color: #64748b;
        }

        .dark .breadcrumb {
          color: #64748b;
        }

        /* =========================
           BACK BUTTON
        ========================= */

        .back-button {
          color: #2563eb;
        }

        .back-button:hover {
          color: #1d4ed8;
        }

        .dark .back-button {
          color: #60a5fa;
        }

        .dark .back-button:hover {
          color: #93c5fd;
        }

        /* =========================
           MAIN CARD
        ========================= */

        .details-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          box-shadow: 0 5px 20px rgba(15, 23, 42, 0.04);
        }

        .dark .details-card {
          background: #111827;
          border-color: #243047;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        /* =========================
           TITLE
        ========================= */

        .job-title {
          color: #0f172a;
        }

        .dark .job-title {
          color: #f8fafc;
        }

        .job-department {
          color: #64748b;
        }

        .dark .job-department {
          color: #94a3b8;
        }

        /* =========================
           STATUS
        ========================= */

        .status-badge {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }

        .dark .status-badge {
          background: rgba(16, 185, 129, 0.12);
          color: #34d399;
          border-color: rgba(16, 185, 129, 0.25);
        }

        /* =========================
           INFORMATION BOXES
        ========================= */

        .info-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
        }

        .dark .info-box {
          background: #0f172a;
          border-color: #243047;
        }

        .info-icon {
          background: #eff6ff;
          color: #2563eb;
        }

        .dark .info-icon {
          background: rgba(37, 99, 235, 0.12);
          color: #60a5fa;
        }

        .info-label {
          color: #64748b;
        }

        .dark .info-label {
          color: #94a3b8;
        }

        .info-value {
          color: #0f172a;
        }

        .dark .info-value {
          color: #e2e8f0;
        }

        /* =========================
           DIVIDER
        ========================= */

        .section-divider {
          border-color: #e2e8f0;
        }

        .dark .section-divider {
          border-color: #243047;
        }

        /* =========================
           SECTION HEADINGS
        ========================= */

        .section-title {
          color: #0f172a;
        }

        .dark .section-title {
          color: #f8fafc;
        }

        .section-icon {
          color: #2563eb;
        }

        .dark .section-icon {
          color: #60a5fa;
        }

        /* =========================
           DESCRIPTION
        ========================= */

        .section-content {
          color: #475569;
        }

        .dark .section-content {
          color: #cbd5e1;
        }

        /* =========================
           APPLY / REFER BUTTON
        ========================= */

        .refer-button {
          background: #2563eb;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .refer-button:hover {
          background: #1d4ed8;
        }

        .dark .refer-button {
          background: #2563eb;
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.18);
        }

        .dark .refer-button:hover {
          background: #3b82f6;
        }

        /* =========================
           FOOTER NOTE
        ========================= */

        .footer-note {
          color: #94a3b8;
        }

        .dark .footer-note {
          color: #64748b;
        }

        @media (max-width: 640px) {
          .details-card {
            padding: 20px !important;
          }

          .info-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

            <div className="job-details-page p-6 md:p-8">
                {/* Breadcrumb */}
                <div className="breadcrumb mb-3 text-xs font-medium">
                    Employee Portal / Job Openings / Job Details
                </div>

                {/* Back Button */}
                <button
                    type="button"
                    onClick={() => router.push("/employee/jobs")}
                    className="back-button mb-6 flex items-center gap-2 text-sm font-semibold transition"
                >
                    <ArrowLeft size={17} />
                    Back to Jobs
                </button>

                {/* Main Card */}
                <div className="details-card max-w-5xl rounded-2xl border p-6 md:p-8">
                    {/* Header */}
                    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <h1 className="job-title text-2xl font-bold tracking-tight md:text-3xl">
                                {job.title}
                            </h1>

                            <div className="mt-2 flex items-center gap-2">
                                <Building2
                                    size={16}
                                    className="text-slate-400 dark:text-slate-500"
                                />

                                <p className="job-department text-sm">
                                    {job.department || "Department not specified"}
                                </p>
                            </div>
                        </div>

                        {job.status && (
                            <span className="status-badge inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold">
                                <CircleCheck size={14} />
                                {job.status}
                            </span>
                        )}
                    </div>

                    {/* Job Information */}
                    <div className="info-grid mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Location */}
                        <div className="info-box rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="info-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                                    <MapPin size={17} />
                                </div>

                                <div className="min-w-0">
                                    <p className="info-label text-xs font-medium">
                                        Location
                                    </p>

                                    <p className="info-value mt-1 text-sm font-semibold">
                                        {job.location || "Not specified"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Employment Type */}
                        <div className="info-box rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="info-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                                    <BriefcaseBusiness size={17} />
                                </div>

                                <div className="min-w-0">
                                    <p className="info-label text-xs font-medium">
                                        Employment Type
                                    </p>

                                    <p className="info-value mt-1 text-sm font-semibold">
                                        {job.employmentType || "Not specified"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Experience */}
                        <div className="info-box rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="info-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                                    <Clock3 size={17} />
                                </div>

                                <div className="min-w-0">
                                    <p className="info-label text-xs font-medium">
                                        Experience Required
                                    </p>

                                    <p className="info-value mt-1 text-sm font-semibold">
                                        {job.experienceRequired || "Not specified"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Salary */}
                        <div className="info-box rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="info-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                                    <Wallet size={17} />
                                </div>

                                <div className="min-w-0">
                                    <p className="info-label text-xs font-medium">
                                        Salary
                                    </p>

                                    <p className="info-value mt-1 text-sm font-semibold">
                                        {job.salaryRange || "Not specified"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Deadline */}
                        <div className="info-box rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="info-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                                    <CalendarDays size={17} />
                                </div>

                                <div className="min-w-0">
                                    <p className="info-label text-xs font-medium">
                                        Application Deadline
                                    </p>

                                    <p className="info-value mt-1 text-sm font-semibold">
                                        {job.applicationDeadline || "Not specified"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="info-box rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <div className="info-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                                    <CircleCheck size={17} />
                                </div>

                                <div className="min-w-0">
                                    <p className="info-label text-xs font-medium">
                                        Status
                                    </p>

                                    <p className="info-value mt-1 text-sm font-semibold">
                                        {job.status || "Not specified"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <hr className="section-divider my-7 border-t" />

                    {/* Job Description */}
                    <div className="mb-8">
                        <div className="mb-3 flex items-center gap-2">
                            <FileText
                                size={19}
                                className="section-icon"
                            />

                            <h2 className="section-title text-lg font-bold">
                                Job Description
                            </h2>
                        </div>

                        <p className="section-content whitespace-pre-line text-sm leading-7">
                            {job.description || "No description provided."}
                        </p>
                    </div>

                    {/* Requirements */}
                    <div className="mb-8">
                        <div className="mb-3 flex items-center gap-2">
                            <ClipboardList
                                size={19}
                                className="section-icon"
                            />

                            <h2 className="section-title text-lg font-bold">
                                Requirements
                            </h2>
                        </div>

                        <p className="section-content whitespace-pre-line text-sm leading-7">
                            {job.requirements || "No requirements provided."}
                        </p>
                    </div>

                    {/* Divider */}
                    <hr className="section-divider my-7 border-t" />

                    {/* Refer Section */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="mb-1 flex items-center gap-2">
                                <Users
                                    size={18}
                                    className="section-icon"
                                />

                                <h3 className="section-title text-base font-bold">
                                    Know someone who fits this role?
                                </h3>
                            </div>

                            <p className="section-content text-sm">
                                Refer a suitable person for this job opening.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                router.push(
                                    `/employee/jobs/details/refer?id=${id}`
                                )
                            }
                            className="refer-button flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition"
                        >
                            <Users size={17} />
                            Refer a Person
                        </button>
                    </div>

                    <p className="footer-note mt-6 text-xs">
                        Please review the job details and requirements before
                        submitting a referral.
                    </p>
                </div>
            </div>
        </>
    );
}

export default function JobDetails() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-slate-50 p-8 text-slate-500 dark:bg-[#0b1220] dark:text-slate-400">
                    Loading job details...
                </div>
            }
        >
            <JobDetailsContent />
        </Suspense>
    );
}