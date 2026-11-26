package com.smartleave.hr.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class OrganizationSettingsRequest {

    @NotBlank(message = "Company name is required")
    @Size(max = 160)
    private String companyName;

    @NotBlank(message = "Fiscal year start month is required")
    @Size(max = 40)
    private String fiscalYearStart;

    @NotBlank(message = "Working week label is required")
    @Size(max = 80)
    private String workingWeek;

    @Size(max = 60)
    private String weekendDays;

    @NotNull(message = "Maximum carry-forward days is required")
    @Min(0)
    @Max(60)
    private Integer maxCarryForwardDays;

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getFiscalYearStart() { return fiscalYearStart; }
    public void setFiscalYearStart(String fiscalYearStart) { this.fiscalYearStart = fiscalYearStart; }

    public String getWorkingWeek() { return workingWeek; }
    public void setWorkingWeek(String workingWeek) { this.workingWeek = workingWeek; }

    public String getWeekendDays() { return weekendDays; }
    public void setWeekendDays(String weekendDays) { this.weekendDays = weekendDays; }

    public Integer getMaxCarryForwardDays() { return maxCarryForwardDays; }
    public void setMaxCarryForwardDays(Integer maxCarryForwardDays) { this.maxCarryForwardDays = maxCarryForwardDays; }
}
