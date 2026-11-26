package com.smartleave.hr.controller;

import com.smartleave.hr.dto.AuthRequest;
import com.smartleave.hr.dto.AuthResponse;
import com.smartleave.hr.dto.BootstrapAdminRequest;
import com.smartleave.hr.dto.BootstrapStatusResponse;
import com.smartleave.hr.dto.RegisterRequest;
import com.smartleave.hr.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(request));
    }

    @GetMapping("/bootstrap-status")
    public ResponseEntity<BootstrapStatusResponse> getBootstrapStatus() {
        return ResponseEntity.ok(authService.getBootstrapStatus());
    }

    @PostMapping("/bootstrap-admin")
    public ResponseEntity<AuthResponse> bootstrapAdmin(@Valid @RequestBody BootstrapAdminRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.bootstrapAdmin(request));
    }
}
