package com.smartleave.hr.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "organization_settings")
public class OrganizationSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name", nullable = false, length = 160)
    private String companyName;

    @Column(name = "fiscal_year_start", nullable = false, length = 40)
    private String fiscalYearStart = "January";

    @Column(name = "working_week", nullable = false, length = 80)
    private String workingWeek = "Monday - Friday";

    @Column(name = "weekend_days", nullable = false, length = 60)
    private String weekendDays = "SATURDAY,SUNDAY";

    @Column(name = "max_carry_forward_days", nullable = false)
    private Integer maxCarryForwardDays = 10;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    public OrganizationSettings() {}

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
