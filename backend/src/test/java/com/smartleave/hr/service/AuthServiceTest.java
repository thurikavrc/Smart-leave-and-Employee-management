package com.smartleave.hr.service;

import com.smartleave.hr.dto.AuthRequest;
import com.smartleave.hr.dto.AuthResponse;
import com.smartleave.hr.dto.BootstrapAdminRequest;
import com.smartleave.hr.dto.RegisterRequest;
import com.smartleave.hr.exception.ConflictException;
import com.smartleave.hr.model.Department;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.model.User;
import com.smartleave.hr.model.enums.UserRole;
import com.smartleave.hr.repository.DepartmentRepository;
import com.smartleave.hr.repository.EmployeeRepository;
import com.smartleave.hr.repository.UserRepository;
import com.smartleave.hr.security.CustomUserDetailsService;
import com.smartleave.hr.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private EmployeeRepository employeeRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private CustomUserDetailsService userDetailsService;
    @Mock private JwtService jwtService;
    @Mock private LeaveBalanceService leaveBalanceService;

    @InjectMocks
    private AuthService authService;

    private Department engDept;
    private Department hrDept;
    private Employee employee;

    @BeforeEach
    void setUp() {
        engDept = new Department();
        engDept.setId(1L);
        engDept.setName("Engineering");

        hrDept = new Department();
        hrDept.setId(2L);
        hrDept.setName("Human Resources");

        employee = new Employee();
        employee.setId(10L);
        employee.setEmployeeId("EMP-1001");
        employee.setFullName("Liam Mercer");
        employee.setEmail("liam@company.com");
        employee.setDesignation("Developer");
        employee.setDepartment(engDept);
        employee.setRole(UserRole.EMPLOYEE);
    }

    @Test
    void login_validCredentials_returnsJwtAndUserDto() {
        AuthRequest req = new AuthRequest();
        req.setEmail("  LIAM@company.com ");
        req.setPassword("secret123");

        UserDetails springUser = org.springframework.security.core.userdetails.User
                .withUsername("liam@company.com")
                .password("hashed")
                .roles("EMPLOYEE")
                .build();

        when(employeeRepository.findByEmailIgnoreCase("liam@company.com")).thenReturn(Optional.of(employee));
        when(userDetailsService.loadUserByUsername("liam@company.com")).thenReturn(springUser);
        when(jwtService.generateToken(eq(springUser), anyMap())).thenReturn("jwt-token-abc");

        AuthResponse response = authService.login(req);

        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
        assertEquals("jwt-token-abc", response.getToken());
        assertEquals("liam@company.com", response.getUser().getEmail());
        assertEquals(UserRole.EMPLOYEE, response.getUser().getRole());
    }

    @Test
    void register_newEmployee_createsLinkedUserAndInitializesLeaveBalances() {
        RegisterRequest req = new RegisterRequest();
        req.setFullName("Aria Chen");
        req.setEmail("aria@company.com");
        req.setPassword("Password123!");
        req.setDepartmentId(1L);
        req.setDesignation("QA Engineer");

        when(userRepository.existsByEmailIgnoreCase("aria@company.com")).thenReturn(false);
        when(employeeRepository.existsByEmailIgnoreCase("aria@company.com")).thenReturn(false);
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(engDept));
        when(passwordEncoder.encode("Password123!")).thenReturn("$2a$encoded");
        when(employeeRepository.count()).thenReturn(4L);
        when(employeeRepository.existsByEmployeeIdIgnoreCase(anyString())).thenReturn(false);
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> {
            Employee saved = inv.getArgument(0);
            saved.setId(25L);
            return saved;
        });

        UserDetails springUser = org.springframework.security.core.userdetails.User
                .withUsername("aria@company.com")
                .password("$2a$encoded")
                .roles("EMPLOYEE")
                .build();
        when(userDetailsService.loadUserByUsername("aria@company.com")).thenReturn(springUser);
        when(jwtService.generateToken(eq(springUser), anyMap())).thenReturn("jwt-reg-123");

        AuthResponse response = authService.register(req);

        ArgumentCaptor<Employee> empCaptor = ArgumentCaptor.forClass(Employee.class);
        verify(employeeRepository).save(empCaptor.capture());
        Employee savedEmp = empCaptor.getValue();
        assertNotNull(savedEmp.getUser());
        assertEquals("aria@company.com", savedEmp.getUser().getEmail());
        assertEquals(UserRole.EMPLOYEE, savedEmp.getUser().getRole());
        verify(leaveBalanceService).initializeBalancesForYear(eq(savedEmp), anyInt());
        assertEquals("jwt-reg-123", response.getToken());
    }

    @Test
    void register_duplicateEmail_throwsConflict() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail("liam@company.com");
        when(userRepository.existsByEmailIgnoreCase("liam@company.com")).thenReturn(true);

        assertThrows(ConflictException.class, () -> authService.register(req));
        verify(employeeRepository, never()).save(any());
    }

    @Test
    void bootstrapAdmin_whenAdminAlreadyExists_throwsConflict() {
        when(userRepository.existsByRole(UserRole.ADMIN)).thenReturn(true);

        BootstrapAdminRequest req = new BootstrapAdminRequest();
        req.setFullName("Admin User");
        req.setEmail("admin@company.com");
        req.setPassword("AdminPass123!");

        assertThrows(ConflictException.class, () -> authService.bootstrapAdmin(req));
        verify(employeeRepository, never()).save(any());
    }
}
