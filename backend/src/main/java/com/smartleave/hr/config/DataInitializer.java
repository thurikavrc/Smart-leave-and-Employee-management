package com.smartleave.hr.config;

import com.smartleave.hr.model.Department;
import com.smartleave.hr.model.LeavePolicy;
import com.smartleave.hr.model.OrganizationSettings;
import com.smartleave.hr.model.enums.LeaveType;
import com.smartleave.hr.repository.DepartmentRepository;
import com.smartleave.hr.repository.LeavePolicyRepository;
import com.smartleave.hr.repository.OrganizationSettingsRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Seeds non-sensitive baseline departments, leave policies, and organization settings on first startup.
 * Admin account creation is handled securely via POST /api/auth/bootstrap-admin
 * so no default passwords are ever hardcoded in source control.
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;
    private final LeavePolicyRepository leavePolicyRepository;
    private final OrganizationSettingsRepository organizationSettingsRepository;

    public DataInitializer(
            DepartmentRepository departmentRepository,
            LeavePolicyRepository leavePolicyRepository,
            OrganizationSettingsRepository organizationSettingsRepository) {
        this.departmentRepository = departmentRepository;
        this.leavePolicyRepository = leavePolicyRepository;
        this.organizationSettingsRepository = organizationSettingsRepository;
    }

    @Override
    public void run(String... args) {
        if (departmentRepository.count() == 0) {
            List<Department> defaults = List.of(
                    createDept("Engineering", "Core platform architecture, backend services, frontend products, and QA automation."),
                    createDept("Human Resources", "Talent acquisition, people operations, leave administration, and compliance."),
                    createDept("Product & Design", "Product strategy, UX research, interface systems, and roadmap governance."),
                    createDept("Finance & Operations", "Corporate accounting, payroll coordination, procurement, and workplace operations."),
                    createDept("Customer Success", "Enterprise onboarding, technical account management, and client retention.")
            );
            departmentRepository.saveAll(defaults);
        }

        if (leavePolicyRepository.count() == 0) {
            List<LeavePolicy> policies = List.of(
                    createPolicy(LeaveType.CASUAL, "Casual Leave", 12,
                            "Short-term personal leave for unforeseen errands, family commitments, or personal appointments.", false),
                    createPolicy(LeaveType.SICK, "Sick Leave", 10,
                            "Medical recovery, doctor consultations, and health-related rest days.", false),
                    createPolicy(LeaveType.EARNED, "Earned Leave", 18,
                            "Planned annual vacation or extended personal time off accrued monthly.", true),
                    createPolicy(LeaveType.UNPAID, "Unpaid Leave", 30,
                            "Approved absence without pay when paid leave balances are exhausted.", false)
            );
            leavePolicyRepository.saveAll(policies);
        }

        if (organizationSettingsRepository.count() == 0) {
            OrganizationSettings settings = new OrganizationSettings();
            settings.setCompanyName("Acme Enterprise Technologies");
            settings.setFiscalYearStart("January");
            settings.setWorkingWeek("Monday – Friday");
            settings.setWeekendDays("SATURDAY,SUNDAY");
            settings.setMaxCarryForwardDays(10);
            settings.setUpdatedAt(Instant.now());
            organizationSettingsRepository.save(settings);
        }
    }

    private Department createDept(String name, String description) {
        Department d = new Department();
        d.setName(name);
        d.setDescription(description);
        d.setCreatedAt(LocalDate.now());
        return d;
    }

    private LeavePolicy createPolicy(
            LeaveType type, String displayName, int allowance, String description, boolean carryForward) {
        LeavePolicy p = new LeavePolicy();
        p.setLeaveType(type);
        p.setDisplayName(displayName);
        p.setAnnualAllowance(allowance);
        p.setDescription(description);
        p.setIsActive(true);
        p.setCarryForwardAllowed(carryForward);
        p.setUpdatedAt(LocalDate.now());
        return p;
    }
}
