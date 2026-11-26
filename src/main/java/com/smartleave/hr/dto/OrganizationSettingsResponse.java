package com.smartleave.hr.dto;

import java.time.Instant;

public class OrganizationSettingsResponse {
    private Long id;
    private String companyName;
    private String fiscalYearStart;
    private String workingWeek;
    private String weekendDays;
    private Integer maxCarryForwardDays;
    private Instant updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

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

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
