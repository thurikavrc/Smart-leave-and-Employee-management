package com.smartleave.hr.model;

import com.smartleave.hr.model.enums.LeaveType;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(
    name = "leave_balances",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_balance_emp_type_year", columnNames = {"employee_id", "leave_type", "leave_year"})
    }
)
public class LeaveBalance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "leave_policy_id", nullable = false)
    private LeavePolicy leavePolicy;

    @Enumerated(EnumType.STRING)
    @Column(name = "leave_type", nullable = false, length = 20)
    private LeaveType leaveType;

    @Column(name = "leave_year", nullable = false)
    private Integer leaveYear;

    @Column(name = "allocated_days", nullable = false)
    private Integer allocatedDays;

    @Column(name = "carried_forward_days", nullable = false)
    private Integer carriedForwardDays = 0;

    @Column(name = "used_days", nullable = false)
    private Integer usedDays = 0;

    @Column(name = "pending_days", nullable = false)
    private Integer pendingDays = 0;

    @Column(name = "remaining_days", nullable = false)
    private Integer remainingDays;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public LeaveBalance() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }

    public LeavePolicy getLeavePolicy() { return leavePolicy; }
    public void setLeavePolicy(LeavePolicy leavePolicy) { this.leavePolicy = leavePolicy; }

    public LeaveType getLeaveType() { return leaveType; }
    public void setLeaveType(LeaveType leaveType) { this.leaveType = leaveType; }

    public Integer getLeaveYear() { return leaveYear; }
    public void setLeaveYear(Integer leaveYear) { this.leaveYear = leaveYear; }

    public Integer getAllocatedDays() { return allocatedDays; }
    public void setAllocatedDays(Integer allocatedDays) { this.allocatedDays = allocatedDays; }

    public Integer getCarriedForwardDays() { return carriedForwardDays; }
    public void setCarriedForwardDays(Integer carriedForwardDays) { this.carriedForwardDays = carriedForwardDays; }

    public Integer getUsedDays() { return usedDays; }
    public void setUsedDays(Integer usedDays) { this.usedDays = usedDays; }

    public Integer getPendingDays() { return pendingDays; }
    public void setPendingDays(Integer pendingDays) { this.pendingDays = pendingDays; }

    public Integer getRemainingDays() { return remainingDays; }
    public void setRemainingDays(Integer remainingDays) { this.remainingDays = remainingDays; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
