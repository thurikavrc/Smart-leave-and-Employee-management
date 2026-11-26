package com.smartleave.hr.repository;

import com.smartleave.hr.model.OrganizationSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrganizationSettingsRepository extends JpaRepository<OrganizationSettings, Long> {
}
