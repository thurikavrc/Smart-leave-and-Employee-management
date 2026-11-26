package com.smartleave.hr.service;

import com.smartleave.hr.dto.EmployeeRequest;
import com.smartleave.hr.dto.EmployeeResponse;
import com.smartleave.hr.dto.EmployeeUpdateRequest;
import com.smartleave.hr.dto.PagedResponse;
import com.smartleave.hr.exception.BadRequestException;
import com.smartleave.hr.exception.ConflictException;
import com.smartleave.hr.exception.ResourceNotFoundException;
import com.smartleave.hr.model.Department;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.model.User;
import com.smartleave.hr.model.enums.EmploymentStatus;
import com.smartleave.hr.model.enums.NotificationCategory;
import com.smartleave.hr.model.enums.UserRole;
import com.smartleave.hr.repository.DepartmentRepository;
import com.smartleave.hr.repository.EmployeeRepository;
import com.smartleave.hr.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final NotificationService notificationService;
    private final LeaveBalanceService leaveBalanceService;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            NotificationService notificationService,
            LeaveBalanceService leaveBalanceService) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.notificationService = notificationService;
        this.leaveBalanceService = leaveBalanceService;
    }

    public List<EmployeeResponse> getAll(Employee current) {
        if (current.getRole() == UserRole.ADMIN) {
            return employeeRepository.findAll().stream()
                    .map(this::toResponse)
                    .toList();
        }
        if (current.getRole() == UserRole.MANAGER) {
            return employeeRepository.findByReportingManagerId(current.getId()).stream()
                    .map(this::toResponse)
                    .toList();
        }
        throw new AccessDeniedException("Only administrators and managers can list employees.");
    }

    public PagedResponse<EmployeeResponse> searchPaged(
            Employee current,
            int page,
            int size,
            Long departmentId,
            EmploymentStatus status,
            String search) {
        if (current.getRole() != UserRole.ADMIN && current.getRole() != UserRole.MANAGER) {
            throw new AccessDeniedException("Only administrators and managers can list employees.");
        }
        Long managerScopeId = current.getRole() == UserRole.MANAGER ? current.getId() : null;
        int safePage = Math.max(0, page - 1);
        int safeSize = Math.min(Math.max(1, size), 100);
        String cleanSearch = search != null && !search.isBlank() ? search.trim() : null;

        Page<Employee> result = employeeRepository.searchEmployees(
                managerScopeId,
                departmentId,
                status,
                cleanSearch,
                PageRequest.of(safePage, safeSize)
        );
        return PagedResponse.fromPage(result.map(this::toResponse));
    }

    public EmployeeResponse getById(Long id, Employee current) {
        Employee target = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        boolean isSelf = current.getId().equals(target.getId());
        boolean isAdmin = current.getRole() == UserRole.ADMIN;
        boolean isDirectManager = current.getRole() == UserRole.MANAGER
                && target.getReportingManager() != null
                && target.getReportingManager().getId().equals(current.getId());

        if (!isSelf && !isAdmin && !isDirectManager) {
            throw new AccessDeniedException("You do not have permission to view this employee profile.");
        }

        return toResponse(target);
    }

    @Transactional
    public EmployeeResponse create(EmployeeRequest request) {
        String cleanCode = request.getEmployeeId().trim();
        String cleanEmail = request.getEmail().trim().toLowerCase();

        if (employeeRepository.existsByEmployeeIdIgnoreCase(cleanCode)) {
            throw new ConflictException("Employee ID " + cleanCode + " already exists.");
        }
        if (userRepository.existsByEmailIgnoreCase(cleanEmail)
                || employeeRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw new ConflictException("Email " + cleanEmail + " is already registered.");
        }
        if (request.getInitialPassword() == null || request.getInitialPassword().trim().length() < 8) {
            throw new BadRequestException("An initial password of at least 8 characters is required when creating an employee account.");
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));

        UserRole role = request.getRole() != null ? request.getRole() : UserRole.EMPLOYEE;
        String encodedPassword = passwordEncoder.encode(request.getInitialPassword().trim());
        boolean active = request.getEmploymentStatus() != EmploymentStatus.INACTIVE;

        User user = new User();
        user.setEmail(cleanEmail);
        user.setPasswordHash(encodedPassword);
        user.setRole(role);
        user.setIsActive(active);
        Instant now = Instant.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);

        Employee employee = new Employee();
        employee.setUser(user);
        employee.setEmployeeId(cleanCode);
        employee.setFullName(request.getFullName().trim());
        employee.setEmail(cleanEmail);
        employee.setPasswordHash(encodedPassword);
        employee.setPhoneNumber(request.getPhoneNumber().trim());
        employee.setDepartment(department);
        employee.setDesignation(request.getDesignation().trim());
        employee.setDateOfJoining(request.getDateOfJoining());
        employee.setEmploymentStatus(request.getEmploymentStatus());
        employee.setRole(role);

        if (request.getReportingManagerId() != null) {
            Employee manager = employeeRepository.findById(request.getReportingManagerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Reporting manager not found with id: " + request.getReportingManagerId()));
            employee.setReportingManager(manager);
        }

        Employee saved = employeeRepository.save(employee);
        leaveBalanceService.initializeBalancesForYear(saved, LocalDate.now().getYear());

        notificationService.createNotification(
                "New Employee Added",
                saved.getFullName() + " (" + saved.getEmployeeId() + ") joined " + department.getName() + " as " + saved.getDesignation() + ".",
                NotificationCategory.EMPLOYEE_CREATED,
                "ADMIN",
                null,
                "/admin/employees"
        );

        return toResponse(saved);
    }

    @Transactional
    public EmployeeResponse update(Long id, EmployeeUpdateRequest request, Employee current) {
        Employee target = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        boolean isAdmin = current.getRole() == UserRole.ADMIN;
        boolean isSelf = current.getId().equals(target.getId());

        if (!isAdmin && !isSelf) {
            throw new AccessDeniedException("You do not have permission to update this employee.");
        }

        if (!isAdmin) {
            boolean attemptingPrivilegedChange =
                    request.getEmployeeId() != null
                    || request.getEmail() != null
                    || request.getDepartmentId() != null
                    || request.getDesignation() != null
                    || request.getDateOfJoining() != null
                    || request.getReportingManagerId() != null
                    || request.isClearReportingManager()
                    || request.getEmploymentStatus() != null
                    || request.getRole() != null;

            if (attemptingPrivilegedChange) {
                throw new AccessDeniedException("Only administrators can modify organizational fields or roles.");
            }
        }

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            target.setFullName(request.getFullName().trim());
        }
        if (request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()) {
            target.setPhoneNumber(request.getPhoneNumber().trim());
        }

        if (isAdmin) {
            if (request.getEmployeeId() != null && !request.getEmployeeId().isBlank()) {
                String cleanCode = request.getEmployeeId().trim();
                if (!cleanCode.equalsIgnoreCase(target.getEmployeeId())
                        && employeeRepository.existsByEmployeeIdIgnoreCase(cleanCode)) {
                    throw new ConflictException("Employee ID " + cleanCode + " already exists.");
                }
                target.setEmployeeId(cleanCode);
            }
            if (request.getEmail() != null && !request.getEmail().isBlank()) {
                String cleanEmail = request.getEmail().trim().toLowerCase();
                if (!cleanEmail.equalsIgnoreCase(target.getEmail())
                        && (employeeRepository.existsByEmailIgnoreCase(cleanEmail)
                        || userRepository.existsByEmailIgnoreCase(cleanEmail))) {
                    throw new ConflictException("Email " + cleanEmail + " is already registered.");
                }
                target.setEmail(cleanEmail);
                if (target.getUser() != null) {
                    target.getUser().setEmail(cleanEmail);
                    target.getUser().setUpdatedAt(Instant.now());
                }
            }
            if (request.getDepartmentId() != null) {
                Department department = departmentRepository.findById(request.getDepartmentId())
                        .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));
                target.setDepartment(department);
            }
            if (request.getDesignation() != null && !request.getDesignation().isBlank()) {
                target.setDesignation(request.getDesignation().trim());
            }
            if (request.getDateOfJoining() != null) {
                target.setDateOfJoining(request.getDateOfJoining());
            }
            if (request.isClearReportingManager()) {
                target.setReportingManager(null);
            } else if (request.getReportingManagerId() != null) {
                if (request.getReportingManagerId().equals(target.getId())) {
                    throw new BadRequestException("An employee cannot be their own reporting manager.");
                }
                Employee manager = employeeRepository.findById(request.getReportingManagerId())
                        .orElseThrow(() -> new ResourceNotFoundException("Reporting manager not found with id: " + request.getReportingManagerId()));
                target.setReportingManager(manager);
            }
            if (request.getEmploymentStatus() != null) {
                target.setEmploymentStatus(request.getEmploymentStatus());
                if (target.getUser() != null) {
                    target.getUser().setIsActive(request.getEmploymentStatus() != EmploymentStatus.INACTIVE);
                    target.getUser().setUpdatedAt(Instant.now());
                }
            }
            if (request.getRole() != null) {
                target.setRole(request.getRole());
                if (target.getUser() != null) {
                    target.getUser().setRole(request.getRole());
                    target.getUser().setUpdatedAt(Instant.now());
                }
            }
        }

        return toResponse(employeeRepository.save(target));
    }

    @Transactional
    public void delete(Long id, Employee current) {
        if (current.getId().equals(id)) {
            throw new BadRequestException("You cannot delete your own active administrator account.");
        }
        Employee target = employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + id));

        // Clear department head or subordinate reporting manager references before deleting
        for (Department dept : departmentRepository.findAll()) {
            if (dept.getHeadEmployee() != null && dept.getHeadEmployee().getId().equals(id)) {
                dept.setHeadEmployee(null);
                departmentRepository.save(dept);
            }
        }
        for (Employee subordinate : employeeRepository.findByReportingManagerId(id)) {
            subordinate.setReportingManager(null);
            employeeRepository.save(subordinate);
        }

        employeeRepository.delete(target);
    }

    public EmployeeResponse toResponse(Employee e) {
        EmployeeResponse res = new EmployeeResponse();
        res.setId(e.getId());
        res.setEmployeeId(e.getEmployeeId());
        res.setFullName(e.getFullName());
        res.setEmail(e.getEmail());
        res.setPhoneNumber(e.getPhoneNumber());
        res.setDepartmentId(e.getDepartment().getId());
        res.setDepartmentName(e.getDepartment().getName());
        res.setDesignation(e.getDesignation());
        res.setDateOfJoining(e.getDateOfJoining());
        if (e.getReportingManager() != null) {
            res.setReportingManagerId(e.getReportingManager().getId());
            res.setReportingManagerName(e.getReportingManager().getFullName());
        } else {
            res.setReportingManagerName("Executive Board");
        }
        res.setEmploymentStatus(e.getEmploymentStatus());
        res.setRole(e.getRole());
        res.setAvatarUrl(e.getAvatarUrl());
        return res;
    }
}
