package com.smartleave.hr.dto;

import com.smartleave.hr.model.enums.LeaveType;
import java.util.List;

public class DashboardStatisticsResponse {
    private long totalEmployees;
    private long totalDepartments;
    private long pendingLeaves;
    private long approvedLeaves;
    private long rejectedLeaves;
    private Long teamSize;
    private Long employeesOnLeave;
    private List<MonthlyLeaveStat> monthlyLeaveStats;
    private List<DepartmentDistributionStat> departmentDistribution;
    private List<LeaveTypeDistributionStat> leaveTypeDistribution;
    private List<LeaveTrendStat> leaveTrends;

    public static class MonthlyLeaveStat {
        private String month;
        private long approved;
        private long pending;
        private long rejected;
        private long total;

        public MonthlyLeaveStat(String month, long approved, long pending, long rejected) {
            this.month = month;
            this.approved = approved;
            this.pending = pending;
            this.rejected = rejected;
            this.total = approved + pending + rejected;
        }

        public String getMonth() { return month; }
        public long getApproved() { return approved; }
        public long getPending() { return pending; }
        public long getRejected() { return rejected; }
        public long getTotal() { return total; }
    }

    public static class DepartmentDistributionStat {
        private String name;
        private long value;
        private String color;

        public DepartmentDistributionStat(String name, long value, String color) {
            this.name = name;
            this.value = value;
            this.color = color;
        }

        public String getName() { return name; }
        public long getValue() { return value; }
        public String getColor() { return color; }
    }

    public static class LeaveTypeDistributionStat {
        private String name;
        private long value;
        private LeaveType leaveType;
        private String color;

        public LeaveTypeDistributionStat(String name, long value, LeaveType leaveType, String color) {
            this.name = name;
            this.value = value;
            this.leaveType = leaveType;
            this.color = color;
        }

        public String getName() { return name; }
        public long getValue() { return value; }
        public LeaveType getLeaveType() { return leaveType; }
        public String getColor() { return color; }
    }

    public static class LeaveTrendStat {
        private String month;
        private long applications;
        private long approvals;

        public LeaveTrendStat(String month, long applications, long approvals) {
            this.month = month;
            this.applications = applications;
            this.approvals = approvals;
        }

        public String getMonth() { return month; }
        public long getApplications() { return applications; }
        public long getApprovals() { return approvals; }
    }

    public long getTotalEmployees() { return totalEmployees; }
    public void setTotalEmployees(long totalEmployees) { this.totalEmployees = totalEmployees; }

    public long getTotalDepartments() { return totalDepartments; }
    public void setTotalDepartments(long totalDepartments) { this.totalDepartments = totalDepartments; }

    public long getPendingLeaves() { return pendingLeaves; }
    public void setPendingLeaves(long pendingLeaves) { this.pendingLeaves = pendingLeaves; }

    public long getApprovedLeaves() { return approvedLeaves; }
    public void setApprovedLeaves(long approvedLeaves) { this.approvedLeaves = approvedLeaves; }

    public long getRejectedLeaves() { return rejectedLeaves; }
    public void setRejectedLeaves(long rejectedLeaves) { this.rejectedLeaves = rejectedLeaves; }

    public Long getTeamSize() { return teamSize; }
    public void setTeamSize(Long teamSize) { this.teamSize = teamSize; }

    public Long getEmployeesOnLeave() { return employeesOnLeave; }
    public void setEmployeesOnLeave(Long employeesOnLeave) { this.employeesOnLeave = employeesOnLeave; }

    public List<MonthlyLeaveStat> getMonthlyLeaveStats() { return monthlyLeaveStats; }
    public void setMonthlyLeaveStats(List<MonthlyLeaveStat> monthlyLeaveStats) { this.monthlyLeaveStats = monthlyLeaveStats; }

    public List<DepartmentDistributionStat> getDepartmentDistribution() { return departmentDistribution; }
    public void setDepartmentDistribution(List<DepartmentDistributionStat> departmentDistribution) { this.departmentDistribution = departmentDistribution; }

    public List<LeaveTypeDistributionStat> getLeaveTypeDistribution() { return leaveTypeDistribution; }
    public void setLeaveTypeDistribution(List<LeaveTypeDistributionStat> leaveTypeDistribution) { this.leaveTypeDistribution = leaveTypeDistribution; }

    public List<LeaveTrendStat> getLeaveTrends() { return leaveTrends; }
    public void setLeaveTrends(List<LeaveTrendStat> leaveTrends) { this.leaveTrends = leaveTrends; }
}
