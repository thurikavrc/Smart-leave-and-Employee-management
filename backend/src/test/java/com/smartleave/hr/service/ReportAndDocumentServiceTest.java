package com.smartleave.hr.service;

import com.smartleave.hr.dto.LeaveReportResponse;
import com.smartleave.hr.dto.LeaveResponse;
import com.smartleave.hr.exception.BadRequestException;
import com.smartleave.hr.model.Department;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.model.LeaveDocument;
import com.smartleave.hr.model.LeaveRequest;
import com.smartleave.hr.model.enums.LeaveStatus;
import com.smartleave.hr.model.enums.LeaveType;
import com.smartleave.hr.model.enums.UserRole;
import com.smartleave.hr.repository.DepartmentRepository;
import com.smartleave.hr.repository.LeaveDocumentRepository;
import com.smartleave.hr.repository.LeaveRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;

import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportAndDocumentServiceTest {

    @Mock private LeaveRequestRepository leaveRequestRepository;
    @Mock private DepartmentRepository departmentRepository;
    @Mock private LeaveService leaveService;
    @Mock private LeaveDocumentRepository leaveDocumentRepository;

    private ReportService reportService;
    private LeaveDocumentService leaveDocumentService;

    private Department engineering;
    private Employee owner;
    private Employee otherEmployee;
    private LeaveRequest leave;

    @BeforeEach
    void setUp() {
        reportService = new ReportService(leaveRequestRepository, departmentRepository, leaveService);
        leaveDocumentService = new LeaveDocumentService(leaveDocumentRepository, leaveRequestRepository);

        engineering = new Department();
        engineering.setId(1L);
        engineering.setName("Engineering");

        owner = new Employee();
        owner.setId(3L);
        owner.setEmployeeId("EMP-1002");
        owner.setFullName("Liam Mercer");
        owner.setDepartment(engineering);
        owner.setRole(UserRole.EMPLOYEE);

        otherEmployee = new Employee();
        otherEmployee.setId(9L);
        otherEmployee.setEmployeeId("EMP-1009");
        otherEmployee.setFullName("Other User");
        otherEmployee.setDepartment(engineering);
        otherEmployee.setRole(UserRole.EMPLOYEE);

        leave = new LeaveRequest();
        leave.setId(11L);
        leave.setApplicationId("LR-2026-0011");
        leave.setEmployee(owner);
        leave.setLeaveType(LeaveType.SICK);
        leave.setStartDate(LocalDate.of(2026, 11, 2));
        leave.setEndDate(LocalDate.of(2026, 11, 3));
        leave.setNumberOfDays(2);
        leave.setAppliedDate(LocalDate.of(2026, 11, 1));
        leave.setStatus(LeaveStatus.APPROVED);
        leave.setReviewedBy("Marcus Vance");
        leave.setRejectionReason("=CMD|'/C calc'!A0");
    }

    @Test
    void exportLeaveReportCsv_escapesSpreadsheetFormulas() {
        when(leaveRequestRepository.findLeavesForReport(isNull(), isNull(), isNull(), isNull(), isNull()))
                .thenReturn(List.of(leave));

        byte[] csvBytes = reportService.exportLeaveReportCsv("ALL", null, null, null, null);
        String csv = new String(csvBytes, StandardCharsets.UTF_8);

        assertTrue(csv.contains("Application ID,Employee ID,Employee Name"));
        assertTrue(csv.contains("\"'=CMD|'/C calc'!A0\""));
    }

    @Test
    void getLeaveReport_aggregatesDepartmentAndMonthlyStats() {
        LeaveResponse dto = new LeaveResponse();
        dto.setId(11L);
        dto.setApplicationId("LR-2026-0011");

        when(leaveRequestRepository.searchLeaves(isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), isNull(), any(PageRequest.class)))
                .thenReturn(new PageImpl<>(List.of(leave), PageRequest.of(0, 10), 1));
        when(leaveRequestRepository.findLeavesForReport(isNull(), isNull(), isNull(), isNull(), isNull()))
                .thenReturn(List.of(leave));
        when(departmentRepository.findAll()).thenReturn(List.of(engineering));
        when(leaveService.toResponse(leave)).thenReturn(dto);

        LeaveReportResponse res = reportService.getLeaveReport("ALL", null, null, null, null, 1, 10);

        assertEquals(1, res.getTotalMatchingRecords());
        assertEquals(2L, res.getTotalLeaveDays());
        assertEquals(1, res.getMonthlyBreakdown().size());
        assertEquals("2026-11", res.getMonthlyBreakdown().get(0).getMonth());
    }

    @Test
    void uploadDocument_validPdfByOwner_persistsBinaryDocument() {
        MockMultipartFile pdf = new MockMultipartFile(
                "file",
                "medical_note.pdf",
                "application/pdf",
                "PDF-CONTENT".getBytes(StandardCharsets.UTF_8)
        );
        when(leaveRequestRepository.findById(11L)).thenReturn(Optional.of(leave));
        when(leaveDocumentRepository.findByLeaveRequestId(11L)).thenReturn(Optional.empty());
        when(leaveDocumentRepository.save(any(LeaveDocument.class))).thenAnswer(inv -> inv.getArgument(0));

        LeaveDocument doc = leaveDocumentService.uploadDocument(11L, pdf, owner);

        assertEquals("medical_note.pdf", doc.getOriginalFilename());
        assertEquals("medical_note.pdf", leave.getSupportingDocumentName());
    }

    @Test
    void uploadDocument_disallowedExecutableExtension_throwsBadRequest() {
        MockMultipartFile exe = new MockMultipartFile(
                "file",
                "malware.exe",
                "application/octet-stream",
                "MZ".getBytes(StandardCharsets.UTF_8)
        );
        when(leaveRequestRepository.findById(11L)).thenReturn(Optional.of(leave));

        assertThrows(BadRequestException.class, () -> leaveDocumentService.uploadDocument(11L, exe, owner));
    }

    @Test
    void getDocumentForDownload_unauthorizedEmployee_throwsAccessDenied() {
        when(leaveRequestRepository.findById(11L)).thenReturn(Optional.of(leave));

        assertThrows(AccessDeniedException.class,
                () -> leaveDocumentService.getDocumentForDownload(11L, otherEmployee));
    }
}
