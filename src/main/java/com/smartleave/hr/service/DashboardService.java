package com.smartleave.hr.service;

import com.smartleave.hr.dto.DashboardStatisticsResponse;
import com.smartleave.hr.dto.DashboardStatisticsResponse.DepartmentDistributionStat;
import com.smartleave.hr.dto.DashboardStatisticsResponse.LeaveTrendStat;
import com.smartleave.hr.dto.DashboardStatisticsResponse.LeaveTypeDistributionStat;
import com.smartleave.hr.dto.DashboardStatisticsResponse.MonthlyLeaveStat;
import com.smartleave.hr.model.Department;
import com.smartleave.hr.model.Employee;
import com.smartleave.hr.model.LeaveRequest;
import com.smartleave.hr.model.enums.EmploymentStatus;
import com.smartleave.hr.model.enums.LeaveStatus;
import com.smartleave.hr.model.enums.LeaveType;
import com.smartleave.hr.repository.DepartmentRepository;
import com.smartleave.hr.repository.EmployeeRepository;
import com.smartleave.hr.repository.LeaveRequestRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class DashboardService {

    private static final List<String> DEPT_COLORS = List.of(
            "#3730a3", "#0284c7", "#0f766e", "#d97706", "#64748b"
    );

    private static final Map<LeaveType, String> LEAVE_TYPE_COLORS = Map.of(
            LeaveType.CASUAL, "#0284c7",
            LeaveType.SICK, "#d97706",
            LeaveType.EARNED, "#3730a3",
            LeaveType.UNPAID, "#64748b"
    );

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    public DashboardService(
            EmployeeRepository employeeRepository,
            DepartmentRepository departmentRepository,
            LeaveRequestRepository leaveRequestRepository) {
        this.employeeRepository = employeeRepository;
        this.departmentRepository = departmentRepository;
        this.leaveRequestRepository = leaveRequestRepository;
    }

    public DashboardStatisticsResponse getAdminDashboard() {
        List<Department> departments = departmentRepository.findAll();
        List<LeaveRequest> allLeaves = leaveRequestRepository.findAll();

        DashboardStatisticsResponse res = new DashboardStatisticsResponse();
        res.setTotalEmployees(employeeRepository.count());
        res.setTotalDepartments(departments.size());
        res.setPendingLeaves(leaveRequestRepository.countByStatus(LeaveStatus.PENDING));
        res.setApprovedLeaves(leaveRequestRepository.countByStatus(LeaveStatus.APPROVED));
        res.setRejectedLeaves(leaveRequestRepository.countByStatus(LeaveStatus.REJECTED));

        List<DepartmentDistributionStat> deptStats = new ArrayList<>();
        for (int i = 0; i < departments.size(); i++) {
            Department d = departments.get(i);
            long count = employeeRepository.countByDepartmentId(d.getId());
            deptStats.add(new DepartmentDistributionStat(
                    d.getName(),
                    count,
                    DEPT_COLORS.get(i % DEPT_COLORS.length)
            ));
        }
        res.setDepartmentDistribution(deptStats);
        res.setLeaveTypeDistribution(buildLeaveTypeDistribution(allLeaves));
        res.setMonthlyLeaveStats(buildMonthlyLeaveStats(allLeaves));
        res.setLeaveTrends(buildLeaveTrends(allLeaves));
        return res;
    }

    public DashboardStatisticsResponse getManagerDashboard(Employee manager) {
        List<Employee> teamMembers = employeeRepository.findByReportingManagerId(manager.getId());
        List<LeaveRequest> teamLeaves = leaveRequestRepository
                .findByEmployeeReportingManagerIdOrderByAppliedDateDescIdDesc(manager.getId());

        DashboardStatisticsResponse res = new DashboardStatisticsResponse();
        res.setTotalEmployees(teamMembers.size());
        res.setTotalDepartments(departmentRepository.count());
        res.setPendingLeaves(leaveRequestRepository.countByEmployeeReportingManagerIdAndStatus(manager.getId(), LeaveStatus.PENDING));
        res.setApprovedLeaves(leaveRequestRepository.countByEmployeeReportingManagerIdAndStatus(manager.getId(), LeaveStatus.APPROVED));
        res.setRejectedLeaves(leaveRequestRepository.countByEmployeeReportingManagerIdAndStatus(manager.getId(), LeaveStatus.REJECTED));
        res.setTeamSize((long) teamMembers.size());
        res.setEmployeesOnLeave(employeeRepository.countByReportingManagerIdAndEmploymentStatus(
                manager.getId(), EmploymentStatus.ON_LEAVE
        ));

        res.setDepartmentDistribution(List.of());
        res.setLeaveTypeDistribution(buildLeaveTypeDistribution(teamLeaves));
        res.setMonthlyLeaveStats(buildMonthlyLeaveStats(teamLeaves));
        res.setLeaveTrends(buildLeaveTrends(teamLeaves));
        return res;
    }

    public DashboardStatisticsResponse getEmployeeDashboard(Employee employee) {
        DashboardStatisticsResponse res = new DashboardStatisticsResponse();
        res.setTotalEmployees(1);
        res.setTotalDepartments(1);
        res.setPendingLeaves(leaveRequestRepository.countByEmployeeIdAndStatus(employee.getId(), LeaveStatus.PENDING));
        res.setApprovedLeaves(leaveRequestRepository.countByEmployeeIdAndStatus(employee.getId(), LeaveStatus.APPROVED));
        res.setRejectedLeaves(leaveRequestRepository.countByEmployeeIdAndStatus(employee.getId(), LeaveStatus.REJECTED));
        res.setMonthlyLeaveStats(List.of());
        res.setDepartmentDistribution(List.of());
        res.setLeaveTypeDistribution(List.of());
        res.setLeaveTrends(List.of());
        return res;
    }

    private List<LeaveTypeDistributionStat> buildLeaveTypeDistribution(List<LeaveRequest> leaves) {
        Map<LeaveType, Long> counts = new EnumMap<>(LeaveType.class);
        for (LeaveType type : LeaveType.values()) {
            counts.put(type, 0L);
        }
        for (LeaveRequest req : leaves) {
            counts.put(req.getLeaveType(), counts.get(req.getLeaveType()) + 1);
        }

        List<LeaveTypeDistributionStat> result = new ArrayList<>();
        for (LeaveType type : LeaveType.values()) {
            String label = switch (type) {
                case CASUAL -> "Casual Leave";
                case SICK -> "Sick Leave";
                case EARNED -> "Earned Leave";
                case UNPAID -> "Unpaid Leave";
            };
            result.add(new LeaveTypeDistributionStat(
                    label,
                    counts.get(type),
                    type,
                    LEAVE_TYPE_COLORS.get(type)
            ));
        }
        return result;
    }

    private List<MonthlyLeaveStat> buildMonthlyLeaveStats(List<LeaveRequest> leaves) {
        LocalDate now = LocalDate.now();
        List<MonthlyLeaveStat> stats = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.from(now.minusMonths(i));
            String monthLabel = ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

            long approved = leaves.stream()
                    .filter(r -> YearMonth.from(r.getAppliedDate()).equals(ym) && r.getStatus() == LeaveStatus.APPROVED)
                    .count();
            long pending = leaves.stream()
                    .filter(r -> YearMonth.from(r.getAppliedDate()).equals(ym) && r.getStatus() == LeaveStatus.PENDING)
                    .count();
            long rejected = leaves.stream()
                    .filter(r -> YearMonth.from(r.getAppliedDate()).equals(ym) && r.getStatus() == LeaveStatus.REJECTED)
                    .count();

            stats.add(new MonthlyLeaveStat(monthLabel, approved, pending, rejected));
        }
        return stats;
    }

    private List<LeaveTrendStat> buildLeaveTrends(List<LeaveRequest> leaves) {
        LocalDate now = LocalDate.now();
        List<LeaveTrendStat> trends = new ArrayList<>();
        for (int i = 5; i >= 0; i--) {
            YearMonth ym = YearMonth.from(now.minusMonths(i));
            String monthLabel = ym.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);

            long applications = leaves.stream()
                    .filter(r -> YearMonth.from(r.getAppliedDate()).equals(ym))
                    .count();
            long approvals = leaves.stream()
                    .filter(r -> YearMonth.from(r.getAppliedDate()).equals(ym) && r.getStatus() == LeaveStatus.APPROVED)
                    .count();

            trends.add(new LeaveTrendStat(monthLabel, applications, approvals));
        }
        return trends;
    }
}
