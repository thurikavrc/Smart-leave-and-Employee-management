package com.smartleave.hr.dto;

import com.smartleave.hr.model.enums.LeaveType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class LeavePolicyRequest {
    @NotNull(message = "Leave type is required")
    private LeaveType leaveType;

    @NotBlank(message = "Display name is required")
    @Size(max = 80)
    private String displayName;

    @NotNull(message = "Annual allowance is required")
    @Min(0)
    @Max(365)
    private Integer annualAllowance;

    @NotBlank(message = "Description is required")
    @Size(max = 500)
    private String description;

    @NotNull
    private Boolean isActive = true;

    @NotNull
    private Boolean carryForwardAllowed = false;

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
}
