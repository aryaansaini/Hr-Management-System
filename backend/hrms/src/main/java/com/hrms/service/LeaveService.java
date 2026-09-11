package com.hrms.service;

import com.hrms.dto.LeaveDTOs;
import com.hrms.entity.Employee;
import com.hrms.entity.LeaveRequest;
import com.hrms.entity.Notification.NotificationType;
import com.hrms.enums.LeaveStatus;
import com.hrms.enums.Role;
import com.hrms.repository.EmployeeRepository;
import com.hrms.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRequestRepository leaveRepo;
    private final EmployeeService employeeService;
    private final LeaveBalanceService leaveBalanceService;
    private final NotificationService notificationService;
    private final EmployeeRepository employeeRepository;

    private void notifyAllAdmins(
            String title,
            String message,
            NotificationType type,
            String entityType,
            Long entityId,
            Long excludeId) {

        employeeRepository.findAll()
                .stream()
                .filter(e -> e.isActive()
                        && (e.getRole() == Role.ADMIN || e.getRole() == Role.HR)
                        && (excludeId == null || !e.getId().equals(excludeId)))
                .forEach(admin -> notificationService.createAndSend(
                        admin,
                        title,
                        message,
                        type,
                        entityType,
                        entityId));
    }

    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public LeaveDTOs.Response applyLeave(
            Long employeeId,
            LeaveDTOs.CreateRequest req) {

        Employee emp = employeeService.findById(employeeId);

        if ("ANNUAL".equalsIgnoreCase(req.getLeaveType())) {
            throw new IllegalArgumentException(
                    "Annual leave cannot be applied for directly. "
                            + "It is automatically tracked from your Sick and Casual leave usage.");
        }

        if (req.getEndDate().isBefore(req.getStartDate())) {
            throw new IllegalArgumentException(
                    "End date must be after start date");
        }

        boolean dateAlreadyUsed = leaveRepo.existsOverlappingLeave(
                emp,
                req.getStartDate(),
                req.getEndDate());

        if (dateAlreadyUsed) {
            throw new IllegalStateException(
                    "You already have a leave request for one or more "
                            + "of the selected dates. "
                            + "You cannot apply for leave for the same date twice.");
        }

        int days = calculateWorkingDays(
                req.getStartDate(),
                req.getEndDate());

        int pendingDays = leaveRepo.sumPendingDaysByEmployeeAndLeaveType(
                emp,
                req.getLeaveType().toUpperCase());

        if (!leaveBalanceService.hasSufficientBalance(
                emp,
                req.getLeaveType().toUpperCase(),
                days + pendingDays)) {

            throw new IllegalStateException(
                    "Insufficient leave balance for "
                            + req.getLeaveType()
                            + ". Requested: "
                            + days
                            + " days, Pending: "
                            + pendingDays
                            + " days.");
        }

        LeaveRequest leave = LeaveRequest.builder()
                .employee(emp)
                .leaveType(req.getLeaveType().toUpperCase())
                .startDate(req.getStartDate())
                .endDate(req.getEndDate())
                .totalDays(days)
                .reason(req.getReason())
                .attachmentUrl(req.getAttachmentUrl())
                .attachmentFileName(req.getAttachmentFileName())
                .status(LeaveStatus.PENDING)
                .build();

        LeaveRequest saved = leaveRepo.save(leave);

        String notifMsg = emp.getFirstName()
                + " "
                + emp.getLastName()
                + " applied for "
                + days
                + " day(s) of "
                + req.getLeaveType()
                + " leave from "
                + req.getStartDate()
                + " to "
                + req.getEndDate()
                + ".";

        notifyAllAdmins(
                "New Leave Request",
                notifMsg,
                NotificationType.LEAVE_APPLIED,
                "LEAVE_REQUEST",
                saved.getId(),
                null);

        return toResponse(saved);
    }

    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public LeaveDTOs.Response action(
            Long leaveId,
            Long reviewerId,
            LeaveDTOs.ActionRequest req) {

        LeaveRequest leave = findByIdForAction(leaveId);

        if (leave.getStatus() != LeaveStatus.PENDING) {
            throw new IllegalStateException(
                    "This request has already been "
                            + leave.getStatus()
                            + (leave.getReviewedBy() != null
                            ? " by "
                            + leave.getReviewedBy()
                            .getFirstName()
                            + " "
                            + leave.getReviewedBy()
                            .getLastName()
                            : "")
                            + ".");
        }

        Employee reviewer = employeeService.findById(reviewerId);

        leave.setReviewedBy(reviewer);
        leave.setRemarks(req.getRemarks());
        leave.setActionAt(LocalDateTime.now());

        if (req.getAction() == LeaveStatus.APPROVED) {
            leave.setStatus(LeaveStatus.APPROVED);

            leaveBalanceService.deductBalance(
                    leave.getEmployee(),
                    leave.getLeaveType(),
                    leave.getTotalDays());

            notificationService.createAndSend(
                    leave.getEmployee(),
                    "Leave Approved",
                    "Your "
                            + leave.getLeaveType()
                            + " leave from "
                            + leave.getStartDate()
                            + " to "
                            + leave.getEndDate()
                            + " has been approved by "
                            + reviewer.getFirstName()
                            + " "
                            + reviewer.getLastName()
                            + ".",
                    NotificationType.LEAVE_APPROVED,
                    "LEAVE_REQUEST",
                    leave.getId());

            notifyAllAdmins(
                    "Leave Approved",
                    leave.getEmployee().getFirstName()
                            + " "
                            + leave.getEmployee().getLastName()
                            + "'s "
                            + leave.getLeaveType()
                            + " leave was approved by "
                            + reviewer.getFirstName()
                            + " "
                            + reviewer.getLastName()
                            + ".",
                    NotificationType.LEAVE_APPROVED,
                    "LEAVE_REQUEST",
                    leave.getId(),
                    reviewerId);

        } else {
            leave.setStatus(LeaveStatus.REJECTED);

            notificationService.createAndSend(
                    leave.getEmployee(),
                    "Leave Rejected",
                    "Your leave request was rejected by "
                            + reviewer.getFirstName()
                            + " "
                            + reviewer.getLastName()
                            + ". Reason: "
                            + req.getRemarks(),
                    NotificationType.LEAVE_REJECTED,
                    "LEAVE_REQUEST",
                    leave.getId());

            notifyAllAdmins(
                    "Leave Rejected",
                    leave.getEmployee().getFirstName()
                            + " "
                            + leave.getEmployee().getLastName()
                            + "'s "
                            + leave.getLeaveType()
                            + " leave was rejected by "
                            + reviewer.getFirstName()
                            + " "
                            + reviewer.getLastName()
                            + ".",
                    NotificationType.LEAVE_REJECTED,
                    "LEAVE_REQUEST",
                    leave.getId(),
                    reviewerId);
        }

        leaveRepo.saveAndFlush(leave);

        LeaveRequest updatedLeave = findByIdWithDetails(leave.getId());

        return toResponse(updatedLeave);
    }

    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public LeaveDTOs.Response requestCancellation(
            Long leaveId,
            Long employeeId,
            LeaveDTOs.CancelRequest req) {

        LeaveRequest leave = findByIdWithDetails(leaveId);
        Employee emp = leave.getEmployee();

        if (!emp.getId().equals(employeeId)) {
            throw new IllegalStateException(
                    "You can only cancel your own leaves");
        }

        if (leave.getStatus() == LeaveStatus.CANCELLED
                || leave.getStatus() == LeaveStatus.REJECTED
                || leave.getStatus() == LeaveStatus.CANCELLATION_PENDING) {

            throw new IllegalStateException(
                    "Leave already " + leave.getStatus());
        }

        if (leave.getStatus() == LeaveStatus.APPROVED) {
            leave.setStatus(LeaveStatus.CANCELLATION_PENDING);
            leave.setCancellationReason(
                    req != null ? req.getReason() : null);
            leave.setCancellationRequestedAt(LocalDateTime.now());

            notificationService.createAndSend(
                    emp,
                    "Cancellation Requested",
                    "Your cancellation request for "
                            + leave.getLeaveType()
                            + " leave is pending confirmation.",
                    NotificationType.LEAVE_CANCELLED,
                    "LEAVE_REQUEST",
                    leave.getId());

            notifyAllAdmins(
                    "Leave Cancellation Request",
                    emp.getFirstName()
                            + " "
                            + emp.getLastName()
                            + " requested cancellation of "
                            + leave.getLeaveType()
                            + " leave ("
                            + leave.getStartDate()
                            + " to "
                            + leave.getEndDate()
                            + ").",
                    NotificationType.LEAVE_CANCELLED,
                    "LEAVE_REQUEST",
                    leave.getId(),
                    null);

        } else {
            leave.setStatus(LeaveStatus.CANCELLED);
            leave.setCancellationReason(
                    req != null ? req.getReason() : null);
            leave.setCancellationRequestedAt(LocalDateTime.now());
            leave.setCancellationActionAt(LocalDateTime.now());

            notificationService.createAndSend(
                    emp,
                    "Leave Cancelled",
                    "Your leave request has been cancelled.",
                    NotificationType.LEAVE_CANCELLED,
                    "LEAVE_REQUEST",
                    leave.getId());

            notifyAllAdmins(
                    "Leave Cancelled",
                    emp.getFirstName()
                            + " "
                            + emp.getLastName()
                            + " cancelled their "
                            + leave.getLeaveType()
                            + " leave request.",
                    NotificationType.LEAVE_CANCELLED,
                    "LEAVE_REQUEST",
                    leave.getId(),
                    null);
        }

        leaveRepo.saveAndFlush(leave);

        LeaveRequest updatedLeave = findByIdWithDetails(leave.getId());

        return toResponse(updatedLeave);
    }

    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public LeaveDTOs.Response cancelAction(
            Long leaveId,
            Long reviewerId,
            LeaveDTOs.CancelActionRequest req) {

        LeaveRequest leave = findByIdWithDetails(leaveId);

        if (leave.getStatus() != LeaveStatus.CANCELLATION_PENDING) {
            throw new IllegalStateException(
                    "This cancellation has already been resolved.");
        }

        Employee reviewer = employeeService.findById(reviewerId);

        leave.setCancellationReviewedBy(reviewer);
        leave.setCancellationRemarks(req.getRemarks());
        leave.setCancellationActionAt(LocalDateTime.now());

        if (Boolean.TRUE.equals(req.getApprove())) {
            leave.setStatus(LeaveStatus.CANCELLED);

            leaveBalanceService.restoreBalance(
                    leave.getEmployee(),
                    leave.getLeaveType(),
                    leave.getTotalDays());

            notificationService.createAndSend(
                    leave.getEmployee(),
                    "Cancellation Confirmed",
                    reviewer.getFirstName()
                            + " confirmed your cancellation. "
                            + leave.getTotalDays()
                            + " day(s) restored to your balance.",
                    NotificationType.LEAVE_CANCELLED,
                    "LEAVE_REQUEST",
                    leave.getId());

        } else {
            leave.setStatus(LeaveStatus.APPROVED);

            notificationService.createAndSend(
                    leave.getEmployee(),
                    "Cancellation Denied",
                    reviewer.getFirstName()
                            + " denied your cancellation request. "
                            + "Reason: "
                            + req.getRemarks(),
                    NotificationType.GENERAL,
                    "LEAVE_REQUEST",
                    leave.getId());
        }

        leaveRepo.saveAndFlush(leave);

        LeaveRequest updatedLeave = findByIdWithDetails(leave.getId());

        return toResponse(updatedLeave);
    }

    @Transactional(readOnly = true)
    public Page<LeaveDTOs.Response> getMyLeaves(
            Long employeeId,
            Pageable pageable) {

        Employee emp = employeeService.findById(employeeId);

        return leaveRepo
                .findByEmployee(emp, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<LeaveDTOs.Response> getAllLeaves(
            Pageable pageable) {

        return leaveRepo
                .findAll(pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    @Cacheable("dashboardData")
    public Page<LeaveDTOs.Response> getPendingLeaves(
            Pageable pageable) {

        return leaveRepo
                .findByStatus(
                        LeaveStatus.PENDING,
                        pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<LeaveDTOs.Response> getPendingCancellations(
            Pageable pageable) {

        return leaveRepo
                .findByStatus(
                        LeaveStatus.CANCELLATION_PENDING,
                        pageable)
                .map(this::toResponse);
    }

    private int calculateWorkingDays(
            LocalDate start,
            LocalDate end) {

        int days = 0;
        LocalDate date = start;

        while (!date.isAfter(end)) {
            if (date.getDayOfWeek() != DayOfWeek.SATURDAY
                    && date.getDayOfWeek() != DayOfWeek.SUNDAY) {
                days++;
            }
            date = date.plusDays(1);
        }

        return days;
    }

    private LeaveRequest findByIdForAction(Long id) {
        return leaveRepo
                .findByIdForAction(id)
                .orElseThrow(() -> new NoSuchElementException(
                        "Leave not found: " + id));
    }

    private LeaveRequest findByIdWithDetails(Long id) {
        return leaveRepo
                .findById(id)
                .orElseThrow(() -> new NoSuchElementException(
                        "Leave not found: " + id));
    }

    private LeaveDTOs.Response toResponse(LeaveRequest l) {

        LeaveDTOs.Response r = new LeaveDTOs.Response();

        r.setId(l.getId());
        r.setEmployeeDbId(l.getEmployee().getId());
        r.setEmployeeName(
                l.getEmployee().getFirstName()
                        + " "
                        + l.getEmployee().getLastName());
        r.setEmployeeCode(l.getEmployee().getEmployeeId());
        r.setLeaveType(l.getLeaveType());
        r.setStartDate(l.getStartDate());
        r.setEndDate(l.getEndDate());
        r.setTotalDays(l.getTotalDays());
        r.setReason(l.getReason());
        r.setAttachmentUrl(l.getAttachmentUrl());
        r.setAttachmentFileName(l.getAttachmentFileName());
        r.setStatus(l.getStatus());

        if (l.getReviewedBy() != null) {
            r.setReviewedByName(
                    l.getReviewedBy().getFirstName()
                            + " "
                            + l.getReviewedBy().getLastName());
        }

        r.setRemarks(l.getRemarks());
        r.setAppliedAt(l.getAppliedAt());
        r.setActionAt(l.getActionAt());
        r.setCancellationReason(l.getCancellationReason());
        r.setCancellationRequestedAt(
                l.getCancellationRequestedAt());
        r.setCancellationRemarks(
                l.getCancellationRemarks());
        r.setCancellationActionAt(
                l.getCancellationActionAt());

        if (l.getCancellationReviewedBy() != null) {
            r.setCancellationReviewedByName(
                    l.getCancellationReviewedBy().getFirstName()
                            + " "
                            + l.getCancellationReviewedBy().getLastName());
        }

        return r;
    }

    /*
     * ============================================================
     * DELETE ONE LEAVE — ADMIN / HR
     * ============================================================
     */
    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public void deleteLeave(Long leaveId) {

        LeaveRequest leave = leaveRepo.findById(leaveId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Leave not found: " + leaveId
                ));

        if (leave.getStatus() == LeaveStatus.APPROVED
                || leave.getStatus() == LeaveStatus.CANCELLATION_PENDING) {

            leaveBalanceService.restoreBalance(
                    leave.getEmployee(),
                    leave.getLeaveType(),
                    leave.getTotalDays()
            );
        }

        leaveRepo.delete(leave);
        leaveRepo.flush();
    }

    /*
     * ============================================================
     * CLEAR ALL LEAVES OF ONE STATUS — ADMIN / HR
     * ============================================================
     */
    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public void clearAllLeaves(LeaveStatus status) {

        List<LeaveRequest> leaves = leaveRepo.findAllByStatus(status);

        if (leaves == null || leaves.isEmpty()) {
            return;
        }

        for (LeaveRequest leave : leaves) {

            if (leave.getStatus() == LeaveStatus.APPROVED
                    || leave.getStatus() == LeaveStatus.CANCELLATION_PENDING) {

                leaveBalanceService.restoreBalance(
                        leave.getEmployee(),
                        leave.getLeaveType(),
                        leave.getTotalDays()
                );
            }
        }

        leaveRepo.deleteAllInBatch(leaves);
        leaveRepo.flush();
    }

    /*
     * ============================================================
     * DELETE ONE LEAVE — EMPLOYEE
     * ============================================================
     */
    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public void deleteMyLeave(Long leaveId, Long employeeId) {

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Employee not found: " + employeeId
                ));

        LeaveRequest leave = leaveRepo.findById(leaveId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Leave request not found: " + leaveId
                ));

        if (leave.getEmployee() == null
                || !leave.getEmployee().getId().equals(employee.getId())) {

            throw new org.springframework.security.access.AccessDeniedException(
                    "You can delete only your own leave requests"
            );
        }

        if (leave.getStatus() == LeaveStatus.APPROVED
                || leave.getStatus() == LeaveStatus.CANCELLATION_PENDING) {

            leaveBalanceService.restoreBalance(
                    leave.getEmployee(),
                    leave.getLeaveType(),
                    leave.getTotalDays()
            );
        }

        leaveRepo.delete(leave);
        leaveRepo.flush();
    }

    /*
     * ============================================================
     * CLEAR ALL LEAVES — EMPLOYEE
     * ============================================================
     */
    @Transactional
    @CacheEvict(value = "dashboardData", allEntries = true)
    public void deleteAllMyLeaves(Long employeeId) {

        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new NoSuchElementException(
                        "Employee not found: " + employeeId
                ));

        List<LeaveRequest> leaves = leaveRepo.findAllByEmployee(employee);

        if (leaves == null || leaves.isEmpty()) {
            return;
        }

        for (LeaveRequest leave : leaves) {

            if (leave.getStatus() == LeaveStatus.APPROVED
                    || leave.getStatus() == LeaveStatus.CANCELLATION_PENDING) {

                leaveBalanceService.restoreBalance(
                        leave.getEmployee(),
                        leave.getLeaveType(),
                        leave.getTotalDays()
                );
            }
        }

        leaveRepo.deleteAllInBatch(leaves);
        leaveRepo.flush();
    }
}