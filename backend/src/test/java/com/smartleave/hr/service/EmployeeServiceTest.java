package com.smartleave.hr.service;

import com.smartleave.hr.dto.EmployeeRequest;
import com.smartleave.hr.dto.EmployeeResponse;
import com.smartleave.hr.dto.EmployeeUpdateRequest;
import com.smartleave.hr.dto.PagedResponse;
import com.smartleave.hr.exception.ConflictException;
import com.smartleave.hr.model.Department;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.model.User;
import com.smartleave.hr.model.enums.EmploymentStatus;
import com.smartleave.hr.model.enums.NotificationCategory;
import com.smartleave.hr.model.enums.UserRole;
import com.smartleave.hr.repository.DepartmentRepository;
import com.smartleave.hr.repository.EmployeeRepository;
import com.smartleave.hr.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock private EmployeeRepository employeeRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private NotificationService notificationService;
    @Mock private LeaveBalanceService leaveBalanceService;

    @InjectMocks
    private EmployeeService employeeService;

    private Department engineering;
    private Employee admin;
    private Employee manager;
    private Employee worker;

    @BeforeEach
    void setUp() {
        engineering = new Department();
        engineering.setId(1L);
        engineering.setName("Engineering");

        admin = new Employee();
        admin.setId(1L);
        admin.setEmployeeId("EMP-1000");
        admin.setFullName("Claire Sterling");
        admin.setEmail("admin@company.com");
        admin.setDepartment(engineering);
        admin.setRole(UserRole.ADMIN);

        manager = new Employee();
        manager.setId(2L);
        manager.setEmployeeId("EMP-1001");
        manager.setFullName("Marcus Vance");
        manager.setEmail("manager@company.com");
        manager.setDepartment(engineering);
        manager.setRole(UserRole.MANAGER);

        User workerUser = new User();
        workerUser.setId(30L);
        workerUser.setEmail("liam@company.com");
        workerUser.setRole(UserRole.EMPLOYEE);
        workerUser.setIsActive(true);

        worker = new Employee();
        worker.setId(3L);
        worker.setUser(workerUser);
        worker.setEmployeeId("EMP-1002");
        worker.setFullName("Liam Mercer");
        worker.setEmail("liam@company.com");
        worker.setDepartment(engineering);
        worker.setReportingManager(manager);
        worker.setDesignation("Senior Developer");
        worker.setDateOfJoining(LocalDate.of(2024, 3, 15));
        worker.setEmploymentStatus(EmploymentStatus.ACTIVE);
        worker.setRole(UserRole.EMPLOYEE);
    }

    @Test
    void create_validEmployee_savesUserEmployeeAndBalances() {
        EmployeeRequest req = new EmployeeRequest();
        req.setEmployeeId("EMP-1099");
        req.setFullName("Maya Lin");
        req.setEmail("maya@company.com");
        req.setPhoneNumber("555-0199");
        req.setDepartmentId(1L);
        req.setDesignation("Product Designer");
        req.setDateOfJoining(LocalDate.of(2026, 2, 1));
        req.setReportingManagerId(2L);
        req.setEmploymentStatus(EmploymentStatus.ACTIVE);
        req.setRole(UserRole.EMPLOYEE);
        req.setInitialPassword("SecurePass123!");

        when(employeeRepository.existsByEmployeeIdIgnoreCase("EMP-1099")).thenReturn(false);
        when(userRepository.existsByEmailIgnoreCase("maya@company.com")).thenReturn(false);
        when(employeeRepository.existsByEmailIgnoreCase("maya@company.com")).thenReturn(false);
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(engineering));
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(passwordEncoder.encode("SecurePass123!")).thenReturn("encoded-pw");
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> {
            Employee e = inv.getArgument(0);
            e.setId(50L);
            return e;
        });

        EmployeeResponse res = employeeService.create(req);

        assertEquals("EMP-1099", res.getEmployeeId());
        assertEquals("Marcus Vance", res.getReportingManagerName());
        verify(leaveBalanceService).initializeBalancesForYear(any(Employee.class), anyInt());
        verify(notificationService).createNotification(
                eq("New Employee Added"),
                contains("Maya Lin"),
                eq(NotificationCategory.EMPLOYEE_CREATED),
                eq("ADMIN"),
                isNull(),
                eq("/admin/employees")
        );
    }

    @Test
    void create_duplicateEmployeeId_throwsConflict() {
        EmployeeRequest req = new EmployeeRequest();
        req.setEmployeeId("EMP-1002");
        req.setEmail("new@company.com");
        when(employeeRepository.existsByEmployeeIdIgnoreCase("EMP-1002")).thenReturn(true);

        assertThrows(ConflictException.class, () -> employeeService.create(req));
    }

    @Test
    void update_nonAdminAttemptingRoleChange_throwsAccessDenied() {
        when(employeeRepository.findById(3L)).thenReturn(Optional.of(worker));

        EmployeeUpdateRequest req = new EmployeeUpdateRequest();
        req.setRole(UserRole.ADMIN);

        assertThrows(AccessDeniedException.class, () -> employeeService.update(3L, req, worker));
    }

    @Test
    void delete_clearsDepartmentHeadAndSubordinateReferences() {
        engineering.setHeadEmployee(manager);
        when(employeeRepository.findById(2L)).thenReturn(Optional.of(manager));
        when(departmentRepository.findAll()).thenReturn(List.of(engineering));
        when(employeeRepository.findByReportingManagerId(2L)).thenReturn(List.of(worker));

        employeeService.delete(2L, admin);

        assertNull(engineering.getHeadEmployee());
        assertNull(worker.getReportingManager());
        verify(employeeRepository).delete(manager);
    }

    @Test
    void searchPaged_managerScopedToDirectReports() {
        when(employeeRepository.searchEmployees(eq(2L), isNull(), isNull(), isNull(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(worker), PageRequest.of(0, 7), 1));

        PagedResponse<EmployeeResponse> page = employeeService.searchPaged(manager, 1, 7, null, null, null);

        assertEquals(1, page.getTotalElements());
        assertEquals("Liam Mercer", page.getContent().get(0).getFullName());
    }
}
