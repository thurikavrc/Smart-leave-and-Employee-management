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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
public class LeaveBalanceService {

    private final LeaveBalanceRepository leaveBalanceRepository;
    private final LeavePolicyRepository leavePolicyRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final OrganizationSettingsService organizationSettingsService;

    public LeaveBalanceService(
            LeaveBalanceRepository leaveBalanceRepository,
            LeavePolicyRepository leavePolicyRepository,
            LeaveRequestRepository leaveRequestRepository,
            EmployeeRepository employeeRepository,
            OrganizationSettingsService organizationSettingsService) {
        this.leaveBalanceRepository = leaveBalanceRepository;
        this.leavePolicyRepository = leavePolicyRepository;
        this.leaveRequestRepository = leaveRequestRepository;
        this.employeeRepository = employeeRepository;
        this.organizationSettingsService = organizationSettingsService;
    }

    @Transactional
    public LeaveBalanceResponse computeAndSyncBalance(Long employeeId, int year) {
        Employee employee = employeeRepository.findById(employeeId).orElse(null);
        List<LeavePolicy> policies = leavePolicyRepository.findAll();
        Map<LeaveType, LeavePolicy> policyMap = new EnumMap<>(LeaveType.class);
        for (LeavePolicy p : policies) {
            policyMap.put(p.getLeaveType(), p);
        }

        OrganizationSettings settings = organizationSettingsService.getOrCreateEntity();
        int maxCarryForward = settings.getMaxCarryForwardDays() != null ? settings.getMaxCarryForwardDays() : 10;

        List<LeaveRequest> yearRequests = leaveRequestRepository.findByEmployeeIdAndYear(employeeId, year);
        List<LeaveRequest> prevYearRequests = leaveRequestRepository.findByEmployeeIdAndYear(employeeId, year - 1);

        LeaveBalanceResponse response = new LeaveBalanceResponse();
        response.setEmployeeId(employeeId);
        response.setYear(year);
        response.setCasual(buildAndPersistItem(employee, LeaveType.CASUAL, "Casual Leave", 12, year, maxCarryForward, policyMap, yearRequests, prevYearRequests));
        response.setSick(buildAndPersistItem(employee, LeaveType.SICK, "Sick Leave", 10, year, maxCarryForward, policyMap, yearRequests, prevYearRequests));
        response.setEarned(buildAndPersistItem(employee, LeaveType.EARNED, "Earned Leave", 18, year, maxCarryForward, policyMap, yearRequests, prevYearRequests));
        response.setUnpaid(buildAndPersistItem(employee, LeaveType.UNPAID, "Unpaid Leave", 30, year, maxCarryForward, policyMap, yearRequests, prevYearRequests));
        return response;
    }

    @Transactional
    public void syncBalanceForType(Employee employee, LeaveType type, int year) {
        LeavePolicy policy = leavePolicyRepository.findByLeaveType(type).orElse(null);
        if (policy == null) {
            return;
        }
        OrganizationSettings settings = organizationSettingsService.getOrCreateEntity();
        int maxCarryForward = settings.getMaxCarryForwardDays() != null ? settings.getMaxCarryForwardDays() : 10;

        List<LeaveRequest> yearRequests = leaveRequestRepository.findByEmployeeIdAndYear(employee.getId(), year);
        List<LeaveRequest> prevYearRequests = leaveRequestRepository.findByEmployeeIdAndYear(employee.getId(), year - 1);

        Map<LeaveType, LeavePolicy> singlePolicyMap = new EnumMap<>(LeaveType.class);
        singlePolicyMap.put(type, policy);

        buildAndPersistItem(
                employee,
                type,
                policy.getDisplayName(),
                policy.getAnnualAllowance(),
                year,
                maxCarryForward,
                singlePolicyMap,
                yearRequests,
                prevYearRequests
        );
    }

    @Transactional
    public void initializeBalancesForYear(Employee employee, int year) {
        computeAndSyncBalance(employee.getId(), year);
    }

    private LeaveBalanceResponse.BalanceItem buildAndPersistItem(
            Employee employee,
            LeaveType type,
            String fallbackLabel,
            int fallbackAllowance,
            int year,
            int maxCarryForward,
            Map<LeaveType, LeavePolicy> policyMap,
            List<LeaveRequest> yearRequests,
            List<LeaveRequest> prevYearRequests) {

        LeavePolicy policy = policyMap.get(type);
        String label = policy != null ? policy.getDisplayName() : fallbackLabel;
        int annualAllowance = policy != null ? policy.getAnnualAllowance() : fallbackAllowance;

        int carriedForward = 0;
        if (policy != null && Boolean.TRUE.equals(policy.getCarryForwardAllowed())
                && employee != null
                && employee.getDateOfJoining() != null
                && employee.getDateOfJoining().getYear() < year) {
            int prevUsed = prevYearRequests.stream()
                    .filter(r -> r.getLeaveType() == type && r.getStatus() == LeaveStatus.APPROVED)
                    .mapToInt(LeaveRequest::getNumberOfDays)
                    .sum();
            int prevUnused = Math.max(0, annualAllowance - prevUsed);
            carriedForward = Math.min(prevUnused, maxCarryForward);
        }

        int used = yearRequests.stream()
                .filter(r -> r.getLeaveType() == type && r.getStatus() == LeaveStatus.APPROVED)
                .mapToInt(LeaveRequest::getNumberOfDays)
                .sum();

        int pending = yearRequests.stream()
                .filter(r -> r.getLeaveType() == type && r.getStatus() == LeaveStatus.PENDING)
                .mapToInt(LeaveRequest::getNumberOfDays)
                .sum();

        int totalAllowed = annualAllowance + carriedForward;
        int remaining = Math.max(0, totalAllowed - used);

        if (employee != null && policy != null) {
            LeaveBalance balance = leaveBalanceRepository
                    .findByEmployeeIdAndLeaveTypeAndLeaveYear(employee.getId(), type, year)
                    .orElseGet(LeaveBalance::new);
            balance.setEmployee(employee);
            balance.setLeavePolicy(policy);
            balance.setLeaveType(type);
            balance.setLeaveYear(year);
            balance.setAllocatedDays(annualAllowance);
            balance.setCarriedForwardDays(carriedForward);
            balance.setUsedDays(used);
            balance.setPendingDays(pending);
            balance.setRemainingDays(remaining);
            balance.setUpdatedAt(Instant.now());
            leaveBalanceRepository.save(balance);
        }

        return new LeaveBalanceResponse.BalanceItem(
                type, label, annualAllowance, carriedForward, used, pending
        );
    }

    public int getCurrentYear() {
        return LocalDate.now().getYear();
    }
}
