package com.smartleave.hr.controller;

import com.smartleave.hr.dto.LeaveReportResponse;
import com.smartleave.hr.model.enums.LeaveType;
import com.smartleave.hr.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/leaves")
    public ResponseEntity<LeaveReportResponse> getLeaveReport(
            @RequestParam(defaultValue = "ALL") String reportType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String departmentName,
            @RequestParam(required = false) LeaveType leaveType,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reportService.getLeaveReport(
                reportType, fromDate, toDate, departmentName, leaveType, page, size
        ));
    }

    @GetMapping(value = "/leaves/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportLeaveReportCsv(
            @RequestParam(defaultValue = "ALL") String reportType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) String departmentName,
            @RequestParam(required = false) LeaveType leaveType) {

        byte[] csvBytes = reportService.exportLeaveReportCsv(
                reportType, fromDate, toDate, departmentName, leaveType
        );
        String safeType = reportType.replaceAll("[^a-zA-Z0-9_-]", "").toLowerCase();
        String filename = "leave-report-" + (safeType.isEmpty() ? "all" : safeType) + ".csv";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .header("X-Content-Type-Options", "nosniff")
                .contentType(new MediaType("text", "csv"))
                .body(csvBytes);
    }
}
