package com.smartleave.hr.dto;

import com.smartleave.hr.model.enums.EmploymentStatus;
import com.smartleave.hr.model.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class EmployeeUpdateRequest {
    @Size(max = 30)
    private String employeeId;

    @Size(min = 1, max = 120, message = "Full name must be between 1 and 120 characters")
    private String fullName;

    @Email(message = "Invalid email format")
    private String email;

    @Size(max = 40)
    private String phoneNumber;

    private Long departmentId;

    @Size(max = 120)
    private String designation;

    private LocalDate dateOfJoining;

    private Long reportingManagerId;

    private boolean clearReportingManager;

    private EmploymentStatus employmentStatus;

    private UserRole role;

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }

    public LocalDate getDateOfJoining() { return dateOfJoining; }
    public void setDateOfJoining(LocalDate dateOfJoining) { this.dateOfJoining = dateOfJoining; }

    public Long getReportingManagerId() { return reportingManagerId; }
    public void setReportingManagerId(Long reportingManagerId) { this.reportingManagerId = reportingManagerId; }

    public boolean isClearReportingManager() { return clearReportingManager; }
    public void setClearReportingManager(boolean clearReportingManager) { this.clearReportingManager = clearReportingManager; }

    public EmploymentStatus getEmploymentStatus() { return employmentStatus; }
    public void setEmploymentStatus(EmploymentStatus employmentStatus) { this.employmentStatus = employmentStatus; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }
}
