-- MySQL 8 Normalized Schema for Smart Leave & Employee Management System
-- Covers all 10 tables: users, departments, employees, leave_policies, leave_requests,
-- leave_balances, notifications, notification_reads, organization_settings, leave_documents.

CREATE DATABASE IF NOT EXISTS smart_leave_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_leave_db;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  INDEX idx_users_role_active (role, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(500) NOT NULL,
  head_employee_id BIGINT NULL,
  created_at DATE NOT NULL,
  INDEX idx_departments_head (head_employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS employees (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  employee_id VARCHAR(30) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone_number VARCHAR(40) NOT NULL,
  department_id BIGINT NOT NULL,
  designation VARCHAR(120) NOT NULL,
  date_of_joining DATE NOT NULL,
  reporting_manager_id BIGINT NULL,
  employment_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  role VARCHAR(20) NOT NULL DEFAULT 'EMPLOYEE',
  avatar_url VARCHAR(500) NULL,
  CONSTRAINT fk_emp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_emp_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_emp_manager FOREIGN KEY (reporting_manager_id) REFERENCES employees(id) ON DELETE SET NULL,
  INDEX idx_emp_department (department_id),
  INDEX idx_emp_manager (reporting_manager_id),
  INDEX idx_emp_status (employment_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE departments
  ADD CONSTRAINT fk_dept_head FOREIGN KEY (head_employee_id) REFERENCES employees(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS leave_policies (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  leave_type VARCHAR(20) NOT NULL UNIQUE,
  display_name VARCHAR(80) NOT NULL,
  annual_allowance INT NOT NULL,
  description VARCHAR(500) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  carry_forward_allowed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at DATE NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leave_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  application_id VARCHAR(40) NOT NULL UNIQUE,
  employee_id BIGINT NOT NULL,
  leave_policy_id BIGINT NOT NULL,
  leave_type VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  number_of_days INT NOT NULL,
  reason VARCHAR(1000) NOT NULL,
  supporting_document_name VARCHAR(255) NULL,
  applied_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  reviewed_by VARCHAR(120) NULL,
  reviewed_date DATE NULL,
  rejection_reason VARCHAR(1000) NULL,
  CONSTRAINT fk_leave_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_leave_policy FOREIGN KEY (leave_policy_id) REFERENCES leave_policies(id),
  INDEX idx_leave_emp_status (employee_id, status),
  INDEX idx_leave_dates (start_date, end_date),
  INDEX idx_leave_status_applied (status, applied_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leave_balances (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT NOT NULL,
  leave_policy_id BIGINT NOT NULL,
  leave_type VARCHAR(20) NOT NULL,
  leave_year INT NOT NULL,
  allocated_days INT NOT NULL,
  carried_forward_days INT NOT NULL DEFAULT 0,
  used_days INT NOT NULL DEFAULT 0,
  pending_days INT NOT NULL DEFAULT 0,
  remaining_days INT NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_balance_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  CONSTRAINT fk_balance_policy FOREIGN KEY (leave_policy_id) REFERENCES leave_policies(id),
  CONSTRAINT uq_balance_emp_type_year UNIQUE (employee_id, leave_type, leave_year),
  INDEX idx_balance_emp_year (employee_id, leave_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  message VARCHAR(500) NOT NULL,
  category VARCHAR(40) NOT NULL,
  target_role VARCHAR(20) NOT NULL,
  recipient_employee_id BIGINT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(6) NOT NULL,
  action_url VARCHAR(255) NULL,
  CONSTRAINT fk_notif_recipient FOREIGN KEY (recipient_employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_notif_role_recipient_created (target_role, recipient_employee_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_reads (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  notification_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  read_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_notif_read_notification FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_read_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uq_notif_read_user UNIQUE (notification_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS organization_settings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  company_name VARCHAR(160) NOT NULL,
  fiscal_year_start VARCHAR(40) NOT NULL DEFAULT 'January',
  working_week VARCHAR(80) NOT NULL DEFAULT 'Monday - Friday',
  weekend_days VARCHAR(60) NOT NULL DEFAULT 'SATURDAY,SUNDAY',
  max_carry_forward_days INT NOT NULL DEFAULT 10,
  updated_at DATETIME(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leave_documents (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  leave_request_id BIGINT NOT NULL UNIQUE,
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL UNIQUE,
  content_type VARCHAR(120) NOT NULL,
  file_size BIGINT NOT NULL,
  file_data LONGBLOB NOT NULL,
  uploaded_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_doc_leave_request FOREIGN KEY (leave_request_id) REFERENCES leave_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
