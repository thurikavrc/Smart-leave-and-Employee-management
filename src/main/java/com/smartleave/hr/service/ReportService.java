package com.smartleave.hr.service;

import com.smartleave.hr.dto.LeaveReportResponse;
import com.smartleave.hr.dto.LeaveReportResponse.DepartmentReportStat;
import com.smartleave.hr.dto.LeaveReportResponse.MonthlyReportStat;
import com.smartleave.hr.dto.LeaveResponse;
import com.smartleave.hr.dto.PagedResponse;
import com.smartleave.hr.model.Department;
import com.smartleave.hr.model.LeaveRequest;
import com.smartleave.hr.model.enums.LeaveStatus;
import com.smartleave.hr.model.enums.LeaveType;
import com.smartleave.hr.repository.DepartmentRepository;
import com.smartleave.hr.repository.LeaveRequestRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Service
public class ReportService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final DepartmentRepository departmentRepository;
    private final LeaveService leaveService;

    public ReportService(
            LeaveRequestRepository leaveRequestRepository,
            DepartmentRepository departmentRepository,
            LeaveService leaveService) {
        this.leaveRequestRepository = leaveRequestRepository;
        this.departmentRepository = departmentRepository;
        this.leaveService = leaveService;
    }

    public LeaveReportResponse getLeaveReport(
            String reportType,
            LocalDate fromDate,
            LocalDate toDate,
            String departmentName,
            LeaveType leaveType,
            int page,
            int size) {

        LeaveStatus effectiveStatus = resolveStatusFromReportType(reportType);
        String cleanDept = departmentName != null && !departmentName.isBlank() && !"ALL".equalsIgnoreCase(departmentName)
                ? departmentName.trim()
                : null;

        int safePage = Math.max(0, page - 1);
        int safeSize = Math.min(Math.max(1, size), 100);

        Page<LeaveRequest> paged = leaveRequestRepository.searchLeaves(
                null,
                null,
                effectiveStatus,
                leaveType,
                cleanDept,
                fromDate,
                toDate,
                null,
                PageRequest.of(safePage, safeSize)
        );

        List<LeaveRequest> matching = leaveRequestRepository.findLeavesForReport(
                effectiveStatus,
                leaveType,
                cleanDept,
                fromDate,
                toDate
        );

        Map<String, long[]> deptMap = new LinkedHashMap<>();
        for (Department d : departmentRepository.findAll()) {
            deptMap.put(d.getName(), new long[]{0L, 0L, 0L});
        }
        Map<String, long[]> monthMap = new TreeMap<>(Comparator.naturalOrder());

        long totalDays = 0L;
        for (LeaveRequest req : matching) {
            int days = req.getNumberOfDays() != null ? req.getNumberOfDays() : 0;
            totalDays += days;

            String dept = req.getEmployee().getDepartment().getName();
            long[] dCounts = deptMap.computeIfAbsent(dept, k -> new long[]{0L, 0L, 0L});
            if (req.getStatus() == LeaveStatus.APPROVED) dCounts[0] += days;
            if (req.getStatus() == LeaveStatus.PENDING) dCounts[1] += days;
            if (req.getStatus() == LeaveStatus.REJECTED) dCounts[2] += days;

            String monthKey = req.getStartDate().toString().substring(0, 7);
            long[] mCounts = monthMap.computeIfAbsent(monthKey, k -> new long[]{0L, 0L});
            mCounts[0] += days;
            mCounts[1] += 1;
        }

        List<DepartmentReportStat> deptStats = deptMap.entrySet().stream()
                .map(e -> new DepartmentReportStat(e.getKey(), e.getValue()[0], e.getValue()[1], e.getValue()[2]))
                .toList();

        List<MonthlyReportStat> monthStats = monthMap.entrySet().stream()
                .map(e -> new MonthlyReportStat(e.getKey(), e.getValue()[0], e.getValue()[1]))
                .toList();

        PagedResponse<LeaveResponse> recordsPage = PagedResponse.fromPage(paged.map(leaveService::toResponse));

        LeaveReportResponse response = new LeaveReportResponse();
        response.setRecords(recordsPage);
        response.setDepartmentBreakdown(deptStats);
        response.setMonthlyBreakdown(monthStats);
        response.setTotalMatchingRecords(matching.size());
        response.setTotalLeaveDays(totalDays);
        return response;
    }

    public byte[] exportLeaveReportCsv(
            String reportType,
            LocalDate fromDate,
            LocalDate toDate,
            String departmentName,
            LeaveType leaveType) {

        LeaveStatus effectiveStatus = resolveStatusFromReportType(reportType);
        String cleanDept = departmentName != null && !departmentName.isBlank() && !"ALL".equalsIgnoreCase(departmentName)
                ? departmentName.trim()
                : null;

        List<LeaveRequest> rows = leaveRequestRepository.findLeavesForReport(
                effectiveStatus,
                leaveType,
                cleanDept,
                fromDate,
                toDate
        );

        StringBuilder sb = new StringBuilder();
        sb.append("Application ID,Employee ID,Employee Name,Department,Leave Type,Start Date,End Date,Days,Applied Date,Status,Reviewed By,Rejection Reason\n");
        for (LeaveRequest r : rows) {
            sb.append(escapeCsv(r.getApplicationId())).append(',')
              .append(escapeCsv(r.getEmployee().getEmployeeId())).append(',')
              .append(escapeCsv(r.getEmployee().getFullName())).append(',')
              .append(escapeCsv(r.getEmployee().getDepartment().getName())).append(',')
              .append(escapeCsv(r.getLeaveType().name())).append(',')
              .append(escapeCsv(r.getStartDate().toString())).append(',')
              .append(escapeCsv(r.getEndDate().toString())).append(',')
              .append(r.getNumberOfDays() != null ? r.getNumberOfDays() : 0).append(',')
              .append(escapeCsv(r.getAppliedDate().toString())).append(',')
              .append(escapeCsv(r.getStatus().name())).append(',')
              .append(escapeCsv(r.getReviewedBy() != null ? r.getReviewedBy() : "")).append(',')
              .append(escapeCsv(r.getRejectionReason() != null ? r.getRejectionReason() : ""))
              .append('\n');
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private LeaveStatus resolveStatusFromReportType(String reportType) {
        if (reportType == null || reportType.isBlank()) {
            return null;
        }
        return switch (reportType.trim().toUpperCase()) {
            case "APPROVED" -> LeaveStatus.APPROVED;
            case "PENDING" -> LeaveStatus.PENDING;
            case "REJECTED" -> LeaveStatus.REJECTED;
            default -> null;
        };
    }

    private String escapeCsv(String raw) {
        String value = raw == null ? "" : raw;
        if (!value.isEmpty()) {
            char first = value.charAt(0);
            if (first == '=' || first == '+' || first == '-' || first == '@' || first == '\t' || first == '\r') {
                value = "'" + value;
            }
        }
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
