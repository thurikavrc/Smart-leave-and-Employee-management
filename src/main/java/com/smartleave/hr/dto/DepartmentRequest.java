package com.smartleave.hr.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class DepartmentRequest {
    @NotBlank(message = "Department name is required")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "Description is required")
    @Size(max = 500)
    private String description;

    private Long headEmployeeId;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Long getHeadEmployeeId() { return headEmployeeId; }
    public void setHeadEmployeeId(Long headEmployeeId) { this.headEmployeeId = headEmployeeId; }
}
