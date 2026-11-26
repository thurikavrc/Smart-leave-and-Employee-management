package com.smartleave.hr.controller;

import com.smartleave.hr.dto.OrganizationSettingsRequest;
import com.smartleave.hr.dto.OrganizationSettingsResponse;
import com.smartleave.hr.service.OrganizationSettingsService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class OrganizationSettingsController {

    private final OrganizationSettingsService organizationSettingsService;

    public OrganizationSettingsController(OrganizationSettingsService organizationSettingsService) {
        this.organizationSettingsService = organizationSettingsService;
    }

    @GetMapping
    public ResponseEntity<OrganizationSettingsResponse> getSettings() {
        return ResponseEntity.ok(organizationSettingsService.getSettings());
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrganizationSettingsResponse> updateSettings(
            @Valid @RequestBody OrganizationSettingsRequest request) {
        return ResponseEntity.ok(organizationSettingsService.updateSettings(request));
    }
}
