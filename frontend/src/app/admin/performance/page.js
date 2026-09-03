'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAllEmployees } from '@/lib/adminApi';
import api from '@/lib/axios';
import toast from 'react-hot-toast';
import {
  Star,
  Award,
  TrendingUp,
  Target,
  MessageSquare,
  Loader2,
  FileEdit,
  Trash2,
  X,
} from 'lucide-react';

/* =========================================================
   QUARTER CONFIGURATION
   ========================================================= */

const QUARTERS = [
  {
    quarter: 1,
    name: 'Q1',
    reviewMonth: 2,
    reviewMonthName: 'March',
  },
  {
    quarter: 2,
    name: 'Q2',
    reviewMonth: 5,
    reviewMonthName: 'June',
  },
  {
    quarter: 3,
    name: 'Q3',
    reviewMonth: 8,
    reviewMonthName: 'September',
  },
  {
    quarter: 4,
    name: 'Q4',
    reviewMonth: 11,
    reviewMonthName: 'December',
  },
];

/* =========================================================
   DATE HELPERS
   ========================================================= */

const getCurrentDateInfo = () => {
  const today = new Date();

  return {
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate(),
    date: today,
  };
};

const getTodayString = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/* =========================================================
   CURRENT QUARTER
   ========================================================= */

const getCurrentQuarterNumber = () => {
  const { month } = getCurrentDateInfo();

  return Math.floor(month / 3) + 1;
};

const getCurrentQuarter = () => {
  const quarterNumber = getCurrentQuarterNumber();

  return QUARTERS.find(
    (quarter) => quarter.quarter === quarterNumber
  );
};

/* =========================================================
   AVAILABLE REVIEW QUARTER
   ========================================================= */

const getAvailableReviewQuarter = () => {
  const { month } = getCurrentDateInfo();

  return QUARTERS.find(
    (quarter) => quarter.reviewMonth === month
  );
};

/* =========================================================
   CURRENT REVIEW PERIOD
   ========================================================= */

const getCurrentReviewPeriod = () => {
  const { year } = getCurrentDateInfo();
  const currentQuarter = getCurrentQuarter();

  if (!currentQuarter) {
    return '';
  }

  return `${currentQuarter.name} ${year}`;
};

/* =========================================================
   QUARTER STATUS
   ========================================================= */

const getQuarterStatus = (quarter, currentMonth) => {
  /*
   * The review month has already passed.
   */
  if (currentMonth > quarter.reviewMonth) {
    return {
      type: 'completed',
      icon: '❌',
      text: 'Already completed',
    };
  }

  /*
   * We are currently inside the review month.
   */
  if (currentMonth === quarter.reviewMonth) {
    return {
      type: 'available',
      icon: '✅',
      text: `${quarter.reviewMonthName} is the review month`,
    };
  }

  /*
   * Review month is still in the future.
   */
  return {
    type: 'future',
    icon: '⏳',
    text: `Not available yet — ${quarter.reviewMonthName} is the review month`,
  };
};

/* =========================================================
   EMPTY FORM
   ========================================================= */

const EMPTY_FORM = {
  employeeId: '',
  reviewPeriod: getCurrentReviewPeriod(),
  reviewDate: getTodayString(),

  technicalSkills: 3,
  communication: 3,
  teamwork: 3,
  productivity: 3,
  leadership: 3,

  strengths: '',
  improvements: '',
  goals: '',
};

/* =========================================================
   EXPANDABLE TEXT
   ========================================================= */

function ExpandableText({ text, maxLength = 120 }) {
  const [expanded, setExpanded] = useState(false);

  if (!text) {
    return null;
  }

  const isLong = text.length > maxLength;

  if (!isLong) {
    return (
      <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
        {text}
      </div>
    );
  }

  const displayedText = expanded
    ? text
    : `${text.substring(0, maxLength).trim()}...`;

  return (
    <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
      {displayedText}{' '}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((prev) => !prev);
        }}
        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
      >
        {expanded ? 'Read Less' : 'Read More'}
      </button>
    </div>
  );
}

/* =========================================================
   STAR RATING
   ========================================================= */

function StarRating({ value }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className={`text-sm ${
            s <= Math.round(value)
              ? 'text-amber-500'
              : 'text-slate-200 dark:text-slate-700'
          }`}
        >
          ★
        </span>
      ))}

      <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
        {value}/5
      </span>
    </div>
  );
}

