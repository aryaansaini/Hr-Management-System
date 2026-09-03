package com.hrms.service;

import com.hrms.dto.PerformanceDTOs;
import com.hrms.entity.Employee;
import com.hrms.entity.Notification.NotificationType;
import com.hrms.entity.PerformanceReview;
import com.hrms.entity.PerformanceReview.ReviewStatus;
import com.hrms.repository.PerformanceReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class PerformanceService {

    private final PerformanceReviewRepository reviewRepo;
    private final EmployeeService employeeService;
    private final NotificationService notificationService;

    /*
     * ============================================================
     * CREATE / SUBMIT PERFORMANCE REVIEW
     * ============================================================
     *
     * This method creates a final SUBMITTED review.
     *
     * The frontend should call this when the admin clicks
     * "Submit Review".
     */
    @Transactional
    public PerformanceDTOs.Response createReview(
            Long reviewerId,
            PerformanceDTOs.CreateRequest req) {

        Employee employee = employeeService
                .findById(req.getEmployeeId());

        Employee reviewer = employeeService
                .findById(reviewerId);

        double overall = average(
                req.getTechnicalSkills(),
                req.getCommunication(),
                req.getTeamwork(),
                req.getProductivity(),
                req.getLeadership()
        );

        PerformanceReview review = PerformanceReview.builder()
                .employee(employee)
                .reviewer(reviewer)
                .reviewPeriod(req.getReviewPeriod())
                .reviewDate(req.getReviewDate())
                .technicalSkills(req.getTechnicalSkills())
                .communication(req.getCommunication())
                .teamwork(req.getTeamwork())
                .productivity(req.getProductivity())
                .leadership(req.getLeadership())
                .overallRating(overall)
                .strengths(req.getStrengths())
                .improvements(req.getImprovements())
                .goals(req.getGoals())
                .status(ReviewStatus.SUBMITTED)
                .build();

        PerformanceReview saved =
                reviewRepo.save(review);

        /*
         * Notify employee only when the review is actually
         * submitted.
         *
         * Drafts should NOT send this notification.
         */
        notificationService.createAndSend(
                employee,
                "Performance Review Created",
                "Your performance review for "
                        + req.getReviewPeriod()
                        + " has been created. "
                        + "Please review and acknowledge.",
                NotificationType.PERFORMANCE_REVIEWED,
                "PERFORMANCE",
                saved.getId()
        );

        return toResponse(saved);
    }

    /*
     * ============================================================
     * SAVE PERFORMANCE REVIEW AS DRAFT
     * ============================================================
     *
     * This is the method that was missing.
     *
     * Endpoint:
     *
     * POST /api/performance/draft
     *
     * Draft can be saved before the actual review month.
     *
     * Example:
     *
     * August:
     *     Save Q3 review as DRAFT
     *
     * September:
     *     Open DRAFT
     *     Complete details
     *     Submit Review
     */
    @Transactional
    public PerformanceDTOs.Response saveDraft(
            Long reviewerId,
            PerformanceDTOs.CreateRequest req) {

        /*
         * Employee is required for a performance review.
         */
        if (req.getEmployeeId() == null) {
            throw new IllegalArgumentException(
                    "Employee is required to save a performance review draft"
            );
        }

        Employee employee = employeeService
                .findById(req.getEmployeeId());

        Employee reviewer = employeeService
                .findById(reviewerId);

        /*
         * Calculate the current overall rating from
         * whatever ratings have currently been entered.
         */
        double overall = average(
                req.getTechnicalSkills(),
                req.getCommunication(),
                req.getTeamwork(),
                req.getProductivity(),
                req.getLeadership()
        );

        PerformanceReview review =
                PerformanceReview.builder()
                        .employee(employee)
                        .reviewer(reviewer)
                        .reviewPeriod(req.getReviewPeriod())
                        .reviewDate(req.getReviewDate())
                        .technicalSkills(
                                req.getTechnicalSkills()
                        )
                        .communication(
                                req.getCommunication()
                        )
                        .teamwork(
                                req.getTeamwork()
                        )
                        .productivity(
                                req.getProductivity()
                        )
                        .leadership(
                                req.getLeadership()
                        )
                        .overallRating(overall)
                        .strengths(
                                req.getStrengths()
                        )
                        .improvements(
                                req.getImprovements()
                        )
                        .goals(
                                req.getGoals()
                        )

                        /*
                         * IMPORTANT:
                         * Save it as DRAFT.
                         */
                        .status(ReviewStatus.DRAFT)

                        .build();

        PerformanceReview saved =
                reviewRepo.save(review);

        /*
         * Do NOT send employee notification here.
         *
         * Notification should happen only after
         * the review is submitted.
         */

        return toResponse(saved);
    }

    /*
     * ============================================================
     * UPDATE PERFORMANCE REVIEW / DRAFT
     * ============================================================
     */
    @Transactional
    public PerformanceDTOs.Response updateReview(
            Long reviewId,
            PerformanceDTOs.UpdateRequest req) {

        PerformanceReview review =
                findById(reviewId);

        if (req.getTechnicalSkills() != null) {
            review.setTechnicalSkills(
                    req.getTechnicalSkills()
            );
        }

        if (req.getCommunication() != null) {
            review.setCommunication(
                    req.getCommunication()
            );
        }

        if (req.getTeamwork() != null) {
            review.setTeamwork(
                    req.getTeamwork()
            );
        }

        if (req.getProductivity() != null) {
            review.setProductivity(
                    req.getProductivity()
            );
        }

        if (req.getLeadership() != null) {
            review.setLeadership(
                    req.getLeadership()
            );
        }

        if (req.getStrengths() != null) {
            review.setStrengths(
                    req.getStrengths()
            );
        }

        if (req.getImprovements() != null) {
            review.setImprovements(
                    req.getImprovements()
            );
        }

        if (req.getGoals() != null) {
            review.setGoals(
                    req.getGoals()
            );
        }

        /*
         * If frontend sends a status, update it.
         *
         * This allows:
         *
         * DRAFT -> DRAFT
         * DRAFT -> SUBMITTED
         */
        if (req.getStatus() != null) {
            review.setStatus(
                    req.getStatus()
            );
        }

        /*
         * Recalculate overall rating.
         */
        review.setOverallRating(
                average(
                        review.getTechnicalSkills(),
                        review.getCommunication(),
                        review.getTeamwork(),
                        review.getProductivity(),
                        review.getLeadership()
                )
        );

        PerformanceReview saved =
                reviewRepo.save(review);

        /*
         * Send notification only when the draft becomes
         * SUBMITTED.
         */
        if (saved.getStatus() ==
                ReviewStatus.SUBMITTED) {

            notificationService.createAndSend(
                    saved.getEmployee(),
                    "Performance Review Created",
                    "Your performance review for "
                            + saved.getReviewPeriod()
                            + " has been submitted. "
                            + "Please review and acknowledge.",
                    NotificationType.PERFORMANCE_REVIEWED,
                    "PERFORMANCE",
                    saved.getId()
            );
        }

        return toResponse(saved);
    }

    /*
     * ============================================================
     * ACKNOWLEDGE REVIEW
     * ============================================================
     */
    @Transactional
    public PerformanceDTOs.Response acknowledge(
            Long reviewId,
            Long employeeId,
            PerformanceDTOs.AcknowledgeRequest req) {

        PerformanceReview review =
                findById(reviewId);

        /*
         * Employee can acknowledge only their own review.
         */
        if (!review.getEmployee()
                .getId()
                .equals(employeeId)) {

            throw new IllegalStateException(
                    "You can only acknowledge your own review"
            );
        }

        review.setEmployeeComments(
                req.getEmployeeComments()
        );

        review.setStatus(
                ReviewStatus.ACKNOWLEDGED
        );

        PerformanceReview saved =
                reviewRepo.save(review);

        /*
         * Notify all admins / HR.
         */
        notificationService.notifyAllAdmins(
                "Performance Review Acknowledged",

                review.getEmployee().getFirstName()
                        + " "
                        + review.getEmployee().getLastName()
                        + " acknowledged their performance review for "
                        + review.getReviewPeriod()
                        + ". Overall Rating: "
                        + review.getOverallRating()
                        + "/5.",

                NotificationType.PERFORMANCE_REVIEWED,
                "PERFORMANCE",
                saved.getId()
        );

        return toResponse(saved);
    }

    /*
     * ============================================================
     * GET MY REVIEWS
     * ============================================================
     */
    @Transactional(readOnly = true)
    public Page<PerformanceDTOs.Response> getMyReviews(
            Long employeeId,
            Pageable pageable) {

        Employee emp =
                employeeService.findById(employeeId);

        return reviewRepo
                .findByEmployee(emp, pageable)
                .map(this::toResponse);
    }

    /*
     * ============================================================
     * GET ALL REVIEWS
     * ============================================================
     */
    @Transactional(readOnly = true)
    public Page<PerformanceDTOs.Response> getAllReviews(
            Pageable pageable) {

        return reviewRepo
                .findAll(pageable)
                .map(this::toResponse);
    }

    /*
     * ============================================================
     * GET REVIEW BY ID
     * ============================================================
     */
    @Transactional(readOnly = true)
    public PerformanceDTOs.Response getById(
            Long id,
            Employee emp) {

        PerformanceReview review =
                findById(id);

        /*
         * Employees can view only their own reviews.
         *
         * Admin / HR / reviewer access remains allowed
         * according to the existing application security.
         */
        if (emp.getRole() ==
                com.hrms.enums.Role.EMPLOYEE
                &&
                !review.getEmployee()
                        .getId()
                        .equals(emp.getId())
                &&
                !review.getReviewer()
                        .getId()
                        .equals(emp.getId())) {

            throw new org.springframework.security.access.AccessDeniedException(
                    "You are not authorized to view this review."
            );
        }

        return toResponse(review);
    }

    /*
     * ============================================================
     * DELETE SINGLE REVIEW
     * ============================================================
     */
    @Transactional
    public void deleteReview(Long id) {
        if (!reviewRepo.existsById(id)) {
            throw new NoSuchElementException("Review not found: " + id);
        }
        reviewRepo.deleteById(id);
    }

    /*
     * ============================================================
     * DELETE ALL REVIEWS (Admin/HR "Clear All")
     * ============================================================
     */
    @Transactional
    public void deleteAllReviews() {
        reviewRepo.deleteAll();
    }

    /*
     * ============================================================
     * FIND REVIEW
     * ============================================================
     */
    private PerformanceReview findById(
            Long id) {

        return reviewRepo
                .findById(id)
                .orElseThrow(
                        () -> new NoSuchElementException(
                                "Review not found: " + id
                        )
                );
    }

    /*
     * ============================================================
     * CALCULATE AVERAGE
     * ============================================================
     */
    private double average(
            int... values) {

        double sum = 0;

        for (int value : values) {
            sum += value;
        }

        return Math.round(
                (sum / values.length) * 10.0
        ) / 10.0;
    }

    /*
     * ============================================================
     * CONVERT ENTITY -> RESPONSE DTO
     * ============================================================
     */
    private PerformanceDTOs.Response toResponse(
            PerformanceReview r) {

        PerformanceDTOs.Response res =
                new PerformanceDTOs.Response();

        res.setId(
                r.getId()
        );

        res.setEmployeeId(
                r.getEmployee().getId()
        );

        res.setEmployeeName(
                r.getEmployee().getFirstName()
                        + " "
                        + r.getEmployee().getLastName()
        );

        res.setEmployeeCode(
                r.getEmployee().getEmployeeId()
        );

        res.setReviewerName(
                r.getReviewer().getFirstName()
                        + " "
                        + r.getReviewer().getLastName()
        );

        res.setReviewPeriod(
                r.getReviewPeriod()
        );

        res.setReviewDate(
                r.getReviewDate()
        );

        res.setTechnicalSkills(
                r.getTechnicalSkills()
        );

        res.setCommunication(
                r.getCommunication()
        );

        res.setTeamwork(
                r.getTeamwork()
        );

        res.setProductivity(
                r.getProductivity()
        );

        res.setLeadership(
                r.getLeadership()
        );

        res.setOverallRating(
                r.getOverallRating()
        );

        res.setStatus(
                r.getStatus()
        );

        res.setStrengths(
                r.getStrengths()
        );

        res.setImprovements(
                r.getImprovements()
        );

        res.setGoals(
                r.getGoals()
        );

        res.setEmployeeComments(
                r.getEmployeeComments()
        );

        res.setCreatedAt(
                r.getCreatedAt()
        );

        return res;
    }
}