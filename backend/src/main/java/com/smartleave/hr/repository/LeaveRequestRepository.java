package com.smartleave.hr.repository;

import com.smartleave.hr.model.LeaveRequest;
import com.smartleave.hr.model.enums.LeaveStatus;
import com.smartleave.hr.model.enums.LeaveType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
    List<LeaveRequest> findByEmployeeIdOrderByAppliedDateDescIdDesc(Long employeeId);
    List<LeaveRequest> findByEmployeeReportingManagerIdOrderByAppliedDateDescIdDesc(Long managerId);
    List<LeaveRequest> findAllByOrderByAppliedDateDescIdDesc();
    long countByStatus(LeaveStatus status);
    long countByEmployeeIdAndStatus(Long employeeId, LeaveStatus status);
    long countByEmployeeReportingManagerIdAndStatus(Long managerId, LeaveStatus status);

    @Query("""
        SELECT COUNT(lr) > 0 FROM LeaveRequest lr
        WHERE lr.employee.id = :employeeId
          AND lr.status IN :statuses
          AND lr.startDate <= :endDate
          AND lr.endDate >= :startDate
    """)
    boolean existsOverlappingLeave(
            @Param("employeeId") Long employeeId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("statuses") List<LeaveStatus> statuses
    );

    @Query("""
        SELECT lr FROM LeaveRequest lr
        WHERE lr.employee.id = :employeeId
          AND YEAR(lr.startDate) = :year
        ORDER BY lr.appliedDate DESC, lr.id DESC
    """)
    List<LeaveRequest> findByEmployeeIdAndYear(
            @Param("employeeId") Long employeeId,
            @Param("year") int year
    );

    @Query("""
        SELECT lr FROM LeaveRequest lr
        WHERE (:employeeId IS NULL OR lr.employee.id = :employeeId)
          AND (:managerId IS NULL OR lr.employee.reportingManager.id = :managerId)
          AND (:status IS NULL OR lr.status = :status)
          AND (:leaveType IS NULL OR lr.leaveType = :leaveType)
          AND (:departmentName IS NULL OR :departmentName = '' OR LOWER(lr.employee.department.name) = LOWER(:departmentName))
          AND (:fromDate IS NULL OR lr.startDate >= :fromDate)
          AND (:toDate IS NULL OR lr.startDate <= :toDate)
          AND (:search IS NULL OR :search = ''
               OR LOWER(lr.employee.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(lr.employee.employeeId) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(lr.applicationId) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(lr.reason) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY lr.appliedDate DESC, lr.id DESC
    """)
    Page<LeaveRequest> searchLeaves(
            @Param("employeeId") Long employeeId,
            @Param("managerId") Long managerId,
            @Param("status") LeaveStatus status,
            @Param("leaveType") LeaveType leaveType,
            @Param("departmentName") String departmentName,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("search") String search,
            Pageable pageable
    );

    @Query("""
        SELECT lr FROM LeaveRequest lr
        WHERE (:status IS NULL OR lr.status = :status)
          AND (:leaveType IS NULL OR lr.leaveType = :leaveType)
          AND (:departmentName IS NULL OR :departmentName = '' OR LOWER(lr.employee.department.name) = LOWER(:departmentName))
          AND (:fromDate IS NULL OR lr.startDate >= :fromDate)
          AND (:toDate IS NULL OR lr.startDate <= :toDate)
        ORDER BY lr.appliedDate DESC, lr.id DESC
    """)
    List<LeaveRequest> findLeavesForReport(
            @Param("status") LeaveStatus status,
            @Param("leaveType") LeaveType leaveType,
            @Param("departmentName") String departmentName,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate
    );
}
