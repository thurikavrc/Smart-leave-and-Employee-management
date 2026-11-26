package com.smartleave.hr.dto;

import java.time.LocalDate;

public class DepartmentResponse {
    private Long id;
    private String name;
    private String description;
    private Long headEmployeeId;
    private String headName;
    private long employeeCount;
    private LocalDate createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getHeadEmployeeId() { return headEmployeeId; }
    public void setHeadEmployeeId(Long headEmployeeId) { this.headEmployeeId = headEmployeeId; }

    public String getHeadName() { return headName; }
    public void setHeadName(String headName) { this.headName = headName; }

    public long getEmployeeCount() { return employeeCount; }
    public void setEmployeeCount(long employeeCount) { this.employeeCount = employeeCount; }

    public LocalDate getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDate createdAt) { this.createdAt = createdAt; }
}
