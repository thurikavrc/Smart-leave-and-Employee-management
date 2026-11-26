package com.smartleave.hr.dto;

import com.smartleave.hr.model.enums.LeaveType;

public class LeaveBalanceResponse {
    private Long employeeId;
    private int year;
    private BalanceItem casual;
    private BalanceItem sick;
    private BalanceItem earned;
    private BalanceItem unpaid;

    public static class BalanceItem {
        private LeaveType leaveType;
        private String label;
        private int annualAllowance;
        private int carriedForward;
        private int totalAllowed;
        private int used;
        private int pending;
        private int remaining;

        public BalanceItem(LeaveType leaveType, String label, int totalAllowed, int used, int pending) {
            this(leaveType, label, totalAllowed, 0, used, pending);
        }

        public BalanceItem(
                LeaveType leaveType,
                String label,
                int annualAllowance,
                int carriedForward,
                int used,
                int pending) {
            this.leaveType = leaveType;
            this.label = label;
            this.annualAllowance = annualAllowance;
            this.carriedForward = Math.max(0, carriedForward);
            this.totalAllowed = Math.max(0, annualAllowance) + this.carriedForward;
            this.used = used;
            this.pending = pending;
            this.remaining = Math.max(0, this.totalAllowed - used);
        }

        public LeaveType getLeaveType() { return leaveType; }
        public String getLabel() { return label; }
        public int getAnnualAllowance() { return annualAllowance; }
        public int getCarriedForward() { return carriedForward; }
        public int getTotalAllowed() { return totalAllowed; }
        public int getUsed() { return used; }
        public int getPending() { return pending; }
        public int getRemaining() { return remaining; }
    }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public BalanceItem getCasual() { return casual; }
    public void setCasual(BalanceItem casual) { this.casual = casual; }

    public BalanceItem getSick() { return sick; }
    public void setSick(BalanceItem sick) { this.sick = sick; }

    public BalanceItem getEarned() { return earned; }
    public void setEarned(BalanceItem earned) { this.earned = earned; }

    public BalanceItem getUnpaid() { return unpaid; }
    public void setUnpaid(BalanceItem unpaid) { this.unpaid = unpaid; }
}
