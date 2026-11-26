package com.smartleave.hr.service;

import com.smartleave.hr.dto.LeaveBalanceResponse;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.model.LeaveBalance;
import com.smartleave.hr.model.LeavePolicy;
import com.smartleave.hr.model.LeaveRequest;
import com.smartleave.hr.model.OrganizationSettings;
import com.smartleave.hr.model.enums.LeaveStatus;
import com.smartleave.hr.model.enums.LeaveType;
import com.smartleave.hr.repository.EmployeeRepository;
import com.smartleave.hr.repository.LeaveBalanceRepository;
import com.smartleave.hr.repository.LeavePolicyRepository;
import com.smartleave.hr.repository.LeaveRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LeaveBalanceServiceTest {

    @Mock private LeaveBalanceRepository leaveBalanceRepository;
    @Mock private LeavePolicyRepository leavePolicyRepository;
    @Mock private LeaveRequestRepository leaveRequestRepository;
    @Mock private EmployeeRepository employeeRepository;
    @Mock private OrganizationSettingsService organizationSettingsService;

    @InjectMocks
    private LeaveBalanceService leaveBalanceService;

    private Employee tenuredEmployee;
    private Employee newHireEmployee;
    private LeavePolicy casualPolicy;
    private LeavePolicy earnedPolicy;
    private OrganizationSettings settings;

    @BeforeEach
    void setUp() {
        tenuredEmployee = new Employee();
        tenuredEmployee.setId(3L);
        tenuredEmployee.setDateOfJoining(LocalDate.of(2024, 5, 1));

        newHireEmployee = new Employee();
        newHireEmployee.setId(4L);
        newHireEmployee.setDateOfJoining(LocalDate.of(2026, 2, 1));

        casualPolicy = new LeavePolicy();
        casualPolicy.setLeaveType(LeaveType.CASUAL);
        casualPolicy.setDisplayName("Casual Leave");
        casualPolicy.setAnnualAllowance(12);
        casualPolicy.setCarryForwardAllowed(false);

        earnedPolicy = new LeavePolicy();
        earnedPolicy.setLeaveType(LeaveType.EARNED);
        earnedPolicy.setDisplayName("Earned Leave");
        earnedPolicy.setAnnualAllowance(18);
        earnedPolicy.setCarryForwardAllowed(true);

        settings = new OrganizationSettings();
        settings.setMaxCarryForwardDays(10);
    }

    @Test
    void computeAndSyncBalance_appliesCarryForwardCappedBySettingsForTenuredEmployee() {
        LeaveRequest prevEarnedApproved = new LeaveRequest();
        prevEarnedApproved.setLeaveType(LeaveType.EARNED);
        prevEarnedApproved.setStatus(LeaveStatus.APPROVED);
        prevEarnedApproved.setNumberOfDays(3); // 18 - 3 = 15 unused -> capped at 10

        LeaveRequest currEarnedApproved = new LeaveRequest();
        currEarnedApproved.setLeaveType(LeaveType.EARNED);
        currEarnedApproved.setStatus(LeaveStatus.APPROVED);
        currEarnedApproved.setNumberOfDays(4);

        LeaveRequest currCasualPending = new LeaveRequest();
        currCasualPending.setLeaveType(LeaveType.CASUAL);
        currCasualPending.setStatus(LeaveStatus.PENDING);
        currCasualPending.setNumberOfDays(2);

        when(employeeRepository.findById(3L)).thenReturn(Optional.of(tenuredEmployee));
        when(leavePolicyRepository.findAll()).thenReturn(List.of(casualPolicy, earnedPolicy));
        when(organizationSettingsService.getOrCreateEntity()).thenReturn(settings);
        when(leaveRequestRepository.findByEmployeeIdAndYear(3L, 2026))
                .thenReturn(List.of(currEarnedApproved, currCasualPending));
        when(leaveRequestRepository.findByEmployeeIdAndYear(3L, 2025))
                .thenReturn(List.of(prevEarnedApproved));
        when(leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndLeaveYear(any(), any(), eq(2026)))
                .thenReturn(Optional.empty());
        when(leaveBalanceRepository.save(any(LeaveBalance.class))).thenAnswer(inv -> inv.getArgument(0));

        LeaveBalanceResponse res = leaveBalanceService.computeAndSyncBalance(3L, 2026);

        assertEquals(2026, res.getYear());
        // Casual: carryForwardAllowed = false -> 12 total, 0 carried forward, 2 pending
        assertEquals(0, res.getCasual().getCarriedForward());
        assertEquals(12, res.getCasual().getTotalAllowed());
        assertEquals(2, res.getCasual().getPending());
        assertEquals(12, res.getCasual().getRemaining());

        // Earned: 18 annual + 10 carried forward (capped from 15 unused in 2025) = 28 total; 4 used -> 24 remaining
        assertEquals(10, res.getEarned().getCarriedForward());
        assertEquals(28, res.getEarned().getTotalAllowed());
        assertEquals(4, res.getEarned().getUsed());
        assertEquals(24, res.getEarned().getRemaining());
    }

    @Test
    void computeAndSyncBalance_noCarryForwardInJoiningYear() {
        when(employeeRepository.findById(4L)).thenReturn(Optional.of(newHireEmployee));
        when(leavePolicyRepository.findAll()).thenReturn(List.of(casualPolicy, earnedPolicy));
        when(organizationSettingsService.getOrCreateEntity()).thenReturn(settings);
        when(leaveRequestRepository.findByEmployeeIdAndYear(4L, 2026)).thenReturn(List.of());
        when(leaveRequestRepository.findByEmployeeIdAndYear(4L, 2025)).thenReturn(List.of());
        when(leaveBalanceRepository.findByEmployeeIdAndLeaveTypeAndLeaveYear(any(), any(), eq(2026)))
                .thenReturn(Optional.empty());
        when(leaveBalanceRepository.save(any(LeaveBalance.class))).thenAnswer(inv -> inv.getArgument(0));

        LeaveBalanceResponse res = leaveBalanceService.computeAndSyncBalance(4L, 2026);

        assertEquals(0, res.getEarned().getCarriedForward());
        assertEquals(18, res.getEarned().getTotalAllowed());
    }
}
