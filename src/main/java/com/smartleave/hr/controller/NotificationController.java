package com.smartleave.hr.controller;

import com.smartleave.hr.dto.NotificationResponse;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.service.AuthService;
import com.smartleave.hr.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthService authService;

    public NotificationController(NotificationService notificationService, AuthService authService) {
        this.notificationService = notificationService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        return ResponseEntity.ok(notificationService.getVisibleNotifications(current));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        notificationService.markAsRead(id, current);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        notificationService.markAllAsRead(current);
        return ResponseEntity.noContent().build();
    }
}
