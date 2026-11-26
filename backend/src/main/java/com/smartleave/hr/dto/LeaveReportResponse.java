package com.smartleave.hr.dto;

import java.util.List;

public class LeaveReportResponse {
    private PagedResponse<LeaveResponse> records;
    private List<DepartmentReportStat> departmentBreakdown;
    private List<MonthlyReportStat> monthlyBreakdown;
    private long totalMatchingRecords;
    private long totalLeaveDays;

    public static class DepartmentReportStat {
        private String department;
        private long approved;
        private long pending;
        private long rejected;

        public DepartmentReportStat(String department, long approved, long pending, long rejected) {
            this.department = department;
            this.approved = approved;
            this.pending = pending;
            this.rejected = rejected;
        }

        public String getDepartment() { return department; }
        public long getApproved() { return approved; }
        public long getPending() { return pending; }
        public long getRejected() { return rejected; }
    }

    public static class MonthlyReportStat {
        private String month;
        private long days;
        private long count;

        public MonthlyReportStat(String month, long days, long count) {
            this.month = month;
            this.days = days;
            this.count = count;
        }

        public String getMonth() { return month; }
        public long getDays() { return days; }
        public long getCount() { return count; }
    }

    public PagedResponse<LeaveResponse> getRecords() { return records; }
    public void setRecords(PagedResponse<LeaveResponse> records) { this.records = records; }

    public List<DepartmentReportStat> getDepartmentBreakdown() { return departmentBreakdown; }
    public void setDepartmentBreakdown(List<DepartmentReportStat> departmentBreakdown) { this.departmentBreakdown = departmentBreakdown; }

    public List<MonthlyReportStat> getMonthlyBreakdown() { return monthlyBreakdown; }
    public void setMonthlyBreakdown(List<MonthlyReportStat> monthlyBreakdown) { this.monthlyBreakdown = monthlyBreakdown; }

    public long getTotalMatchingRecords() { return totalMatchingRecords; }
    public void setTotalMatchingRecords(long totalMatchingRecords) { this.totalMatchingRecords = totalMatchingRecords; }

    public long getTotalLeaveDays() { return totalLeaveDays; }
    public void setTotalLeaveDays(long totalLeaveDays) { this.totalLeaveDays = totalLeaveDays; }
}
