-- Non-sensitive development seed & verification SQL script for Smart Leave & Employee Management System.
-- NOTE: No passwords or real credentials are stored in SQL files.
-- After starting the Spring Boot backend, create the initial Admin via POST /api/auth/bootstrap-admin
-- and onboard employees via POST /api/employees or POST /api/auth/register.

USE smart_leave_db;

INSERT IGNORE INTO departments (name, description, created_at)
VALUES
  ('Engineering', 'Core platform architecture, backend services, frontend products, and QA automation.', CURDATE()),
  ('Human Resources', 'Talent acquisition, people operations, leave administration, and compliance.', CURDATE()),
  ('Product & Design', 'Product strategy, UX research, interface systems, and roadmap governance.', CURDATE()),
  ('Finance & Operations', 'Corporate accounting, payroll coordination, procurement, and workplace operations.', CURDATE()),
  ('Customer Success', 'Enterprise onboarding, technical account management, and client retention.', CURDATE());

INSERT IGNORE INTO leave_policies (leave_type, display_name, annual_allowance, description, is_active, carry_forward_allowed, updated_at)
VALUES
  ('CASUAL', 'Casual Leave', 12, 'Short-term personal leave for unforeseen errands, family commitments, or personal appointments.', TRUE, FALSE, CURDATE()),
  ('SICK', 'Sick Leave', 10, 'Medical recovery, doctor consultations, and health-related rest days.', TRUE, FALSE, CURDATE()),
  ('EARNED', 'Earned Leave', 18, 'Planned annual vacation or extended personal time off accrued monthly.', TRUE, TRUE, CURDATE()),
  ('UNPAID', 'Unpaid Leave', 30, 'Approved absence without pay when paid leave balances are exhausted.', TRUE, FALSE, CURDATE());

INSERT INTO organization_settings (company_name, fiscal_year_start, working_week, weekend_days, max_carry_forward_days, updated_at)
SELECT 'Acme Enterprise Technologies', 'January', 'Monday - Friday', 'SATURDAY,SUNDAY', 10, NOW(6)
WHERE NOT EXISTS (SELECT 1 FROM organization_settings);

-- Verification queries
SELECT table_name, table_rows
FROM information_schema.tables
WHERE table_schema = 'smart_leave_db'
ORDER BY table_name;
