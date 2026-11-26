package com.smartleave.hr.service;

import com.smartleave.hr.dto.LeaveApplyRequest;
import com.smartleave.hr.dto.LeaveBalanceResponse;
import com.smartleave.hr.dto.LeaveResponse;
import com.smartleave.hr.exception.BadRequestException;
import com.smartleave.hr.exception.ConflictException;
import com.smartleave.hr.model.Department;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.model.LeavePolicy;
import com.smartleave.hr.model.LeaveRequest;
import com.smartleave.hr.model.enums.LeaveStatus;
import com.smartleave.hr.model.enums.LeaveType;
import com.smartleave.hr.model.enums.NotificationCategory;
import com.smartleave.hr.model.enums.UserRole;
import com.smartleave.hr.repository.EmployeeRepository;
import com.smartleave.hr.repository.LeaveDocumentRepository;
import com.smartleave.hr.repository.LeavePolicyRepository;
import com.smartleave.hr.repository.LeaveRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeaveServiceTest {

    @Mock private LeaveRequestRepository leaveRequestRepository;
    @Mock private LeavePolicyRepository leavePolicyRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private LeaveDocumentRepository leaveDocumentRepository;
    @Mock private NotificationService notificationService;
    @Mock private LeaveBalanceService leaveBalanceService;

    @InjectMocks
    private LeaveService leaveService;

    private Department engineering;
    private Employee manager;
    private Employee otherManager;
    private Employee employee;
    private LeavePolicy casualPolicy;

    @BeforeEach
    void setUp() {
        engineering = new Department();
        engineering.setId(1L);
        engineering.setName("Engineering");

        manager = new Employee();
        manager.setId(2L);
        manager.setEmployeeId("EMP-1001");
        manager.setFullName("Marcus Vance");
        manager.setDepartment(engineering);
        manager.setRole(UserRole.MANAGER);

        otherManager = new Employee();
        otherManager.setId(7L);
        otherManager.setEmployeeId("EMP-1007");
        otherManager.setFullName("Ethan Cole");
        otherManager.setDepartment(engineering);
        otherManager.setRole(UserRole.MANAGER);

        employee = new Employee();
        employee.setId(3L);
        employee.setEmployeeId("EMP-1002");
        employee.setFullName("Liam Mercer");
        employee.setDesignation("Developer");
        employee.setDepartment(engineering);
        employee.setReportingManager(manager);
        employee.setRole(UserRole.EMPLOYEE);

        casualPolicy = new LeavePolicy();
        casualPolicy.setId(1L);
        casualPolicy.setLeaveType(LeaveType.CASUAL);
        casualPolicy.setDisplayName("Casual Leave");
        casualPolicy.setAnnualAllowance(12);
        casualPolicy.setIsActive(true);
    }

    @Test
    void calculateWorkingDays_excludesSaturdaysAndSundays() {
        // Friday to next Monday = 2 working days (Fri + Mon, skipping Sat & Sun)
        LocalDate friday = LocalDate.of(2026, 12, 4);
        LocalDate monday = LocalDate.of(2026, 12, 7);
        assertEquals(2, LeaveService.calculateWorkingDays(friday, monday));

        // Saturday to Sunday = 0 working days
        assertEquals(0, LeaveService.calculateWorkingDays(
                LocalDate.of(2026, 12, 5),
                LocalDate.of(2026, 12, 6)
        ));
    }

    @Test
    void applyLeave_weekendOnlyRange_throwsBadRequest() {
        LocalDate nextSaturday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.SATURDAY));
        LocalDate nextSunday = nextSaturday.plusDays(1);

        LeaveApplyRequest req = new LeaveApplyRequest();
        req.setLeaveType(LeaveType.CASUAL);
        req.setStartDate(nextSaturday);
        req.setEndDate(nextSunday);
        req.setReason("Weekend trip request test");

        assertThrows(BadRequestException.class, () -> leaveService.applyLeave(req, employee));
    }

    @Test
    void applyLeave_overlappingPendingOrApproved_throwsConflict() {
        LocalDate monday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        LocalDate wednesday = monday.plusDays(2);

        LeaveApplyRequest req = new LeaveApplyRequest();
        req.setLeaveType(LeaveType.CASUAL);
        req.setStartDate(monday);
        req.setEndDate(wednesday);
        req.setReason("Personal work during week");

        when(leaveRequestRepository.existsOverlappingLeave(eq(3L), eq(monday), eq(wednesday), anyList()))
                .thenReturn(true);

        assertThrows(ConflictException.class, () -> leaveService.applyLeave(req, employee));
        verify(leaveRequestRepository, never()).save(any());
    }

    @Test
    void applyLeave_insufficientBalance_throwsBadRequest() {
        LocalDate monday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        LocalDate friday = monday.plusDays(4); // 5 working days

        LeaveApplyRequest req = new LeaveApplyRequest();
        req.setLeaveType(LeaveType.CASUAL);
        req.setStartDate(monday);
        req.setEndDate(friday);
        req.setReason("Family travel across week");

        LeaveBalanceResponse bal = new LeaveBalanceResponse();
        bal.setCasual(new LeaveBalanceResponse.BalanceItem(LeaveType.CASUAL, "Casual Leave", 12, 0, 10, 0));
        bal.setSick(new LeaveBalanceResponse.BalanceItem(LeaveType.SICK, "Sick Leave", 10, 0, 0, 0));
        bal.setEarned(new LeaveBalanceResponse.BalanceItem(LeaveType.EARNED, "Earned Leave", 18, 0, 0, 0));
        bal.setUnpaid(new LeaveBalanceResponse.BalanceItem(LeaveType.UNPAID, "Unpaid Leave", 30, 0, 0, 0));

        when(leaveRequestRepository.existsOverlappingLeave(anyLong(), any(), any(), anyList())).thenReturn(false);
        when(leavePolicyRepository.findByLeaveType(LeaveType.CASUAL)).thenReturn(Optional.of(casualPolicy));
        when(leaveBalanceService.computeAndSyncBalance(3L, monday.getYear())).thenReturn(bal);

        assertThrows(BadRequestException.class, () -> leaveService.applyLeave(req, employee));
    }

    @Test
    void applyLeave_validRequest_savesAndNotifiesAssignedManagerOnly() {
        LocalDate friday = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.FRIDAY));
        LocalDate monday = friday.plusDays(3); // Fri..Mon = 2 working days

        LeaveApplyRequest req = new LeaveApplyRequest();
        req.setLeaveType(LeaveType.CASUAL);
        req.setStartDate(friday);
        req.setEndDate(monday);
        req.setReason("Long weekend personal break");

        LeaveBalanceResponse bal = new LeaveBalanceResponse();
        bal.setCasual(new LeaveBalanceResponse.BalanceItem(LeaveType.CASUAL, "Casual Leave", 12, 0, 2, 0));
        bal.setSick(new LeaveBalanceResponse.BalanceItem(LeaveType.SICK, "Sick Leave", 10, 0, 0, 0));
        bal.setEarned(new LeaveBalanceResponse.BalanceItem(LeaveType.EARNED, "Earned Leave", 18, 0, 0, 0));
        bal.setUnpaid(new LeaveBalanceResponse.BalanceItem(LeaveType.UNPAID, "Unpaid Leave", 30, 0, 0, 0));

        when(leaveRequestRepository.existsOverlappingLeave(anyLong(), any(), any(), anyList())).thenReturn(false);
        when(leavePolicyRepository.findByLeaveType(LeaveType.CASUAL)).thenReturn(Optional.of(casualPolicy));
        when(leaveBalanceService.computeAndSyncBalance(3L, friday.getYear())).thenReturn(bal);
        when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(inv -> {
            LeaveRequest saved = inv.getArgument(0);
            saved.setId(99L);
            return saved;
        });
        when(leaveDocumentRepository.existsByLeaveRequestId(99L)).thenReturn(false);

        LeaveResponse response = leaveService.applyLeave(req, employee);

        assertEquals(2, response.getNumberOfDays());
        assertEquals(LeaveStatus.PENDING, response.getStatus());
        verify(notificationService).createNotification(
                eq("New Leave Application"),
                contains("2 working day(s)"),
                eq(NotificationCategory.LEAVE_APPLIED),
                eq("MANAGER"),
                eq(2L),
                eq("/manager/approvals")
        );
    }

    @Test
    void approveLeave_byUnauthorizedManager_throwsAccessDenied() {
        LeaveRequest pending = new LeaveRequest();
        pending.setId(44L);
        pending.setEmployee(employee);
        pending.setStatus(LeaveStatus.PENDING);

        when(leaveRequestRepository.findById(44L)).thenReturn(Optional.of(pending));

        assertThrows(AccessDeniedException.class, () -> leaveService.approveLeave(44L, otherManager));
    }

    @Test
    void approveAndReject_byReportingManager_updatesStatusBalanceAndNotifiesEmployee() {
        LeaveRequest pending = new LeaveRequest();
        pending.setId(45L);
        pending.setApplicationId("LR-2026-0045");
        pending.setEmployee(employee);
        pending.setLeaveType(LeaveType.CASUAL);
        pending.setStartDate(LocalDate.of(2026, 12, 1));
        pending.setEndDate(LocalDate.of(2026, 12, 2));
        pending.setNumberOfDays(2);
        pending.setStatus(LeaveStatus.PENDING);

        when(leaveRequestRepository.findById(45L)).thenReturn(Optional.of(pending));
        when(leaveRequestRepository.save(any(LeaveRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(leaveDocumentRepository.existsByLeaveRequestId(45L)).thenReturn(false);

        LeaveResponse approved = leaveService.approveLeave(45L, manager);
        assertEquals(LeaveStatus.APPROVED, approved.getStatus());
        assertEquals("Marcus Vance", approved.getReviewedBy());
        verify(leaveBalanceService).syncBalanceForType(employee, LeaveType.CASUAL, 2026);
        verify(notificationService).createNotification(
                eq("Leave Request Approved"),
                contains("LR-2026-0045"),
                eq(NotificationCategory.LEAVE_APPROVED),
                eq("EMPLOYEE"),
                eq(3L),
                eq("/employee/requests")
        );

        pending.setStatus(LeaveStatus.PENDING);
        LeaveResponse rejected = leaveService.rejectLeave(45L, "Release freeze active", manager);
        assertEquals(LeaveStatus.REJECTED, rejected.getStatus());
        assertEquals("Release freeze active", rejected.getRejectionReason());
    }
}
