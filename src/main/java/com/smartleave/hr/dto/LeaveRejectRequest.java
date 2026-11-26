package com.smartleave.hr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class LeaveRejectRequest {
    @NotBlank(message = "Rejection reason is required")
    @Size(max = 1000)
    private String rejectionReason;

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
}
