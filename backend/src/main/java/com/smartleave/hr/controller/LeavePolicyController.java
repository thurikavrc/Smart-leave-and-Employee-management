package com.smartleave.hr.controller;

import com.smartleave.hr.dto.LeavePolicyRequest;
import com.smartleave.hr.model.LeavePolicy;
import com.smartleave.hr.service.LeavePolicyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leave-policies")
public class LeavePolicyController {

    private final LeavePolicyService leavePolicyService;

    public LeavePolicyController(LeavePolicyService leavePolicyService) {
        this.leavePolicyService = leavePolicyService;
    }

    @GetMapping
    public ResponseEntity<List<LeavePolicy>> getAll() {
        return ResponseEntity.ok(leavePolicyService.getAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LeavePolicy> create(@Valid @RequestBody LeavePolicyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(leavePolicyService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LeavePolicy> update(
            @PathVariable Long id,
            @Valid @RequestBody LeavePolicyRequest request) {
        return ResponseEntity.ok(leavePolicyService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        leavePolicyService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
