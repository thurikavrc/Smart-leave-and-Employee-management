package com.smartleave.hr.dto;

import com.smartleave.hr.model.enums.EmploymentStatus;
import com.smartleave.hr.model.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public class EmployeeRequest {
    @NotBlank(message = "Employee ID is required")
    @Size(max = 30)
    private String employeeId;

    @NotBlank(message = "Full name is required")
    @Size(max = 120)
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;

    @NotBlank(message = "Phone number is required")
    @Size(max = 40)
    private String phoneNumber;

    @NotNull(message = "Department ID is required")
    private Long departmentId;

    @NotBlank(message = "Designation is required")
    @Size(max = 120)
    private String designation;

    @NotNull(message = "Date of joining is required")
    private LocalDate dateOfJoining;

    private Long reportingManagerId;

    @NotNull(message = "Employment status is required")
    private EmploymentStatus employmentStatus;

    private UserRole role;

    // Optional initial password when admin creates an employee; if omitted on create, user sets password via invite/reset flow
    private String initialPassword;

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

    public EmploymentStatus getEmploymentStatus() { return employmentStatus; }
    public void setEmploymentStatus(EmploymentStatus employmentStatus) { this.employmentStatus = employmentStatus; }

    public UserRole getRole() { return role; }
    public void setRole(UserRole role) { this.role = role; }

    public String getInitialPassword() { return initialPassword; }
    public void setInitialPassword(String initialPassword) { this.initialPassword = initialPassword; }
}
