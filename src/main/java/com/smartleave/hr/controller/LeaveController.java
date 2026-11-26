package com.smartleave.hr.controller;

import com.smartleave.hr.dto.LeaveApplyRequest;
import com.smartleave.hr.dto.LeaveBalanceResponse;
import com.smartleave.hr.dto.LeaveRejectRequest;
import com.smartleave.hr.dto.LeaveResponse;
import com.smartleave.hr.dto.PagedResponse;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.model.LeaveDocument;
import com.smartleave.hr.model.enums.LeaveStatus;
import com.smartleave.hr.model.enums.LeaveType;
import com.smartleave.hr.service.AuthService;
import com.smartleave.hr.service.LeaveDocumentService;
import com.smartleave.hr.service.LeaveService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaves")
public class LeaveController {

    private final LeaveService leaveService;
    private final LeaveDocumentService leaveDocumentService;
    private final AuthService authService;

    public LeaveController(
            LeaveService leaveService,
            LeaveDocumentService leaveDocumentService,
            AuthService authService) {
        this.leaveService = leaveService;
        this.leaveDocumentService = leaveDocumentService;
        this.authService = authService;
    }

    @PostMapping
    public ResponseEntity<LeaveResponse> applyLeave(
            @Valid @RequestBody LeaveApplyRequest request,
            Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(leaveService.applyLeave(request, current));
    }

    @PostMapping(value = "/{id}/document", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        LeaveDocument saved = leaveDocumentService.uploadDocument(id, file, current);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "documentId", saved.getId(),
                "leaveRequestId", id,
                "originalFilename", saved.getOriginalFilename(),
                "fileSize", saved.getFileSize(),
                "contentType", saved.getContentType()
        ));
    }

    @GetMapping("/{id}/document")
    public ResponseEntity<byte[]> downloadDocument(
            @PathVariable Long id,
            Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        LeaveDocument doc = leaveDocumentService.getDocumentForDownload(id, current);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getOriginalFilename() + "\"")
                .header("X-Content-Type-Options", "nosniff")
                .contentType(MediaType.parseMediaType(doc.getContentType()))
                .body(doc.getFileData());
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<LeaveResponse>> getAllLeaves(Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        return ResponseEntity.ok(leaveService.getAllLeaves(current));
    }

    @GetMapping("/paged")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<PagedResponse<LeaveResponse>> getPagedLeaves(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "8") int size,
            @RequestParam(required = false) LeaveStatus status,
            @RequestParam(required = false) LeaveType leaveType,
            @RequestParam(required = false) String departmentName,
            @RequestParam(required = false) String search,
            Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        return ResponseEntity.ok(leaveService.searchPaged(
                current, page, size, status, leaveType, departmentName, search
        ));
    }

    @GetMapping("/my")
    public ResponseEntity<List<LeaveResponse>> getMyLeaves(Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        return ResponseEntity.ok(leaveService.getMyLeaves(current));
    }

    @GetMapping("/my/paged")
    public ResponseEntity<PagedResponse<LeaveResponse>> getMyPagedLeaves(
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "7") int size,
            @RequestParam(required = false) LeaveStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String search,
            Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        return ResponseEntity.ok(leaveService.getMyPaged(
                current, page, size, status, date, search
        ));
    }

    @GetMapping("/balance/my")
    public ResponseEntity<LeaveBalanceResponse> getMyBalance(
            @RequestParam(required = false) Integer year,
            Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        return ResponseEntity.ok(leaveService.computeBalance(current.getId(), year));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeaveResponse> getById(
            @PathVariable Long id,
            Authentication authentication) {
        Employee current = authService.getAuthenticatedEmployee(authentication.getName());
        return ResponseEntity.ok(leaveService.getById(id, current));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<LeaveResponse> approveLeave(
            @PathVariable Long id,
            Authentication authentication) {
        Employee reviewer = authService.getAuthenticatedEmployee(authentication.getName());
        return ResponseEntity.ok(leaveService.approveLeave(id, reviewer));
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<LeaveResponse> rejectLeave(
            @PathVariable Long id,
            @Valid @RequestBody LeaveRejectRequest request,
            Authentication authentication) {
        Employee reviewer = authService.getAuthenticatedEmployee(authentication.getName());
        return ResponseEntity.ok(leaveService.rejectLeave(id, request.getRejectionReason(), reviewer));
    }
}
