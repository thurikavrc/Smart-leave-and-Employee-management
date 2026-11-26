package com.smartleave.hr.service;

import com.smartleave.hr.dto.DepartmentRequest;
import com.smartleave.hr.dto.DepartmentResponse;
import com.smartleave.hr.dto.PagedResponse;
import com.smartleave.hr.exception.BadRequestException;
import com.smartleave.hr.exception.ConflictException;
import com.smartleave.hr.exception.ResourceNotFoundException;
import com.smartleave.hr.model.Department;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.repository.DepartmentRepository;
import com.smartleave.hr.repository.EmployeeRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final EmployeeRepository employeeRepository;

    public DepartmentService(
            DepartmentRepository departmentRepository,
            EmployeeRepository employeeRepository) {
        this.departmentRepository = departmentRepository;
        this.employeeRepository = employeeRepository;
    }

    public List<DepartmentResponse> getAll() {
        return departmentRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public PagedResponse<DepartmentResponse> searchPaged(int page, int size, String search) {
        int safePage = Math.max(0, page - 1);
        int safeSize = Math.min(Math.max(1, size), 100);
        String cleanSearch = search != null && !search.isBlank() ? search.trim() : null;
        Page<Department> result = departmentRepository.searchDepartments(
                cleanSearch,
                PageRequest.of(safePage, safeSize)
        );
        return PagedResponse.fromPage(result.map(this::toResponse));
    }

    @Transactional
    public DepartmentResponse create(DepartmentRequest request) {
        String cleanName = request.getName().trim();
        if (departmentRepository.existsByNameIgnoreCase(cleanName)) {
            throw new ConflictException("Department \"" + cleanName + "\" already exists.");
        }

        Department department = new Department();
        department.setName(cleanName);
        department.setDescription(request.getDescription().trim());
        department.setCreatedAt(LocalDate.now());

        if (request.getHeadEmployeeId() != null) {
            Employee head = employeeRepository.findById(request.getHeadEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Head employee not found with id: " + request.getHeadEmployeeId()));
            department.setHeadEmployee(head);
        }

        return toResponse(departmentRepository.save(department));
    }

    @Transactional
    public DepartmentResponse update(Long id, DepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        String cleanName = request.getName().trim();
        departmentRepository.findByNameIgnoreCase(cleanName)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ConflictException("Department \"" + cleanName + "\" already exists.");
                });

        department.setName(cleanName);
        department.setDescription(request.getDescription().trim());

        if (request.getHeadEmployeeId() != null) {
            Employee head = employeeRepository.findById(request.getHeadEmployeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Head employee not found with id: " + request.getHeadEmployeeId()));
            department.setHeadEmployee(head);
        } else {
            department.setHeadEmployee(null);
        }

        return toResponse(departmentRepository.save(department));
    }

    @Transactional
    public void delete(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        long assignedCount = employeeRepository.countByDepartmentId(id);
        if (assignedCount > 0) {
            throw new BadRequestException(
                    "Cannot delete department while " + assignedCount + " employee(s) remain assigned to it."
            );
        }

        departmentRepository.delete(department);
    }

    public DepartmentResponse toResponse(Department department) {
        DepartmentResponse res = new DepartmentResponse();
        res.setId(department.getId());
        res.setName(department.getName());
        res.setDescription(department.getDescription());
        if (department.getHeadEmployee() != null) {
            res.setHeadEmployeeId(department.getHeadEmployee().getId());
            res.setHeadName(department.getHeadEmployee().getFullName());
        } else {
            res.setHeadName("Unassigned");
        }
        res.setEmployeeCount(employeeRepository.countByDepartmentId(department.getId()));
        res.setCreatedAt(department.getCreatedAt());
        return res;
    }
}
