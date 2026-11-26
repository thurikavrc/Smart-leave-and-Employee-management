package com.smartleave.hr.controller;

import com.smartleave.hr.dto.DashboardStatisticsResponse;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.service.AuthService;
import com.smartleave.hr.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;
    private final AuthService authService;

    public DashboardController(DashboardService dashboardService, AuthService authService) {
        this.dashboardService = dashboardService;
        this.authService = authService;
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<DashboardStatisticsResponse> getAdminDashboard() {
        return ResponseEntity.ok(dashboardService.getAdminDashboard());
    }

    @GetMapping("/manager")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<DashboardStatisticsResponse> getManagerDashboard(Authentication authentication) {
        Employee manager = authService.getAuthenticatedEmployee(authentication.getName());
        return ResponseEntity.ok(dashboardService.getManagerDashboard(manager));
    }

    @GetMapping("/employee")
    public ResponseEntity<DashboardStatisticsResponse> getEmployeeDashboard(Authentication authentication) {
        Employee employee = authService.getAuthenticatedEmployee(authentication.getName());
        return ResponseEntity.ok(dashboardService.getEmployeeDashboard(employee));
    }
}
