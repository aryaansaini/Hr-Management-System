package com.hrms.controller;

import com.hrms.dto.ApiResponse;
import com.hrms.dto.AttendanceDTOs;
import com.hrms.entity.Employee;
import com.hrms.service.AttendanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@Tag(name = "Attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    // ===== EMPLOYEE ENDPOINTS =====

    @PostMapping("/check-in")
    @Operation(summary = "Check in")
    public ResponseEntity<ApiResponse<AttendanceDTOs.Response>> checkIn(
            @AuthenticationPrincipal Employee emp,
            @RequestBody(required = false) AttendanceDTOs.CheckInRequest req) {
        if (req == null)
            req = new AttendanceDTOs.CheckInRequest();
        return ResponseEntity.ok(ApiResponse.success("Checked in", attendanceService.checkIn(emp.getId(), req)));
    }

    @PostMapping("/check-out")
    @Operation(summary = "Check out (optionally add remarks)")
    public ResponseEntity<ApiResponse<AttendanceDTOs.Response>> checkOut(
            @AuthenticationPrincipal Employee emp,
            @RequestBody(required = false) AttendanceDTOs.CheckOutRequest req) {
        if (req == null)
            req = new AttendanceDTOs.CheckOutRequest();
        return ResponseEntity.ok(ApiResponse.success("Checked out", attendanceService.checkOut(emp.getId(), req)));
    }

    @PostMapping("/break-start")
    @Operation(summary = "Start a break")
    public ResponseEntity<ApiResponse<AttendanceDTOs.Response>> breakStart(
            @AuthenticationPrincipal Employee emp,
            @RequestBody(required = false) AttendanceDTOs.BreakStartRequest req) {
        return ResponseEntity
                .ok(ApiResponse.success("Break started", attendanceService.breakStart(emp.getId(), req)));
    }

    @PostMapping("/break-end")
    @Operation(summary = "End the current break")
    public ResponseEntity<ApiResponse<AttendanceDTOs.Response>> breakEnd(
            @AuthenticationPrincipal Employee emp,
            @RequestBody(required = false) AttendanceDTOs.BreakEndRequest req) {
        return ResponseEntity.ok(ApiResponse.success("Break ended", attendanceService.breakEnd(emp.getId(), req)));
    }

    @GetMapping("/my")
    @Operation(summary = "Get my attendance records")
    public ResponseEntity<ApiResponse<Page<AttendanceDTOs.Response>>> my(
            @AuthenticationPrincipal Employee emp,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return ResponseEntity.ok(ApiResponse.success("Attendance records",
                attendanceService.getMyAttendance(emp.getId(),
                        PageRequest.of(page, size, Sort.by("date").descending()))));
    }

   
    @DeleteMapping("/{attendanceId}")
@Operation(summary = "Delete my attendance record")
public ResponseEntity<ApiResponse<Void>> deleteMyAttendance(
        @AuthenticationPrincipal Employee emp,
        @PathVariable Long attendanceId) {

    attendanceService.deleteMyAttendance(emp.getId(), attendanceId);

    return ResponseEntity.ok(
            ApiResponse.success("Attendance record deleted", null)
    );
}
@DeleteMapping("/my/clear-all")
@Operation(summary = "Clear all my attendance records")
public ResponseEntity<ApiResponse<Void>> clearMyAttendance(
        @AuthenticationPrincipal Employee emp) {

    attendanceService.clearMyAttendance(emp.getId());

    return ResponseEntity.ok(
            ApiResponse.success("All attendance records cleared", null)
    );
}
 @GetMapping("/my/detailed-report")
    @Operation(summary = "Get my detailed attendance report (yesterday, weekly, monthly)")
    public ResponseEntity<ApiResponse<AttendanceDTOs.EmployeeDetailedReport>> getMyDetailedReport(
            @AuthenticationPrincipal Employee emp,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
        if (asOfDate == null) {
            java.time.ZoneId istZone = java.time.ZoneId.of("Asia/Kolkata");
            asOfDate = LocalDate.now(istZone);
        }
        return ResponseEntity.ok(ApiResponse.success("Detailed attendance report",
                attendanceService.getEmployeeDetailedReport(emp.getId(), asOfDate)));
    }

    // ===== ADMIN ENDPOINTS =====

    @GetMapping("/date/{date}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get all attendance by date (Admin/HR)")
    public ResponseEntity<ApiResponse<Page<AttendanceDTOs.Response>>> byDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success("Attendance for " + date,
                attendanceService.getAttendanceByDate(date, PageRequest.of(page, size))));
    }

    @GetMapping("/admin/summary/{date}")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get all employees attendance summary for a date (Admin/HR)")
    public ResponseEntity<ApiResponse<Page<AttendanceDTOs.EmployeeAttendanceSummary>>> getAttendanceSummaryByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(ApiResponse.success("Attendance summary for " + date,
                attendanceService.getAllEmployeesSummaryByDate(date, PageRequest.of(page, size))));
    }

    @GetMapping("/admin/employee/{employeeId}/summary")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get employee attendance summary for a date (Admin/HR)")
    public ResponseEntity<ApiResponse<AttendanceDTOs.EmployeeAttendanceSummary>> getEmployeeAttendanceSummary(
            @PathVariable Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        if (date == null) {
            java.time.ZoneId istZone = java.time.ZoneId.of("Asia/Kolkata");
            date = LocalDate.now(istZone);
        }
        return ResponseEntity.ok(ApiResponse.success("Employee attendance summary",
                attendanceService.getEmployeeAttendanceSummary(employeeId, date)));
    }

    @GetMapping("/admin/employee/{employeeId}/detailed-report")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Get detailed attendance report for employee (yesterday, weekly, monthly) - Admin/HR only")
    public ResponseEntity<ApiResponse<AttendanceDTOs.EmployeeDetailedReport>> getEmployeeDetailedReportAdmin(
            @PathVariable Long employeeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate asOfDate) {
        if (asOfDate == null) {
            java.time.ZoneId istZone = java.time.ZoneId.of("Asia/Kolkata");
            asOfDate = LocalDate.now(istZone);
        }
        return ResponseEntity.ok(ApiResponse.success("Detailed attendance report",
                attendanceService.getEmployeeDetailedReport(employeeId, asOfDate)));
    }

    // ===== EXPORT ENDPOINTS =====

    @GetMapping("/admin/export")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Export attendance for all employees over a date range as Excel (Admin/HR)")
    public ResponseEntity<byte[]> exportAttendance(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        byte[] file = attendanceService.exportAttendanceRange(from, to, status, search);
        String filename = "attendance_" + from + "_to_" + to + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(
                        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(file);
    }

    @GetMapping("/admin/employee/{employeeId}/export")
    @PreAuthorize("hasAnyRole('ADMIN','HR')")
    @Operation(summary = "Export one employee's attendance over a date range as Excel (Admin/HR)")
    public ResponseEntity<byte[]> exportEmployeeAttendance(
            @PathVariable Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        byte[] file = attendanceService.exportEmployeeAttendanceRange(employeeId, from, to);
        String filename = "attendance_emp" + employeeId + "_" + from + "_to_" + to + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(
                        MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(file);
    }
}