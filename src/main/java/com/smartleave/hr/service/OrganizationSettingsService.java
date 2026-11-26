package com.smartleave.hr.service;

import com.smartleave.hr.dto.OrganizationSettingsRequest;
import com.smartleave.hr.dto.OrganizationSettingsResponse;
import com.smartleave.hr.model.OrganizationSettings;
import com.smartleave.hr.repository.OrganizationSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class OrganizationSettingsService {

    private final OrganizationSettingsRepository organizationSettingsRepository;

    public OrganizationSettingsService(OrganizationSettingsRepository organizationSettingsRepository) {
        this.organizationSettingsRepository = organizationSettingsRepository;
    }

    @Transactional
    public OrganizationSettings getOrCreateEntity() {
        return organizationSettingsRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    OrganizationSettings defaults = new OrganizationSettings();
                    defaults.setCompanyName("Acme Enterprise Technologies");
                    defaults.setFiscalYearStart("January");
                    defaults.setWorkingWeek("Monday – Friday");
                    defaults.setWeekendDays("SATURDAY,SUNDAY");
                    defaults.setMaxCarryForwardDays(10);
                    defaults.setUpdatedAt(Instant.now());
                    return organizationSettingsRepository.save(defaults);
                });
    }

    @Transactional
    public OrganizationSettingsResponse getSettings() {
        return toResponse(getOrCreateEntity());
    }

    @Transactional
    public OrganizationSettingsResponse updateSettings(OrganizationSettingsRequest request) {
        OrganizationSettings settings = getOrCreateEntity();
        settings.setCompanyName(request.getCompanyName().trim());
        settings.setFiscalYearStart(request.getFiscalYearStart().trim());
        settings.setWorkingWeek(request.getWorkingWeek().trim());
        if (request.getWeekendDays() != null && !request.getWeekendDays().isBlank()) {
            settings.setWeekendDays(request.getWeekendDays().trim().toUpperCase());
        }
        settings.setMaxCarryForwardDays(request.getMaxCarryForwardDays());
        settings.setUpdatedAt(Instant.now());
        return toResponse(organizationSettingsRepository.save(settings));
    }

    private OrganizationSettingsResponse toResponse(OrganizationSettings s) {
        OrganizationSettingsResponse res = new OrganizationSettingsResponse();
        res.setId(s.getId());
        res.setCompanyName(s.getCompanyName());
        res.setFiscalYearStart(s.getFiscalYearStart());
        res.setWorkingWeek(s.getWorkingWeek());
        res.setWeekendDays(s.getWeekendDays());
        res.setMaxCarryForwardDays(s.getMaxCarryForwardDays());
        res.setUpdatedAt(s.getUpdatedAt());
        return res;
    }
}
