package com.smartleave.hr.service;

import com.smartleave.hr.dto.AuthRequest;
import com.smartleave.hr.dto.AuthResponse;
import com.smartleave.hr.dto.BootstrapAdminRequest;
import com.smartleave.hr.dto.BootstrapStatusResponse;
import com.smartleave.hr.dto.RegisterRequest;
import com.smartleave.hr.dto.UserDto;
import com.smartleave.hr.exception.ConflictException;
import com.smartleave.hr.exception.ResourceNotFoundException;
import com.smartleave.hr.model.Department;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.model.User;
import com.smartleave.hr.model.enums.EmploymentStatus;
import com.smartleave.hr.model.enums.UserRole;
import com.smartleave.hr.repository.DepartmentRepository;
import com.smartleave.hr.repository.EmployeeRepository;
import com.smartleave.hr.repository.UserRepository;
import com.smartleave.hr.security.CustomUserDetailsService;
import com.smartleave.hr.security.JwtService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;

@Service
public class AuthService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final JwtService jwtService;
    private final LeaveBalanceService leaveBalanceService;

    public AuthService(
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            CustomUserDetailsService userDetailsService,
            JwtService jwtService,
            LeaveBalanceService leaveBalanceService) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.userDetailsService = userDetailsService;
        this.jwtService = jwtService;
        this.leaveBalanceService = leaveBalanceService;
    }

    public AuthResponse login(AuthRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(normalizedEmail, request.getPassword())
        );

        Employee employee = employeeRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        return buildAuthResponse(employee);
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)
                || employeeRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ConflictException("Email is already registered: " + normalizedEmail);
        }

        Department department = departmentRepository.findById(request.getDepartmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + request.getDepartmentId()));

        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = createUser(normalizedEmail, encodedPassword, UserRole.EMPLOYEE, true);

        Employee employee = new Employee();
        employee.setUser(user);
        employee.setEmployeeId(generateNextEmployeeCode());
        employee.setFullName(request.getFullName().trim());
        employee.setEmail(normalizedEmail);
        employee.setPasswordHash(encodedPassword);
        employee.setPhoneNumber(
                request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()
                        ? request.getPhoneNumber().trim()
                        : "Not provided"
        );
        employee.setDepartment(department);
        employee.setDesignation(request.getDesignation().trim());
        employee.setDateOfJoining(LocalDate.now());
        employee.setEmploymentStatus(EmploymentStatus.ACTIVE);
        employee.setRole(UserRole.EMPLOYEE);

        Employee saved = employeeRepository.save(employee);
        leaveBalanceService.initializeBalancesForYear(saved, LocalDate.now().getYear());
        return buildAuthResponse(saved);
    }

    public BootstrapStatusResponse getBootstrapStatus() {
        return new BootstrapStatusResponse(
                !userRepository.existsByRole(UserRole.ADMIN) && !employeeRepository.existsByRole(UserRole.ADMIN)
        );
    }

    @Transactional
    public synchronized AuthResponse bootstrapAdmin(BootstrapAdminRequest request) {
        if (userRepository.existsByRole(UserRole.ADMIN) || employeeRepository.existsByRole(UserRole.ADMIN)) {
            throw new ConflictException("An administrator account has already been configured.");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)
                || employeeRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ConflictException("Email is already registered: " + normalizedEmail);
        }

        Department hrDept = departmentRepository.findByNameIgnoreCase("Human Resources")
                .orElseGet(() -> departmentRepository.findAll().stream()
                        .findFirst()
                        .orElseThrow(() -> new ResourceNotFoundException("No departments exist yet")));

        String encodedPassword = passwordEncoder.encode(request.getPassword());
        User user = createUser(normalizedEmail, encodedPassword, UserRole.ADMIN, true);

        Employee admin = new Employee();
        admin.setUser(user);
        admin.setEmployeeId(generateNextEmployeeCode());
        admin.setFullName(request.getFullName().trim());
        admin.setEmail(normalizedEmail);
        admin.setPasswordHash(encodedPassword);
        admin.setPhoneNumber(
                request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()
                        ? request.getPhoneNumber().trim()
                        : "Not provided"
        );
        admin.setDepartment(hrDept);
        admin.setDesignation(
                request.getDesignation() != null && !request.getDesignation().isBlank()
                        ? request.getDesignation().trim()
                        : "HR Administrator"
        );
        admin.setDateOfJoining(LocalDate.now());
        admin.setEmploymentStatus(EmploymentStatus.ACTIVE);
        admin.setRole(UserRole.ADMIN);

        Employee saved = employeeRepository.save(admin);

        if (hrDept.getHeadEmployee() == null) {
            hrDept.setHeadEmployee(saved);
            departmentRepository.save(hrDept);
        }

        leaveBalanceService.initializeBalancesForYear(saved, LocalDate.now().getYear());
        return buildAuthResponse(saved);
    }

    public Employee getAuthenticatedEmployee(String email) {
        return employeeRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated employee not found"));
    }

    private User createUser(String email, String encodedPassword, UserRole role, boolean isActive) {
        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(encodedPassword);
        user.setRole(role);
        user.setIsActive(isActive);
        Instant now = Instant.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        return user;
    }

    private AuthResponse buildAuthResponse(Employee employee) {
        UserDetails userDetails = userDetailsService.loadUserByUsername(employee.getEmail());
        String token = jwtService.generateToken(
                userDetails,
                Map.of("role", employee.getRole().name(), "employeeId", employee.getId())
        );

        UserDto dto = new UserDto();
        dto.setId(employee.getId());
        dto.setEmployeeId(employee.getEmployeeId());
        dto.setFullName(employee.getFullName());
        dto.setEmail(employee.getEmail());
        dto.setRole(employee.getRole());
        dto.setDepartmentId(employee.getDepartment().getId());
        dto.setDepartmentName(employee.getDepartment().getName());
        dto.setDesignation(employee.getDesignation());
        dto.setAvatarUrl(employee.getAvatarUrl());

        return new AuthResponse(token, dto);
    }

    private String generateNextEmployeeCode() {
        long nextNum = 1001 + employeeRepository.count();
        String code = "EMP-" + nextNum;
        while (employeeRepository.existsByEmployeeIdIgnoreCase(code)) {
            nextNum++;
            code = "EMP-" + nextNum;
        }
        return code;
    }
}