/* =========================================================
   STATUS BADGE
   ========================================================= */

function Badge({ status }) {
  const map = {
    DRAFT:
      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',

    SUBMITTED:
      'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',

    ACKNOWLEDGED:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',

    IN_PROGRESS:
      'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  };

  const colorClass =
    map[status] ||
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${colorClass}`}
    >
      {status}
    </span>
  );
}

/* =========================================================
   PERFORMANCE PAGE
   ========================================================= */

export default function PerformancePage() {
  const [reviews, setReviews] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState(EMPTY_FORM);

  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [editingDraftId, setEditingDraftId] = useState(null);

  /* =======================================================
     DELETE / CLEAR ALL STATE
     ======================================================= */

  const [deletingId, setDeletingId] = useState(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  /* =======================================================
     FETCH DATA
     ======================================================= */

  const fetchAll = useCallback(async () => {
    setLoading(true);

    try {
      const [revRes, empRes] = await Promise.allSettled([
        api.get(`/api/performance?page=${page}`),
        getAllEmployees(0, 100),
      ]);

      if (revRes.status === 'fulfilled') {
        setReviews(
          revRes.value.data?.data?.content || []
        );

        setTotalPages(
          revRes.value.data?.data?.totalPages || 1
        );
      }

      if (empRes.status === 'fulfilled') {
        setEmployees(
          empRes.value.data?.data?.content || []
        );
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAll();
    }, 0);

    return () => clearTimeout(timer);
  }, [fetchAll]);

  /* =======================================================
     OPEN CREATE REVIEW
     
     The form can be opened even before the review month.
     This allows admin to prepare and save a draft.
     ======================================================= */

  const handleOpenCreateReview = () => {
    const { year } = getCurrentDateInfo();

    const currentQuarter = getCurrentQuarter();

    const currentPeriod =
      `${currentQuarter.name} ${year}`;

    setEditingDraftId(null);

    setForm({
      ...EMPTY_FORM,
      reviewPeriod: currentPeriod,
      reviewDate: getTodayString(),
    });

    setShowForm(true);
  };

  /* =======================================================
     OPEN EXISTING DRAFT
     ======================================================= */

  const handleOpenDraft = (review) => {
    if (review.status !== 'DRAFT') {
      return;
    }

    setEditingDraftId(review.id);

    setForm({
      employeeId: review.employeeId || '',
      reviewPeriod: review.reviewPeriod || '',
      reviewDate:
        review.reviewDate || getTodayString(),

      technicalSkills:
        review.technicalSkills || 3,

      communication:
        review.communication || 3,

      teamwork:
        review.teamwork || 3,

      productivity:
        review.productivity || 3,

      leadership:
        review.leadership || 3,

      strengths:
        review.strengths || '',

      improvements:
        review.improvements || '',

      goals:
        review.goals || '',
    });

    setShowForm(true);
  };

  /* =======================================================
     SAVE AS DRAFT
     
     Drafts can be saved before the review month.
     ======================================================= */

  const handleSaveDraft = async () => {
    setSubmitting(true);

    try {
      const payload = {
        ...form,

        employeeId: form.employeeId
          ? parseInt(form.employeeId)
          : null,

        technicalSkills: parseInt(
          form.technicalSkills || 3
        ),

        communication: parseInt(
          form.communication || 3
        ),

        teamwork: parseInt(
          form.teamwork || 3
        ),

        productivity: parseInt(
          form.productivity || 3
        ),

        leadership: parseInt(
          form.leadership || 3
        ),

        status: 'DRAFT',
      };

      if (editingDraftId) {
        /*
         * Update existing draft.
         */
        await api.put(
          `/api/performance/${editingDraftId}`,
          payload
        );

        toast.success(
          'Performance review draft updated'
        );
      } else {
        /*
         * Create new draft.
         */
        await api.post(
          '/api/performance/draft',
          payload
        );

        toast.success(
          'Performance review saved as draft'
        );
      }

      setShowForm(false);
      setEditingDraftId(null);

      setForm({
        ...EMPTY_FORM,
        reviewPeriod: getCurrentReviewPeriod(),
        reviewDate: getTodayString(),
      });

      fetchAll();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Failed to save draft'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     SUBMIT REVIEW
     
     Submission is allowed ONLY during:
     March / June / September / December
     ======================================================= */

  const handleCreate = async (e) => {
    e.preventDefault();

    const { year, month } =
      getCurrentDateInfo();

    /*
     * Find the quarter currently available
     * for submission.
     */
    const availableQuarter =
      QUARTERS.find(
        (quarter) =>
          quarter.reviewMonth === month
      );

    /*
     * If current month is not a review month,
     * submission is not allowed.
     */
    if (!availableQuarter) {
      toast.error(
        `Review cannot be submitted yet. ${
          getCurrentQuarter().reviewMonthName
        } is the review month.`
      );

      return;
    }

    const expectedReviewPeriod =
      `${availableQuarter.name} ${year}`;

    /*
     * Prevent submitting wrong quarter.
     */
    if (
      form.reviewPeriod !==
      expectedReviewPeriod
    ) {
      toast.error(
        `You can only submit ${expectedReviewPeriod} during ${availableQuarter.reviewMonthName}.`
      );

      return;
    }

    /*
     * Employee is required.
     */
    if (!form.employeeId) {
      toast.error('Please select an employee.');

      return;
    }

    /*
     * Review date must be today.
     */
    const todayString =
      getTodayString();

    if (
      form.reviewDate !==
      todayString
    ) {
      toast.error(
        'Review date must be today.'
      );

      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...form,

        employeeId:
          parseInt(form.employeeId),

        technicalSkills:
          parseInt(
            form.technicalSkills
          ),

        communication:
          parseInt(
            form.communication
          ),

        teamwork:
          parseInt(
            form.teamwork
          ),

        productivity:
          parseInt(
            form.productivity
          ),

        leadership:
          parseInt(
            form.leadership
          ),

        status: 'SUBMITTED',
      };

      if (editingDraftId) {
        /*
         * Submit existing draft.
         */
        await api.put(
          `/api/performance/${editingDraftId}`,
          payload
        );
      } else {
        /*
         * Create a new submitted review.
         */
        await api.post(
          '/api/performance',
          payload
        );
      }

      toast.success(
        'Performance review submitted!'
      );

      setShowForm(false);
      setEditingDraftId(null);

      setForm({
        ...EMPTY_FORM,
        reviewPeriod:
          getCurrentReviewPeriod(),
        reviewDate:
          getTodayString(),
      });

      fetchAll();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Failed to submit review'
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* =======================================================
     RATING CHANGE
     ======================================================= */

  const handleRatingChange = (
    name,
    val
  ) => {
    setForm((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  /* =======================================================
     DELETE SINGLE REVIEW
     ======================================================= */

  const openDeleteModal = (review) => {
    setReviewToDelete(review);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!reviewToDelete) {
      return;
    }

    const id = reviewToDelete.id;

    setDeletingId(id);

    try {
      await api.delete(`/api/performance/${id}`);

      toast.success('Review deleted');

      setShowDeleteModal(false);
      setReviewToDelete(null);

      if (selected?.id === id) {
        setSelected(null);
      }

      fetchAll();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Failed to delete review'
      );
    } finally {
      setDeletingId(null);
    }
  };

  /* =======================================================
     CLEAR ALL REVIEWS
     ======================================================= */

  const openClearAllModal = () => {
    if (reviews.length === 0) {
      return;
    }

    setShowClearModal(true);
  };

  const handleClearAll = async () => {
    setClearingAll(true);

    try {
      await api.delete('/api/performance/clear-all');

      toast.success('All reviews cleared');

      setShowClearModal(false);
      setSelected(null);
      setPage(0);

      fetchAll();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Failed to clear reviews'
      );
    } finally {
      setClearingAll(false);
    }
  };

  /* =======================================================
     CURRENT DATE INFORMATION
     ======================================================= */

  const {
    year: currentYear,
    month: currentMonth,
  } = getCurrentDateInfo();

  const currentQuarter =
    getCurrentQuarter();

  const availableQuarter =
    getAvailableReviewQuarter();

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 min-h-screen text-slate-900 dark:text-slate-100">

      {/* ===================================================
          HEADER
          =================================================== */}

      <div className="flex justify-between items-center">

        <div>

          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Performance Reviews
          </h1>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create and manage employee performance reviews
          </p>

        </div>

        <div className="flex items-center gap-2">

          {reviews.length > 0 && (

            <button
              onClick={openClearAllModal}
              disabled={clearingAll}
              className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-sm font-semibold transition disabled:opacity-50"
            >
              <Trash2 size={14} />
              {clearingAll ? 'Clearing...' : 'Clear All'}
            </button>

          )}

          <button
            onClick={
              handleOpenCreateReview
            }
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition shadow-sm"
          >
            + Create Review
          </button>

        </div>

      </div>

      {/* ===================================================
          REVIEW PERIOD STATUS
          =================================================== */}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">

        <div className="flex items-center justify-between mb-4">

          <div>

            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Review Period Status
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Performance reviews are conducted once every three months.
            </p>

          </div>

          {availableQuarter ? (

            <span className="px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold">
              {availableQuarter.reviewMonthName}{' '}
              is the review month
            </span>

          ) : (

            <span className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-xs font-bold">
              {currentQuarter.reviewMonthName}{' '}
              is the review month
            </span>

          )}

        </div>

        <div className="space-y-2">

          {QUARTERS.map(
            (quarter) => {

              const result =
                getQuarterStatus(
                  quarter,
                  currentMonth
                );

              const quarterName =
                `${quarter.name} ${currentYear}`;

              return (

                <div
                  key={quarterName}
                  className={`flex items-center justify-between px-4 py-3 rounded-lg border ${
                    result.type ===
                    'available'
                      ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/40'
                  }`}
                >

                  <div className="flex items-center gap-3">

                    <span className="text-base">
                      {result.icon}
                    </span>

                    <div>

                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {quarterName}
                      </div>

                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Review month:{' '}
                        {
                          quarter.reviewMonthName
                        }
                      </div>

                    </div>

                  </div>

                  <div
                    className={`text-xs font-semibold ${
                      result.type ===
                      'available'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : result.type ===
                          'completed'
                        ? 'text-slate-500 dark:text-slate-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {result.text}
                  </div>

                </div>

              );
            }
          )}

        </div>

      </div>

      {/* ===================================================
          REVIEWS TABLE
          =================================================== */}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <div className="min-w-[840px]">

            {/* TABLE HEADER */}

            <div className="grid grid-cols-6 px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">

              <div>
                Employee
              </div>

              <div>
                Review Period
              </div>

              <div>
                Overall Rating
              </div>

              <div>
                Status
              </div>

              <div>
                Review Date
              </div>

              <div className="text-right">
                Actions
              </div>

            </div>

            {/* TABLE BODY */}

            {loading ? (

              <div className="p-16 text-center text-slate-400 dark:text-slate-500">
                Loading reviews...
              </div>

            ) : reviews.length === 0 ? (

              <div className="p-20 text-center">

                <div className="flex justify-center mb-4 text-amber-500">

                  <Star
                    size={48}
                    strokeWidth={1.5}
                  />

                </div>

                <div className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  No reviews yet
                </div>

                <button
                  onClick={
                    handleOpenCreateReview
                  }
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white text-xs font-semibold rounded-lg"
                >
                  + Create First Review
                </button>

              </div>

            ) : (

              reviews.map((r) => {

                const isSelected =
                  selected?.id ===
                  r.id;

                return (

                  <div
                    key={r.id}
                  >

                    {/* =================================================
                        REVIEW ROW
                        ================================================= */}

                    <div
                      onClick={() =>
                        setSelected(
                          isSelected
                            ? null
                            : r
                        )
                      }
                      className={`grid grid-cols-6 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800/80 items-center cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-50/70 dark:bg-blue-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >

                      {/* Employee */}

                      <div className="flex items-center gap-3">

                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-700 to-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">

                          {r.employeeName
                            ?.split(' ')
                            .map(
                              (n) =>
                                n[0]
                            )
                            .join('')
                            .slice(
                              0,
                              2
                            )}

                        </div>

                        <div>

                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {
                              r.employeeName
                            }
                          </div>

                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {
                              r.employeeCode
                            }
                          </div>

                        </div>

                      </div>

                      {/* Review Period */}

                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        {
                          r.reviewPeriod
                        }
                      </div>

                      {/* Overall Rating */}

                      <StarRating
                        value={
                          r.overallRating
                        }
                      />

                      {/* Status */}

                      <div>
                        <Badge
                          status={
                            r.status
                          }
                        />
                      </div>

                      {/* Review Date */}

                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        {
                          r.reviewDate
                        }
                      </div>

                      {/* Actions */}

                      <div className="flex justify-end">

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(r);
                          }}
                          disabled={deletingId === r.id}
                          title="Delete review"
                          aria-label="Delete review"
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-900/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === r.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>

                      </div>

                    </div>

                    {/* =================================================
                        EXPANDED REVIEW
                        ================================================= */}

                    {isSelected && (

                      <div className="p-5 bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 space-y-4">

                        {/* Rating Breakdown */}

                        <div className="grid grid-cols-5 gap-3">

                          {[
                            {
                              label:
                                'Technical',
                              value:
                                r.technicalSkills,
                            },

                            {
                              label:
                                'Communication',
                              value:
                                r.communication,
                            },

                            {
                              label:
                                'Teamwork',
                              value:
                                r.teamwork,
                            },

                            {
                              label:
                                'Productivity',
                              value:
                                r.productivity,
                            },

                            {
                              label:
                                'Leadership',
                              value:
                                r.leadership,
                            },
                          ].map(
                            (s) => (

                              <div
                                key={
                                  s.label
                                }
                                className="bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-slate-200 dark:border-slate-800 text-center shadow-xs"
                              >

                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                                  {
                                    s.label
                                  }
                                </div>

                                <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100">
                                  {
                                    s.value
                                  }
                                </div>

                                <div className="text-[10px] text-slate-400 dark:text-slate-500">
                                  / 5
                                </div>

                              </div>

                            )
                          )}

                        </div>

                        {/* =================================================
                            FEEDBACK CARDS
                            ================================================= */}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

                          {[
                            {
                              label: (
                                <>
                                  <Award
                                    size={
                                      14
                                    }
                                    className="inline mr-1 text-emerald-500"
                                  />

                                  Strengths
                                </>
                              ),

                              value:
                                r.strengths,
                            },

                            {
                              label: (
                                <>
                                  <TrendingUp
                                    size={
                                      14
                                    }
                                    className="inline mr-1 text-amber-500"
                                  />

                                  Improvements
                                </>
                              ),

                              value:
                                r.improvements,
                            },

                            {
                              label: (
                                <>
                                  <Target
                                    size={
                                      14
                                    }
                                    className="inline mr-1 text-blue-500"
                                  />

                                  Goals
                                </>
                              ),

                              value:
                                r.goals,
                            },
                          ].map(
                            (
                              d,
                              index
                            ) =>
                              d.value && (

                                <div
                                  key={
                                    index
                                  }
                                  className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800 shadow-xs"
                                >

                                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                                    {
                                      d.label
                                    }
                                  </div>

                                  <ExpandableText
                                    text={
                                      d.value
                                    }
                                    maxLength={
                                      120
                                    }
                                  />

                                </div>

                              )
                          )}

                        </div>

                        {/* =================================================
                            EMPLOYEE COMMENTS
                            ================================================= */}

                        {r.employeeComments && (

                          <div className="bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-lg p-3">

                            <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1 flex items-center gap-1">

                              <MessageSquare
                                size={
                                  12
                                }
                              />

                              Employee Comments

                            </div>

                            <ExpandableText
                              text={
                                r.employeeComments
                              }
                              maxLength={
                                120
                              }
                            />

                          </div>

                        )}

                        {/* =================================================
                            CONTINUE DRAFT BUTTON
                            ================================================= */}

                        {r.status ===
                          'DRAFT' && (

                          <div className="flex justify-end">

                            <button
                              type="button"
                              onClick={() =>
                                handleOpenDraft(
                                  r
                                )
                              }
                              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition"
                            >

                              <FileEdit
                                size={
                                  14
                                }
                              />

                              Continue Draft

                            </button>

                          </div>

                        )}

                      </div>

                    )}

                  </div>

                );

              })

            )}

          </div>

        </div>

        {/* =================================================
            PAGINATION
            ================================================= */}

        {!loading &&
          reviews.length > 0 && (

            <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/40">

              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Page{' '}
                {page + 1} of{' '}
                {totalPages ||
                  1}
              </div>

              <div className="flex gap-2">

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
                  disabled={
                    page === 0
                  }
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>

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
                    totalPages -
                      1
                  }
                  className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>

              </div>

            </div>

          )}

      </div>

      {/* ===================================================
          CREATE / EDIT REVIEW MODAL
          =================================================== */}

      {showForm && (

        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">

          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">

            {/* Modal Header */}

            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">

              <div>

                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">

                  {editingDraftId
                    ? 'Continue Performance Review'
                    : 'Create Performance Review'}

                </h2>

                {editingDraftId && (

                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Draft review
                  </p>

                )}

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg"
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={
                handleCreate
              }
              className="space-y-4"
            >

              {/* =================================================
                  EMPLOYEE + REVIEW PERIOD
                  ================================================= */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                {/* Employee */}

                <div>

                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">

                    Employee{' '}

                    <span className="text-red-500">
                      *
                    </span>

                  </label>

                  <select
                    value={
                      form.employeeId
                    }
                    onChange={(
                      e
                    ) =>
                      setForm({
                        ...form,
                        employeeId:
                          e.target
                            .value,
                      })
                    }
                    required
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >

                    <option value="">
                      Select employee...
                    </option>

                    {employees.map(
                      (e) => (

                        <option
                          key={
                            e.id
                          }
                          value={
                            e.id
                          }
                        >
                          {
                            e.firstName
                          }{' '}
                          {
                            e.lastName
                          }{' '}
                          —{' '}
                          {
                            e.employeeCode
                          }
                        </option>

                      )
                    )}

                  </select>

                </div>

                {/* Review Period */}

                <div>

                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Review Period
                  </label>

                  <select
                    value={
                      form.reviewPeriod
                    }
                    onChange={(
                      e
                    ) =>
                      setForm({
                        ...form,
                        reviewPeriod:
                          e.target
                            .value,
                      })
                    }
                    required
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                  >

                    <option value="">
                      Select review period...
                    </option>

                    {QUARTERS.map(
                      (quarter) => {

                        const result =
                          getQuarterStatus(
                            quarter,
                            currentMonth
                          );

                        const value =
                          `${quarter.name} ${currentYear}`;

                        return (

                          <option
                            key={
                              value
                            }
                            value={
                              value
                            }
                            disabled={
                              result.type !==
                              'available'
                            }
                          >
                            {value}
                          </option>

                        );

                      }
                    )}

                  </select>

                  <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                    Review months: March,
                    June, September and
                    December.
                  </p>

                </div>

              </div>

              {/* =================================================
                  REVIEW SCHEDULE INFORMATION
                  ================================================= */}

              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/50 dark:bg-blue-950/20 p-3">

                <div className="text-xs font-bold text-blue-700 dark:text-blue-300">
                  Review Schedule
                </div>

                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">

                  {availableQuarter ? (

                    <>
                      <strong>
                        {
                          availableQuarter.name
                        }{' '}
                        {
                          currentYear
                        }
                      </strong>{' '}
                      is currently
                      available for
                      submission during{' '}

                      <strong>
                        {
                          availableQuarter.reviewMonthName
                        }
                      </strong>
                      .
                    </>

                  ) : (

                    <>
                      The current quarter is{' '}

                      <strong>
                        {
                          currentQuarter.name
                        }{' '}
                        {
                          currentYear
                        }
                      </strong>
                      . The review
                      month is{' '}

                      <strong>
                        {
                          currentQuarter.reviewMonthName
                        }
                      </strong>
                      .
                    </>

                  )}

                </div>

              </div>

              {/* =================================================
                  RATINGS
                  ================================================= */}

              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">

                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Ratings (1–5)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <RatingInput
                    label="Technical Skills"
                    name="technicalSkills"
                    value={
                      form.technicalSkills
                    }
                    onChange={
                      handleRatingChange
                    }
                  />

                  <RatingInput
                    label="Communication"
                    name="communication"
                    value={
                      form.communication
                    }
                    onChange={
                      handleRatingChange
                    }
                  />

                  <RatingInput
                    label="Teamwork"
                    name="teamwork"
                    value={
                      form.teamwork
                    }
                    onChange={
                      handleRatingChange
                    }
                  />

                  <RatingInput
                    label="Productivity"
                    name="productivity"
                    value={
                      form.productivity
                    }
                    onChange={
                      handleRatingChange
                    }
                  />

                  <RatingInput
                    label="Leadership"
                    name="leadership"
                    value={
                      form.leadership
                    }
                    onChange={
                      handleRatingChange
                    }
                  />

                </div>

              </div>

              {/* =================================================
                  TEXT FIELDS
                  ================================================= */}

              {[
                {
                  label:
                    'Strengths',
                  name:
                    'strengths',
                  placeholder:
                    'Key strengths of the employee...',
                },

                {
                  label:
                    'Areas for Improvement',
                  name:
                    'improvements',
                  placeholder:
                    'Areas to improve...',
                },

                {
                  label:
                    'Goals',
                  name:
                    'goals',
                  placeholder:
                    'Goals for next period...',
                },
              ].map(
                (field) => (

                  <div
                    key={
                      field.name
                    }
                  >

                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      {
                        field.label
                      }
                    </label>

                    <textarea
                      value={
                        form[
                          field.name
                        ]
                      }
                      onChange={(
                        e
                      ) =>
                        setForm({
                          ...form,
                          [field.name]:
                            e.target
                              .value,
                        })
                      }
                      placeholder={
                        field.placeholder
                      }
                      rows={3}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    />

                    <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      {form[
                        field.name
                      ]?.length || 0}{' '}
                      characters
                    </div>

                  </div>

                )
              )}

              {/* =================================================
                  BUTTONS
                  ================================================= */}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">

                {/* Cancel */}

                <button
                  type="button"
                  onClick={() =>
                    setShowForm(
                      false
                    )
                  }
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>

                {/* Save Draft */}

                <button
                  type="button"
                  onClick={
                    handleSaveDraft
                  }
                  disabled={
                    submitting
                  }
                  className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 flex items-center justify-center gap-2 transition"
                >

                  {submitting ? (

                    <Loader2
                      size={
                        15
                      }
                      className="animate-spin"
                    />

                  ) : (

                    <FileEdit
                      size={
                        15
                      }
                    />

                  )}

                  {submitting
                    ? 'Saving...'
                    : editingDraftId
                    ? 'Update Draft'
                    : 'Save as Draft'}

                </button>

                {/* Submit Review */}

                <button
                  type="submit"
                  disabled={
                    submitting
                  }
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition"
                >

                  {submitting ? (

                    <>
                      <Loader2
                        size={
                          15
                        }
                        className="animate-spin"
                      />

                      Submitting...
                    </>

                  ) : (

                    'Submit Review'

                  )}

                </button>

              </div>

              {/* =================================================
                  SUBMISSION INFORMATION
                  ================================================= */}

              <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center">

                You can save this review as a
                draft at any time. Final
                submission is available only
                during the review month.

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ===================================================
          DELETE SINGLE REVIEW MODAL
          =================================================== */}

      {showDeleteModal && reviewToDelete && (

        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => {
            if (deletingId === null) {
              setShowDeleteModal(false);
              setReviewToDelete(null);
            }
          }}
        >

          <div
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex justify-between items-center mb-3.5">

              <div className="flex items-center gap-2.5">

                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <Trash2 size={18} />
                </div>

                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Delete Review?
                </h2>

              </div>

              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setReviewToDelete(null);
                }}
                disabled={deletingId !== null}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <X size={18} />
              </button>

            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to delete this performance review? This action cannot be undone.
            </p>

            <div className="mt-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg p-3">

              <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {reviewToDelete.employeeName}
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {reviewToDelete.reviewPeriod} · {reviewToDelete.status}
              </div>

            </div>

            <div className="flex justify-end gap-2.5 mt-5">

              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setReviewToDelete(null);
                }}
                disabled={deletingId !== null}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={deletingId !== null}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
              >
                {deletingId !== null ? 'Deleting...' : 'Delete'}
              </button>

            </div>

          </div>

        </div>

      )}

      {/* ===================================================
          CLEAR ALL REVIEWS MODAL
          =================================================== */}

      {showClearModal && (

        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => {
            if (!clearingAll) {
              setShowClearModal(false);
            }
          }}
        >

          <div
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >

            <div className="flex justify-between items-center mb-3.5">

              <div className="flex items-center gap-2.5">

                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <Trash2 size={18} />
                </div>

                <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  Clear All Reviews?
                </h2>

              </div>

              <button
                onClick={() => setShowClearModal(false)}
                disabled={clearingAll}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Close"
              >
                <X size={18} />
              </button>

            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              All performance reviews for every employee will be permanently deleted.
            </p>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1.5 font-semibold">
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2.5 mt-5">

              <button
                onClick={() => setShowClearModal(false)}
                disabled={clearingAll}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleClearAll}
                disabled={clearingAll}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
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

/* =========================================================
   RATING INPUT
   ========================================================= */

function RatingInput({
  label,
  name,
  value,
  onChange,
}) {
  return (
    <div>

      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
        {label} ({value}/5)
      </label>

      <input
        type="range"
        min="1"
        max="5"
        value={value || 3}
        onChange={(e) =>
          onChange(
            name,
            e.target.value
          )
        }
        className="w-full accent-blue-600 dark:accent-blue-500 cursor-pointer"
      />

    </div>
  );
}