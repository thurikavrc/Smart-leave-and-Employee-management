package com.smartleave.hr.controller;

import com.smartleave.hr.dto.EmployeeRequest;
import com.smartleave.hr.dto.EmployeeResponse;
import com.smartleave.hr.dto.EmployeeUpdateRequest;
import com.smartleave.hr.dto.LeaveBalanceResponse;
import com.smartleave.hr.dto.PagedResponse;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.model.enums.EmploymentStatus;
import com.smartleave.hr.service.AuthService;
import com.smartleave.hr.service.EmployeeService;
import com.smartleave.hr.service.LeaveService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;
    private final LeaveService leaveService;
    private final AuthService authService;

    public EmployeeController(
            EmployeeService employeeService,
            LeaveService leaveService,
            AuthService authService) {
        this.employeeService = employeeService;
        this.leaveService = leaveService;
        this.authService = authService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<EmployeeResponse>> getAll(Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        return ResponseEntity.ok(employeeService.getAll(current));
    }

    @GetMapping("/paged")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PagedResponse<EmployeeResponse>> getPaged(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "7") int size,
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) EmploymentStatus status,
            @RequestParam(required = false) String search,
            Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        return ResponseEntity.ok(employeeService.searchPaged(
                current, page, size, departmentId, status, search
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponse> getById(
            @PathVariable Long id,
            Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        return ResponseEntity.ok(employeeService.getById(id, current));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EmployeeResponse> create(@Valid @RequestBody EmployeeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(employeeService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmployeeResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody EmployeeUpdateRequest request,
            Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        return ResponseEntity.ok(employeeService.update(id, request, current));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        employeeService.delete(id, current);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/leave-balance")
    public ResponseEntity<LeaveBalanceResponse> getEmployeeLeaveBalance(
            @PathVariable Long id,
            @RequestParam(required = false) Integer year,
            Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        return ResponseEntity.ok(leaveService.getBalanceForEmployee(id, year, current));
    }
}
