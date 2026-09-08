package com.hrms.service;

import com.hrms.dto.AttendanceDTOs;
import com.hrms.entity.Attendance;
import com.hrms.entity.AttendanceBreak;
import com.hrms.entity.Employee;
import com.hrms.enums.AttendanceStatus;
import com.hrms.enums.BreakType;
import com.hrms.repository.AttendanceBreakRepository;
import com.hrms.repository.AttendanceRepository;
import com.hrms.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepo;
    private final AttendanceBreakRepository attendanceBreakRepo;
    private final EmployeeService employeeService;
    private final EmployeeRepository employeeRepo;

    private static final LocalTime LATE_THRESHOLD = LocalTime.of(9, 15);
    private static final int FLAG_BREAK_MINUTES = 60;

    @Transactional
    public AttendanceDTOs.Response checkIn(Long employeeId, AttendanceDTOs.CheckInRequest req) {
        Employee emp = employeeService.findById(employeeId);
        ZoneId istZone = ZoneId.of("Asia/Kolkata");
        LocalDate date = (req != null && req.getDate() != null) ? req.getDate() : LocalDate.now(istZone);

        if (attendanceRepo.findByEmployeeAndDate(emp, date).isPresent()) {
            throw new IllegalStateException("Already checked in for " + date);
        }

        LocalTime checkIn = (req != null && req.getCheckIn() != null) ? req.getCheckIn()
                : LocalTime.now(istZone).withNano(0);

        Attendance att = Attendance.builder()
                .employee(emp)
                .date(date)
                .checkIn(checkIn)
                .status(AttendanceStatus.PRESENT)
                .build();

        return toResponse(attendanceRepo.save(att));
    }

    @Transactional
    public AttendanceDTOs.Response checkOut(Long employeeId, AttendanceDTOs.CheckOutRequest req) {
        Employee emp = employeeService.findById(employeeId);
        ZoneId istZone = ZoneId.of("Asia/Kolkata");
        LocalDate today = LocalDate.now(istZone);

        Attendance att = attendanceRepo.findByEmployeeAndDate(emp, today)
                .or(() -> attendanceRepo.findFirstByEmployeeAndCheckOutIsNullOrderByDateDesc(emp))
                .orElseThrow(() -> new com.hrms.exception.AttendanceRecordNotFound());

        LocalTime checkOut = (req != null && req.getCheckOut() != null) ? req.getCheckOut()
                : LocalTime.now(istZone).withNano(0);
        att.setCheckOut(checkOut);

        // If a break is still open, close it automatically at checkout time.
        attendanceBreakRepo.findFirstByAttendanceAndBreakEndIsNull(att).ifPresent(openBreak -> {
            closeBreak(openBreak, checkOut);
            attendanceBreakRepo.save(openBreak);
        });
        recalculateTotalBreakMinutes(att);

        double grossHours = att.getCheckIn().until(checkOut, ChronoUnit.MINUTES) / 60.0;
        if (grossHours < 0) {
            grossHours += 24.0;
        }
        double breakHours = (att.getTotalBreakMinutes() != null ? att.getTotalBreakMinutes() : 0) / 60.0;
        double netHours = Math.max(0, grossHours - breakHours);
        att.setWorkHours(Math.round(netHours * 100.0) / 100.0);

        if (netHours < 4)
            att.setStatus(AttendanceStatus.ABSENT);
        else if (netHours < 8)
            att.setStatus(AttendanceStatus.HALF_DAY);
        else
            att.setStatus(AttendanceStatus.PRESENT);

        if (req != null && req.getRemarks() != null && !req.getRemarks().isBlank()) {
            att.setRemarks(req.getRemarks());
        }

        return toResponse(attendanceRepo.save(att));
    }

    @Transactional
    public AttendanceDTOs.Response breakStart(Long employeeId, AttendanceDTOs.BreakStartRequest req) {
        Employee emp = employeeService.findById(employeeId);
        ZoneId istZone = ZoneId.of("Asia/Kolkata");
        LocalDate today = LocalDate.now(istZone);

        Attendance att = attendanceRepo.findByEmployeeAndDate(emp, today)
                .orElseThrow(() -> new IllegalStateException("Check in before starting a break"));

        if (att.getCheckOut() != null) {
            throw new IllegalStateException("Already checked out for today");
        }
        if (attendanceBreakRepo.findFirstByAttendanceAndBreakEndIsNull(att).isPresent()) {
            throw new IllegalStateException("A break is already in progress");
        }

        LocalTime start = (req != null && req.getBreakStart() != null) ? req.getBreakStart()
                : LocalTime.now(istZone).withNano(0);

        AttendanceBreak brk = AttendanceBreak.builder()
                .attendance(att)
                .breakType(req != null && req.getBreakType() != null ? req.getBreakType() : BreakType.GENERAL)
                .breakStart(start)
                .build();

        attendanceBreakRepo.save(brk);
        return toResponse(att);
    }

    @Transactional
    public AttendanceDTOs.Response breakEnd(Long employeeId, AttendanceDTOs.BreakEndRequest req) {
        Employee emp = employeeService.findById(employeeId);
        ZoneId istZone = ZoneId.of("Asia/Kolkata");
        LocalDate today = LocalDate.now(istZone);

        Attendance att = attendanceRepo.findByEmployeeAndDate(emp, today)
                .orElseThrow(() -> new IllegalStateException("No attendance record for today"));

        AttendanceBreak brk = attendanceBreakRepo.findFirstByAttendanceAndBreakEndIsNull(att)
                .orElseThrow(() -> new IllegalStateException("No break in progress"));

        LocalTime end = (req != null && req.getBreakEnd() != null) ? req.getBreakEnd()
                : LocalTime.now(istZone).withNano(0);

        closeBreak(brk, end);
        attendanceBreakRepo.save(brk);

        recalculateTotalBreakMinutes(att);
        attendanceRepo.save(att);

        return toResponse(att);
    }

    private void closeBreak(AttendanceBreak brk, LocalTime end) {
        brk.setBreakEnd(end);
        int minutes = (int) brk.getBreakStart().until(end, ChronoUnit.MINUTES);
        if (minutes < 0) {
            minutes += 24 * 60;
        }
        brk.setDurationMinutes(minutes);
        brk.setFlagged(minutes > FLAG_BREAK_MINUTES);
    }

    private void recalculateTotalBreakMinutes(Attendance att) {
        List<AttendanceBreak> breaks = attendanceBreakRepo.findByAttendanceOrderByBreakStartAsc(att);
        int totalUnpaid = breaks.stream()
                .filter(b -> b.getDurationMinutes() != null && !b.isPaid())
                .mapToInt(AttendanceBreak::getDurationMinutes)
                .sum();
        att.setTotalBreakMinutes(totalUnpaid);
    }

    @Transactional(readOnly = true)
    public Page<AttendanceDTOs.Response> getMyAttendance(Long employeeId, Pageable pageable) {
        Employee emp = employeeService.findById(employeeId);
        return attendanceRepo.findByEmployee(emp, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<AttendanceDTOs.Response> getAttendanceByDate(LocalDate date, Pageable pageable) {
        return attendanceRepo.findByDate(date, pageable).map(this::toResponse);
    }
    @Transactional
public void deleteMyAttendance(Long employeeId, Long attendanceId) {
    Employee emp = employeeService.findById(employeeId);

    Attendance attendance = attendanceRepo.findById(attendanceId)
            .orElseThrow(() -> new IllegalStateException("Attendance record not found"));

    // Employee can delete only their own attendance record
    if (!attendance.getEmployee().getId().equals(emp.getId())) {
        throw new IllegalStateException(
                "You are not allowed to delete this attendance record"
        );
    }

    attendanceRepo.delete(attendance);
}
@Transactional
public void clearMyAttendance(Long employeeId) {
    Employee emp = employeeService.findById(employeeId);

    List<Attendance> attendanceRecords =
            attendanceRepo.findByEmployee(emp);

    attendanceRepo.deleteAll(attendanceRecords);
}

    @Transactional(readOnly = true)
    public AttendanceDTOs.EmployeeDetailedReport getEmployeeDetailedReport(Long employeeId, LocalDate asOfDate) {
        Employee emp = employeeService.findById(employeeId);

        LocalDate yesterday = asOfDate.minusDays(1);
        Attendance yesterdayRecord = attendanceRepo.findByEmployeeAndDate(emp, yesterday).orElse(null);

        LocalDate weekStart = asOfDate.minusDays(6);
        List<Attendance> weekRecords = attendanceRepo.findByEmployeeAndDateRangeOrderByDate(emp, weekStart, asOfDate);

        YearMonth yearMonth = YearMonth.from(asOfDate);
        LocalDate monthStart = yearMonth.atDay(1);
        LocalDate monthEnd = yearMonth.atEndOfMonth();
        List<Attendance> monthRecords = attendanceRepo.findByEmployeeAndDateRangeOrderByDate(emp, monthStart, monthEnd);

        List<AttendanceDTOs.DailyRecord> weeklyRecords = buildDailyRecords(weekStart, asOfDate, weekRecords);
        AttendanceDTOs.WeeklyStats weeklyStats = calculateWeeklyStats(weekRecords);

        List<AttendanceDTOs.DailyRecord> monthlyRecords = buildDailyRecords(monthStart, monthEnd, monthRecords);
        AttendanceDTOs.MonthlyStats monthlyStats = calculateMonthlyStats(monthRecords, monthStart, monthEnd);

        return new AttendanceDTOs.EmployeeDetailedReport(
                emp.getId(),
                emp.getEmployeeId(),
                emp.getFirstName() + " " + emp.getLastName(),
                emp.getDepartment() != null ? emp.getDepartment() : "N/A",
                yesterday,
                yesterdayRecord != null ? yesterdayRecord.getStatus().name() : "ABSENT",
                yesterdayRecord != null ? yesterdayRecord.getCheckIn() : null,
                yesterdayRecord != null ? yesterdayRecord.getCheckOut() : null,
                yesterdayRecord != null ? yesterdayRecord.getWorkHours() : 0.0,
                yesterdayRecord != null ? yesterdayRecord.getRemarks() : null,
                weeklyRecords,
                weeklyStats,
                monthlyRecords,
                monthlyStats);
    }

    @Transactional(readOnly = true)
    public AttendanceDTOs.EmployeeAttendanceSummary getEmployeeAttendanceSummary(Long employeeId, LocalDate date) {
        Employee emp = employeeService.findById(employeeId);
        Attendance att = attendanceRepo.findByEmployeeAndDate(emp, date).orElse(null);

        AttendanceDTOs.EmployeeAttendanceSummary summary = new AttendanceDTOs.EmployeeAttendanceSummary();
        summary.setEmployeeId(emp.getId());
        summary.setEmployeeCode(emp.getEmployeeId());
        summary.setEmployeeName(emp.getFirstName() + " " + emp.getLastName());
        summary.setDepartmentName(emp.getDepartment() != null ? emp.getDepartment() : "N/A");

        if (att != null) {
            summary.setStatus(att.getStatus().name());
            summary.setCheckIn(att.getCheckIn());
            summary.setCheckOut(att.getCheckOut());
            summary.setWorkHours(att.getWorkHours());
            summary.setTotalBreakMinutes(att.getTotalBreakMinutes());
            summary.setBreaks(att.getBreaks().stream()
                    .map(this::toBreakResponse).collect(Collectors.toList()));
            summary.setOnBreak(att.getBreaks().stream().anyMatch(b -> b.getBreakEnd() == null));
        } else {
            summary.setStatus("ABSENT");
            summary.setWorkHours(0.0);
        }

        return summary;
    }

    @Transactional(readOnly = true)
    public Page<AttendanceDTOs.EmployeeAttendanceSummary> getAllEmployeesSummaryByDate(LocalDate date,
            Pageable pageable) {
        return attendanceRepo.findByDate(date, pageable)
                .map(att -> {
                    AttendanceDTOs.EmployeeAttendanceSummary summary = new AttendanceDTOs.EmployeeAttendanceSummary();
                    summary.setEmployeeId(att.getEmployee().getId());
                    summary.setEmployeeCode(att.getEmployee().getEmployeeId());
                    summary.setEmployeeName(att.getEmployee().getFirstName() + " " + att.getEmployee().getLastName());
                    summary.setDepartmentName(
                            att.getEmployee().getDepartment() != null ? att.getEmployee().getDepartment() : "N/A");
                    summary.setStatus(att.getStatus().name());
                    summary.setCheckIn(att.getCheckIn());
                    summary.setCheckOut(att.getCheckOut());
                    summary.setWorkHours(att.getWorkHours());
                    summary.setTotalBreakMinutes(att.getTotalBreakMinutes());
                    summary.setOnBreak(attendanceBreakRepo.findFirstByAttendanceAndBreakEndIsNull(att).isPresent());
                    summary.setTotalBreakMinutes(att.getTotalBreakMinutes());
                    summary.setBreaks(att.getBreaks().stream()
                            .map(this::toBreakResponse).collect(Collectors.toList()));
                    summary.setOnBreak(att.getBreaks().stream().anyMatch(b -> b.getBreakEnd() == null));
                    return summary;
                });
    }

    // ===== EXPORT: all employees, date range =====
    @Transactional(readOnly = true)
    public byte[] exportAttendanceRange(LocalDate from, LocalDate to, String status, String search) {
        List<Employee> employees = employeeRepo.findByActiveTrue();

        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            employees = employees.stream()
                    .filter(e -> (e.getFirstName() + " " + e.getLastName()).toLowerCase().contains(q)
                            || e.getEmployeeId().toLowerCase().contains(q))
                    .collect(Collectors.toList());
        }

        List<Map.Entry<Employee, Map<LocalDate, Attendance>>> exportData = new ArrayList<>();
        for (Employee emp : employees) {
            List<Attendance> records = attendanceRepo.findByEmployeeAndDateRangeOrderByDate(emp, from, to);
            Map<LocalDate, Attendance> recordMap = records.stream()
                    .collect(Collectors.toMap(Attendance::getDate, a -> a));

            if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
                boolean matches = recordMap.values().stream()
                        .anyMatch(a -> a.getStatus().name().equalsIgnoreCase(status));
                if (!matches)
                    continue;
            }

            exportData.add(Map.entry(emp, recordMap));
        }

        return buildAttendanceWorkbook(exportData, from, to);
    }


    // ===== EXPORT: single employee, date range =====
    @Transactional(readOnly = true)
    public byte[] exportEmployeeAttendanceRange(Long employeeId, LocalDate from, LocalDate to) {
        Employee emp = employeeService.findById(employeeId);
        List<Attendance> records = attendanceRepo.findByEmployeeAndDateRangeOrderByDate(emp, from, to);
        Map<LocalDate, Attendance> recordMap = records.stream()
                .collect(Collectors.toMap(Attendance::getDate, a -> a));
        return buildAttendanceWorkbook(List.of(Map.entry(emp, recordMap)), from, to);
    }

    private byte[] buildAttendanceWorkbook(List<Map.Entry<Employee, Map<LocalDate, Attendance>>> data,
            LocalDate from, LocalDate to) {
        try (XSSFWorkbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Attendance");

            CellStyle headerStyle = wb.createCellStyle();
            Font headerFont = wb.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_80_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            Map<AttendanceStatus, CellStyle> statusStyles = new java.util.HashMap<>();
            statusStyles.put(AttendanceStatus.PRESENT, coloredStyle(wb, IndexedColors.LIGHT_GREEN));
            statusStyles.put(AttendanceStatus.HALF_DAY, coloredStyle(wb, IndexedColors.LIGHT_ORANGE));
            statusStyles.put(AttendanceStatus.ABSENT, coloredStyle(wb, IndexedColors.ROSE));
            statusStyles.put(AttendanceStatus.ON_LEAVE, coloredStyle(wb, IndexedColors.PALE_BLUE));
            CellStyle weekendStyle = coloredStyle(wb, IndexedColors.GREY_25_PERCENT);

            List<LocalDate> days = new ArrayList<>();
            for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1))
                days.add(d);

            List<String> headers = new ArrayList<>(
                    List.of("Name", "Employee ID", "Department", "Role", "Employment status"));
            for (LocalDate d : days)
                headers.add(d.toString());
            headers.addAll(List.of("Total hours", "Total break (min)", "Present", "Half day", "Absent", "Leave",
                    "Late arrivals"));

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.size(); i++) {
                Cell c = headerRow.createCell(i);
                c.setCellValue(headers.get(i));
                c.setCellStyle(headerStyle);
            }

            int rowIdx = 1;
            for (Map.Entry<Employee, Map<LocalDate, Attendance>> entry : data) {
                Employee emp = entry.getKey();
                Map<LocalDate, Attendance> recordMap = entry.getValue();
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(emp.getFirstName() + " " + emp.getLastName());
                row.createCell(1).setCellValue(emp.getEmployeeId());
                row.createCell(2).setCellValue(emp.getDepartment() != null ? emp.getDepartment() : "N/A");
                row.createCell(3).setCellValue(emp.getDesignation() != null ? emp.getDesignation() : "N/A");
                row.createCell(4).setCellValue(emp.isActive() ? "Active" : "Inactive");

                int present = 0, half = 0, absent = 0, leave = 0, late = 0;
                double totalHours = 0;
                int totalBreakMin = 0;
                int col = 5;

                for (LocalDate d : days) {
                    Cell cell = row.createCell(col++);
                    boolean weekend = d.getDayOfWeek() == DayOfWeek.SATURDAY || d.getDayOfWeek() == DayOfWeek.SUNDAY;
                    Attendance att = recordMap.get(d);

                    if (weekend) {
                        cell.setCellValue("WK");
                        cell.setCellStyle(weekendStyle);
                        continue;
                    }
                    if (att == null) {
                        cell.setCellValue("A");
                        cell.setCellStyle(statusStyles.get(AttendanceStatus.ABSENT));
                        absent++;
                        continue;
                    }

                    AttendanceStatus st = att.getStatus();
                    List<AttendanceBreak> dayBreaks = att.getBreaks();
                    String breakSuffix = "";
                    if (!dayBreaks.isEmpty()) {
                        String ranges = dayBreaks.stream()
                                .map(b -> fmt(b.getBreakStart()) + "-"
                                        + (b.getBreakEnd() != null ? fmt(b.getBreakEnd()) : "..."))
                                .collect(Collectors.joining(", "));
                        breakSuffix = " [brk " + ranges + "]";
                    }
                    String label = switch (st) {
                        case PRESENT ->
                            "P (" + fmt(att.getCheckIn()) + "-" + fmt(att.getCheckOut()) + ")" + breakSuffix;
                        case HALF_DAY ->
                            "H (" + fmt(att.getCheckIn()) + "-" + fmt(att.getCheckOut()) + ")" + breakSuffix;
                        case ON_LEAVE -> "L";
                        default -> "A";
                    };
                    cell.setCellValue(label);
                    if (statusStyles.containsKey(st))
                        cell.setCellStyle(statusStyles.get(st));

                    if (st == AttendanceStatus.PRESENT)
                        present++;
                    else if (st == AttendanceStatus.HALF_DAY)
                        half++;
                    else if (st == AttendanceStatus.ON_LEAVE)
                        leave++;
                    else if (st == AttendanceStatus.ABSENT)
                        absent++;

                    if (att.getWorkHours() != null)
                        totalHours += att.getWorkHours();
                    if (att.getTotalBreakMinutes() != null)
                        totalBreakMin += att.getTotalBreakMinutes();
                    if (att.getCheckIn() != null && att.getCheckIn().isAfter(LATE_THRESHOLD))
                        late++;
                }

                row.createCell(col++).setCellValue(Math.round(totalHours * 100.0) / 100.0);
                row.createCell(col++).setCellValue(totalBreakMin);
                row.createCell(col++).setCellValue(present);
                row.createCell(col++).setCellValue(half);
                row.createCell(col++).setCellValue(absent);
                row.createCell(col++).setCellValue(leave);
                row.createCell(col).setCellValue(late);
            }

            for (int i = 0; i < headers.size(); i++)
                sheet.autoSizeColumn(i);

            wb.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private CellStyle coloredStyle(XSSFWorkbook wb, IndexedColors color) {
        CellStyle style = wb.createCellStyle();
        style.setFillForegroundColor(color.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private String fmt(LocalTime t) {
        return t == null ? "--" : t.toString().substring(0, 5);
    }

    private List<AttendanceDTOs.DailyRecord> buildDailyRecords(LocalDate rangeStart, LocalDate rangeEnd,
            List<Attendance> records) {
        Map<LocalDate, Attendance> recordMap = records.stream()
                .collect(Collectors.toMap(Attendance::getDate, a -> a));

        List<AttendanceDTOs.DailyRecord> dailyRecords = new ArrayList<>();
        for (LocalDate date = rangeStart; !date.isAfter(rangeEnd); date = date.plusDays(1)) {
            String dayName = date.getDayOfWeek().toString().substring(0, 3);
            AttendanceDTOs.DailyRecord day = new AttendanceDTOs.DailyRecord();
            day.setDate(date);
            day.setDayName(dayName);

            if (isWeekend(date)) {
                day.setStatus("WEEKEND");
            } else if (recordMap.containsKey(date)) {
                Attendance att = recordMap.get(date);
                day.setStatus(att.getStatus().name());
                day.setCheckIn(att.getCheckIn());
                day.setCheckOut(att.getCheckOut());
                day.setWorkHours(att.getWorkHours());
                day.setRemarks(att.getRemarks());
                day.setTotalBreakMinutes(att.getTotalBreakMinutes());
                day.setBreaks(att.getBreaks().stream()
                        .map(this::toBreakResponse).collect(Collectors.toList()));
            } else {
                day.setStatus("ABSENT");
            }
            dailyRecords.add(day);
        }
        return dailyRecords;
    }

    private AttendanceDTOs.WeeklyStats calculateWeeklyStats(List<Attendance> records) {
        AttendanceDTOs.WeeklyStats stats = new AttendanceDTOs.WeeklyStats();

        long presentCount = records.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
        long absentCount = records.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
        long halfDayCount = records.stream().filter(a -> a.getStatus() == AttendanceStatus.HALF_DAY).count();
        long leaveCount = records.stream().filter(a -> a.getStatus() == AttendanceStatus.ON_LEAVE).count();
        double totalHours = records.stream().mapToDouble(a -> a.getWorkHours() != null ? a.getWorkHours() : 0).sum();

        stats.setPresentCount((int) presentCount);
        stats.setAbsentCount((int) absentCount);
        stats.setHalfDayCount((int) halfDayCount);
        stats.setLeaveCount((int) leaveCount);
        stats.setAvgWorkHours(records.size() > 0 ? Math.round((totalHours / records.size()) * 100.0) / 100.0 : 0.0);

        return stats;
    }

    private AttendanceDTOs.MonthlyStats calculateMonthlyStats(List<Attendance> records, LocalDate monthStart,
            LocalDate monthEnd) {
        AttendanceDTOs.MonthlyStats stats = new AttendanceDTOs.MonthlyStats();

        int workingDays = 0;
        for (LocalDate date = monthStart; !date.isAfter(monthEnd); date = date.plusDays(1)) {
            if (!isWeekend(date)) {
                workingDays++;
            }
        }

        long presentCount = records.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
        long halfDayCount = records.stream().filter(a -> a.getStatus() == AttendanceStatus.HALF_DAY).count();
        long absentCount = records.stream().filter(a -> a.getStatus() == AttendanceStatus.ABSENT).count();
        long leaveCount = records.stream().filter(a -> a.getStatus() == AttendanceStatus.ON_LEAVE).count();
        double totalHours = records.stream().mapToDouble(a -> a.getWorkHours() != null ? a.getWorkHours() : 0).sum();

        double attendancePercent = workingDays > 0 ? ((presentCount + halfDayCount) / (double) workingDays) * 100 : 0;

        stats.setWorkingDays(workingDays);
        stats.setPresentCount((int) presentCount);
        stats.setAbsentCount((int) absentCount);
        stats.setHalfDayCount((int) halfDayCount);
        stats.setLeaveCount((int) leaveCount);
        stats.setAttendancePercent(Math.round(attendancePercent * 100.0) / 100.0);
        stats.setTotalWorkHours(Math.round(totalHours * 100.0) / 100.0);

        return stats;
    }

    private boolean isWeekend(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }

    private AttendanceDTOs.Response toResponse(Attendance a) {
        AttendanceDTOs.Response r = new AttendanceDTOs.Response();
        r.setId(a.getId());
        r.setEmployeeDbId(a.getEmployee().getId());
        r.setEmployeeName(a.getEmployee().getFirstName() + " " + a.getEmployee().getLastName());
        r.setDate(a.getDate());
        r.setCheckIn(a.getCheckIn());
        r.setCheckOut(a.getCheckOut());
        r.setWorkHours(a.getWorkHours());
        r.setStatus(a.getStatus().name());
        r.setRemarks(a.getRemarks());
        r.setTotalBreakMinutes(a.getTotalBreakMinutes());
        r.setOnBreak(a.getBreaks().stream().anyMatch(b -> b.getBreakEnd() == null));
        r.setBreaks(a.getBreaks().stream()
                .map(this::toBreakResponse).collect(Collectors.toList()));
        return r;
    }

    private AttendanceDTOs.BreakResponse toBreakResponse(AttendanceBreak b) {
        AttendanceDTOs.BreakResponse br = new AttendanceDTOs.BreakResponse();
        br.setId(b.getId());
        br.setBreakType(b.getBreakType().name());
        br.setBreakStart(b.getBreakStart());
        br.setBreakEnd(b.getBreakEnd());
        br.setDurationMinutes(b.getDurationMinutes());
        br.setPaid(b.isPaid());
        br.setFlagged(b.isFlagged());
        return br;
    }
}