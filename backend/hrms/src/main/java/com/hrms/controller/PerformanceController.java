package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.PerformanceDTOs;
import com.hrms.entity.Employee;
import com.hrms.service.PerformanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/performance")
@RequiredArgsConstructor
@Tag(name = "Performance & Training")
public class PerformanceController {

    private final PerformanceService performanceService;

    /*
     * ============================================================
     * CREATE / SUBMIT PERFORMANCE REVIEW
     * ============================================================
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Create performance review")
    public ResponseEntity<ApiResponse<PerformanceDTOs.Response>> create(
            @AuthenticationPrincipal Employee reviewer,
            @Valid @RequestBody PerformanceDTOs.CreateRequest req) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ApiResponse.success(
                                "Review created",
                                performanceService.createReview(
                                        reviewer.getId(),
                                        req
                                )
                        )
                );
    }

    /*
     * ============================================================
     * SAVE PERFORMANCE REVIEW AS DRAFT
     * ============================================================
     *
     * Frontend:
     *
     * POST /api/performance/draft
     *
     * This allows the admin/HR to save incomplete review details.
     *
     */
    @PostMapping("/draft")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Save performance review as draft")
    public ResponseEntity<ApiResponse<PerformanceDTOs.Response>> saveDraft(
            @AuthenticationPrincipal Employee reviewer,
            @RequestBody PerformanceDTOs.CreateRequest req) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(
                        ApiResponse.success(
                                "Review saved as draft",
                                performanceService.saveDraft(
                                        reviewer.getId(),
                                        req
                                )
                        )
                );
    }

    /*
     * ============================================================
     * UPDATE PERFORMANCE REVIEW / DRAFT
     * ============================================================
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Update performance review")
    public ResponseEntity<ApiResponse<PerformanceDTOs.Response>> update(
            @PathVariable Long id,
            @RequestBody PerformanceDTOs.UpdateRequest req) {

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "Review updated",
                                performanceService.updateReview(
                                        id,
                                        req
                                )
                        )
                );
    }

    /*
     * ============================================================
     * ACKNOWLEDGE REVIEW
     * ============================================================
     */
    @PutMapping("/{id}/acknowledge")
    @Operation(summary = "Employee acknowledges their own review")
    public ResponseEntity<ApiResponse<PerformanceDTOs.Response>> acknowledge(
            @PathVariable Long id,
            @AuthenticationPrincipal Employee emp,
            @RequestBody PerformanceDTOs.AcknowledgeRequest req) {

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "Review acknowledged",
                                performanceService.acknowledge(
                                        id,
                                        emp.getId(),
                                        req
                                )
                        )
                );
    }

    /*
     * ============================================================
     * GET MY REVIEWS
     * ============================================================
     */
    @GetMapping("/my")
    @Operation(summary = "Get my performance reviews")
    public ResponseEntity<ApiResponse<Page<PerformanceDTOs.Response>>> myReviews(
            @AuthenticationPrincipal Employee emp,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "My reviews",
                                performanceService.getMyReviews(
                                        emp.getId(),
                                        PageRequest.of(
                                                page,
                                                size,
                                                Sort.by("createdAt")
                                                        .descending()
                                        )
                                )
                        )
                );
    }

    /*
     * ============================================================
     * GET ALL REVIEWS
     * ============================================================
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get all reviews (Admin/HR)")
    public ResponseEntity<ApiResponse<Page<PerformanceDTOs.Response>>> all(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "All reviews",
                                performanceService.getAllReviews(
                                        PageRequest.of(
                                                page,
                                                size,
                                                Sort.by("createdAt")
                                                        .descending()
                                        )
                                )
                        )
                );
    }

    /*
     * ============================================================
     * GET REVIEW BY ID
     * ============================================================
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get review by ID")
    public ResponseEntity<ApiResponse<PerformanceDTOs.Response>> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal Employee emp) {

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "Review found",
                                performanceService.getById(
                                        id,
                                        emp
                                )
                        )
                );
    }

    /*
     * ============================================================
     * DELETE SINGLE REVIEW
     * ============================================================
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Delete a performance review")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable Long id) {

        performanceService.deleteReview(id);

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "Review deleted",
                                null
                        )
                );
    }

    /*
     * ============================================================
     * DELETE ALL REVIEWS ("Clear All")
     * ============================================================
     */
    @DeleteMapping("/clear-all")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Delete all performance reviews")
    public ResponseEntity<ApiResponse<Void>> clearAll() {

        performanceService.deleteAllReviews();

        return ResponseEntity
                .ok(
                        ApiResponse.success(
                                "All reviews cleared",
                                null
                        )
                );
    }
}