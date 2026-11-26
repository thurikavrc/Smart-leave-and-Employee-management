package com.smartleave.hr.repository;

import com.smartleave.hr.model.Employee;
import com.smartleave.hr.model.enums.EmploymentStatus;
import com.smartleave.hr.model.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmployeeIdIgnoreCase(String employeeId);
    boolean existsByRole(UserRole role);
    long countByDepartmentId(Long departmentId);
    List<Employee> findByReportingManagerId(Long managerId);
    long countByReportingManagerIdAndEmploymentStatus(Long managerId, EmploymentStatus status);

    @Query("""
        SELECT e FROM Employee e
        WHERE (:managerId IS NULL OR e.reportingManager.id = :managerId)
          AND (:departmentId IS NULL OR e.department.id = :departmentId)
          AND (:status IS NULL OR e.employmentStatus = :status)
          AND (:search IS NULL OR :search = ''
               OR LOWER(e.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(e.employeeId) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(e.email) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(e.designation) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY e.id DESC
    """)
    Page<Employee> searchEmployees(
            @Param("managerId") Long managerId,
            @Param("departmentId") Long departmentId,
            @Param("status") EmploymentStatus status,
            @Param("search") String search,
            Pageable pageable
    );
}
