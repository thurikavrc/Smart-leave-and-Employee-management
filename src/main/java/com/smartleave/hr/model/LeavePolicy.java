package com.smartleave.hr.model;

import com.smartleave.hr.model.enums.LeaveType;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "leave_policies")
public class LeavePolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "leave_type", nullable = false, unique = true, length = 20)
    private LeaveType leaveType;

    @Column(name = "display_name", nullable = false, length = 80)
    private String displayName;

    @Column(name = "annual_allowance", nullable = false)
    private Integer annualAllowance;

    @Column(nullable = false, length = 500)
    private String description;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "carry_forward_allowed", nullable = false)
    private Boolean carryForwardAllowed = false;

    @Column(name = "updated_at", nullable = false)
    private LocalDate updatedAt = LocalDate.now();

    public LeavePolicy() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LeaveType getLeaveType() { return leaveType; }
    public void setLeaveType(LeaveType leaveType) { this.leaveType = leaveType; }

    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }

    public Integer getAnnualAllowance() { return annualAllowance; }
    public void setAnnualAllowance(Integer annualAllowance) { this.annualAllowance = annualAllowance; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }

    public Boolean getCarryForwardAllowed() { return carryForwardAllowed; }
    public void setCarryForwardAllowed(Boolean carryForwardAllowed) { this.carryForwardAllowed = carryForwardAllowed; }

    public LocalDate getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDate updatedAt) { this.updatedAt = updatedAt; }
}
