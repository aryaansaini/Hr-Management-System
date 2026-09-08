package com.hrms.repository;

import com.hrms.entity.Attendance;
import com.hrms.entity.Employee;
import com.hrms.enums.AttendanceStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    Optional<Attendance> findByEmployeeAndDate(
            Employee employee,
            LocalDate date
    );

    Optional<Attendance> findFirstByEmployeeAndCheckOutIsNullOrderByDateDesc(
            Employee employee
    );

    List<Attendance> findByEmployeeAndDateBetween(
            Employee employee,
            LocalDate from,
            LocalDate to
    );

    // Get employee attendance with pagination
    @EntityGraph(attributePaths = { "employee", "breaks" })
    Page<Attendance> findByEmployee(
            Employee employee,
            Pageable pageable
    );

    // Get all attendance records for one employee
    // Used by Clear All Attendance
    List<Attendance> findByEmployee(Employee employee);

    @EntityGraph(attributePaths = { "employee", "breaks" })
    Page<Attendance> findByDate(
            LocalDate date,
            Pageable pageable
    );

    long countByEmployeeAndDateBetweenAndStatus(
            Employee employee,
            LocalDate from,
            LocalDate to,
            AttendanceStatus status
    );

    // ===== DETAILED REPORT QUERIES =====

    @EntityGraph(attributePaths = { "employee", "breaks" })
    @Query("""
        SELECT a
        FROM Attendance a
        WHERE a.employee = :employee
          AND a.date BETWEEN :from AND :to
        ORDER BY a.date ASC
        """)
    List<Attendance> findByEmployeeAndDateRangeOrderByDate(
            @Param("employee") Employee employee,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Query("""
        SELECT a
        FROM Attendance a
        WHERE a.employee = :employee
          AND a.date = :date
        """)
    Optional<Attendance> findByEmployeeAndSpecificDate(
            @Param("employee") Employee employee,
            @Param("date") LocalDate date
    );

    @Query("""
        SELECT COUNT(a)
        FROM Attendance a
        WHERE a.employee = :employee
          AND a.date BETWEEN :from AND :to
          AND a.status = :status
        """)
    long countByEmployeeStatusInRange(
            @Param("employee") Employee employee,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            @Param("status") AttendanceStatus status
    );

    @Query("""
        SELECT SUM(a.workHours)
        FROM Attendance a
        WHERE a.employee = :employee
          AND a.date BETWEEN :from AND :to
        """)
    Double sumWorkHoursByEmployeeInRange(
            @Param("employee") Employee employee,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Query("""
        SELECT a
        FROM Attendance a
        WHERE a.date = :date
        ORDER BY a.employee.id ASC
        """)
    Page<Attendance> findByDateWithPagination(
            @Param("date") LocalDate date,
            Pageable pageable
    );

    @EntityGraph(attributePaths = { "employee", "breaks" })
    @Query("""
        SELECT a
        FROM Attendance a
        WHERE a.date BETWEEN :from AND :to
        ORDER BY a.date DESC, a.employee.id ASC
        """)
    List<Attendance> findByDateRangeBetween(
            @Param("from") LocalDate from,
            @Param("to") LocalDate to
    );

    @Query("""
        SELECT COUNT(a)
        FROM Attendance a
        WHERE a.employee = :employee
          AND a.date >= :from
          AND a.date <= :to
          AND a.status IN ('PRESENT', 'HALF_DAY')
        """)
    long countPresentDays(
            Employee employee,
            LocalDate from,
            LocalDate to
    );
}