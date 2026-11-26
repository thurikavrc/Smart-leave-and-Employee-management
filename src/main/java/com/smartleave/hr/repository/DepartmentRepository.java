package com.smartleave.hr.repository;

import com.smartleave.hr.model.Department;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    Optional<Department> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);

    @Query("""
        SELECT d FROM Department d
        LEFT JOIN d.headEmployee h
        WHERE (:search IS NULL OR :search = ''
               OR LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(d.description) LIKE LOWER(CONCAT('%', :search, '%'))
               OR (h IS NOT NULL AND LOWER(h.fullName) LIKE LOWER(CONCAT('%', :search, '%'))))
        ORDER BY d.id ASC
    """)
    Page<Department> searchDepartments(@Param("search") String search, Pageable pageable);
}
