package com.smartleave.hr.dto;

import com.smartleave.hr.model.enums.LeaveStatus;
import com.smartleave.hr.model.enums.LeaveType;
import java.time.LocalDate;

public class LeaveResponse {
    private Long id;
    private String applicationId;
    private Long employeeId;
    private String employeeCode;
    private String employeeName;
    private String departmentName;
    private String designation;
    private LeaveType leaveType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer numberOfDays;
    private String reason;
    private String supportingDocumentName;
    private boolean hasSupportingDocument;
    private LocalDate appliedDate;
    private LeaveStatus status;
    private String reviewedBy;
    private LocalDate reviewedDate;
    private String rejectionReason;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getApplicationId() { return applicationId; }
    public void setApplicationId(String applicationId) { this.applicationId = applicationId; }

    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }

    public String getEmployeeCode() { return employeeCode; }
    public void setEmployeeCode(String employeeCode) { this.employeeCode = employeeCode; }

    public String getEmployeeName() { return employeeName; }
    public void setEmployeeName(String employeeName) { this.employeeName = employeeName; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public LeaveType getLeaveType() { return leaveType; }
    public void setLeaveType(LeaveType leaveType) { this.leaveType = leaveType; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getEndDate() { return endDate; }
    public void setEndDate(LocalDate endDate) { this.endDate = endDate; }

    public Integer getNumberOfDays() { return numberOfDays; }
    public void setNumberOfDays(Integer numberOfDays) { this.numberOfDays = numberOfDays; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getSupportingDocumentName() { return supportingDocumentName; }
    public void setSupportingDocumentName(String supportingDocumentName) { this.supportingDocumentName = supportingDocumentName; }

    public boolean isHasSupportingDocument() { return hasSupportingDocument; }
    public void setHasSupportingDocument(boolean hasSupportingDocument) { this.hasSupportingDocument = hasSupportingDocument; }

    public LocalDate getAppliedDate() { return appliedDate; }
    public void setAppliedDate(LocalDate appliedDate) { this.appliedDate = appliedDate; }

    public LeaveStatus getStatus() { return status; }
    public void setStatus(LeaveStatus status) { this.status = status; }

    public String getReviewedBy() { return reviewedBy; }
    public void setReviewedBy(String reviewedBy) { this.reviewedBy = reviewedBy; }

    public LocalDate getReviewedDate() { return reviewedDate; }
    public void setReviewedDate(LocalDate reviewedDate) { this.reviewedDate = reviewedDate; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }
}
