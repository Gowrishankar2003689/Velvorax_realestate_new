CREATE DATABASE IF NOT EXISTS velvorax_realestate
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE velvorax_realestate;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS
  re_document_acl,
  re_lead_signals,
  re_lead_property_interests,
  re_project_amenities,
  re_project_blocks,
  re_integrations,
  re_automation_rules,
  re_documents,
  re_commissions,
  re_payment_transactions,
  re_payment_schedules,
  re_activities,
  re_bookings,
  re_opportunities,
  re_site_visits,
  re_properties,
  re_leads,
  re_partners,
  re_contacts,
  re_projects,
  re_companies;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE re_companies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  industry VARCHAR(100),
  approval_status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_re_company_name (name)
) ENGINE=InnoDB;

CREATE TABLE re_projects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(191) NOT NULL,
  developer_name VARCHAR(191),
  city VARCHAR(100),
  locality VARCHAR(191),
  address VARCHAR(255),
  project_type ENUM('residential','commercial','villa','plot','mixed') NOT NULL DEFAULT 'residential',
  rera_number VARCHAR(100),
  total_units INT UNSIGNED NOT NULL DEFAULT 0,
  available_units INT UNSIGNED NOT NULL DEFAULT 0,
  sold_units INT UNSIGNED NOT NULL DEFAULT 0,
  possession_date DATE,
  status ENUM('active','launching','completed','paused') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_re_projects_company FOREIGN KEY (company_id) REFERENCES re_companies(id) ON DELETE CASCADE,
  UNIQUE KEY uq_project_company_name (company_id, name),
  KEY idx_project_company_status (company_id, status)
) ENGINE=InnoDB;

CREATE TABLE re_contacts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(191) NOT NULL,
  contact_type ENUM('buyer','developer','channel_partner','other') NOT NULL DEFAULT 'buyer',
  phone VARCHAR(32),
  email VARCHAR(191),
  owner_id BIGINT UNSIGNED,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_re_contacts_company FOREIGN KEY (company_id) REFERENCES re_companies(id) ON DELETE CASCADE,
  KEY idx_contact_company_phone (company_id, phone),
  KEY idx_contact_company_email (company_id, email)
) ENGINE=InnoDB;

CREATE TABLE re_partners (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(191) NOT NULL,
  contact_name VARCHAR(191),
  phone VARCHAR(32),
  email VARCHAR(191),
  commission_policy VARCHAR(255),
  status ENUM('active','inactive','review') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_re_partners_company FOREIGN KEY (company_id) REFERENCES re_companies(id) ON DELETE CASCADE,
  UNIQUE KEY uq_partner_company_name (company_id, name)
) ENGINE=InnoDB;

CREATE TABLE re_properties (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NOT NULL,
  unit_number VARCHAR(100) NOT NULL,
  block_name VARCHAR(191),
  floor_number INT,
  property_type ENUM('apartment','villa','plot','office','retail') NOT NULL DEFAULT 'apartment',
  bhk TINYINT UNSIGNED,
  area_sqft DECIMAL(10,2) UNSIGNED,
  facing VARCHAR(50),
  base_price_minor BIGINT UNSIGNED NOT NULL DEFAULT 0,
  current_price_minor BIGINT UNSIGNED NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  parking TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('available','hold','booked','sold','blocked') NOT NULL DEFAULT 'available',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_re_properties_company FOREIGN KEY (company_id) REFERENCES re_companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_re_properties_project FOREIGN KEY (project_id) REFERENCES re_projects(id) ON DELETE CASCADE,
  UNIQUE KEY uq_project_unit (project_id, unit_number),
  KEY idx_property_company_status (company_id, status)
) ENGINE=InnoDB;

CREATE TABLE re_leads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  contact_id BIGINT UNSIGNED,
  name VARCHAR(191) NOT NULL,
  phone VARCHAR(32),
  email VARCHAR(191),
  source VARCHAR(100) NOT NULL DEFAULT 'website',
  campaign VARCHAR(191),
  budget_min_minor BIGINT UNSIGNED NOT NULL DEFAULT 0,
  budget_max_minor BIGINT UNSIGNED NOT NULL DEFAULT 0,
  buying_timeline ENUM('0_3_months','3_6_months','6_12_months','flexible') NOT NULL DEFAULT 'flexible',
  assigned_to BIGINT UNSIGNED,
  score_value TINYINT UNSIGNED NOT NULL DEFAULT 0,
  temperature ENUM('hot','warm','cold') NOT NULL DEFAULT 'cold',
  score_rule_version VARCHAR(20) NOT NULL DEFAULT 'v1',
  pipeline_stage ENUM('new','qualified','property_shortlisted','site_visit','negotiation','booking','closed','lost') NOT NULL DEFAULT 'new',
  booking_probability TINYINT UNSIGNED NOT NULL DEFAULT 0,
  next_follow_up_at DATETIME,
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_re_leads_company FOREIGN KEY (company_id) REFERENCES re_companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_re_leads_contact FOREIGN KEY (contact_id) REFERENCES re_contacts(id) ON DELETE SET NULL,
  KEY idx_lead_company_source (company_id, source),
  KEY idx_lead_company_followup (company_id, assigned_to, next_follow_up_at)
) ENGINE=InnoDB;

CREATE TABLE re_opportunities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  lead_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED,
  property_id BIGINT UNSIGNED,
  stage ENUM('interested','site_visit','negotiation','booking','closed','lost') NOT NULL DEFAULT 'interested',
  owner_id BIGINT UNSIGNED,
  estimated_value_minor BIGINT UNSIGNED NOT NULL DEFAULT 0,
  probability TINYINT UNSIGNED NOT NULL DEFAULT 0,
  stage_changed_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_re_opportunities_company FOREIGN KEY (company_id) REFERENCES re_companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_re_opportunities_lead FOREIGN KEY (lead_id) REFERENCES re_leads(id) ON DELETE CASCADE,
  CONSTRAINT fk_re_opportunities_project FOREIGN KEY (project_id) REFERENCES re_projects(id) ON DELETE SET NULL,
  CONSTRAINT fk_re_opportunities_property FOREIGN KEY (property_id) REFERENCES re_properties(id) ON DELETE SET NULL,
  KEY idx_opportunity_company_stage (company_id, stage, owner_id)
) ENGINE=InnoDB;

CREATE TABLE re_site_visits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  lead_id BIGINT UNSIGNED,
  contact_id BIGINT UNSIGNED,
  project_id BIGINT UNSIGNED,
  property_id BIGINT UNSIGNED,
  assigned_to BIGINT UNSIGNED,
  scheduled_at DATETIME NOT NULL,
  status ENUM('scheduled','completed','cancelled','rescheduled') NOT NULL DEFAULT 'scheduled',
  feedback TEXT,
  next_follow_up_at DATETIME,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_re_visits_company FOREIGN KEY (company_id) REFERENCES re_companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_re_visits_lead FOREIGN KEY (lead_id) REFERENCES re_leads(id) ON DELETE SET NULL,
  CONSTRAINT fk_re_visits_contact FOREIGN KEY (contact_id) REFERENCES re_contacts(id) ON DELETE SET NULL,
  CONSTRAINT fk_re_visits_project FOREIGN KEY (project_id) REFERENCES re_projects(id) ON DELETE SET NULL,
  CONSTRAINT fk_re_visits_property FOREIGN KEY (property_id) REFERENCES re_properties(id) ON DELETE SET NULL,
  KEY idx_visit_company_schedule (company_id, scheduled_at, status)
) ENGINE=InnoDB;

CREATE TABLE re_bookings (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  booking_number VARCHAR(100) NOT NULL,
  lead_id BIGINT UNSIGNED,
  contact_id BIGINT UNSIGNED,
  project_id BIGINT UNSIGNED NOT NULL,
  property_id BIGINT UNSIGNED NOT NULL,
  booking_amount_minor BIGINT UNSIGNED NOT NULL,
  booking_date DATE NOT NULL,
  owner_id BIGINT UNSIGNED,
  partner_id BIGINT UNSIGNED,
  agreement_status ENUM('draft','in_review','signed','cancelled') NOT NULL DEFAULT 'draft',
  status ENUM('booked','registered','cancelled','closed') NOT NULL DEFAULT 'booked',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_re_bookings_company FOREIGN KEY (company_id) REFERENCES re_companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_re_bookings_lead FOREIGN KEY (lead_id) REFERENCES re_leads(id) ON DELETE SET NULL,
  CONSTRAINT fk_re_bookings_contact FOREIGN KEY (contact_id) REFERENCES re_contacts(id) ON DELETE SET NULL,
  CONSTRAINT fk_re_bookings_project FOREIGN KEY (project_id) REFERENCES re_projects(id) ON DELETE RESTRICT,
  CONSTRAINT fk_re_bookings_property FOREIGN KEY (property_id) REFERENCES re_properties(id) ON DELETE RESTRICT,
  CONSTRAINT fk_re_bookings_partner FOREIGN KEY (partner_id) REFERENCES re_partners(id) ON DELETE SET NULL,
  UNIQUE KEY uq_booking_company_number (company_id, booking_number),
  KEY idx_booking_company_status (company_id, project_id, status)
) ENGINE=InnoDB;

CREATE TABLE re_payment_schedules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  booking_id BIGINT UNSIGNED NOT NULL,
  installment_name VARCHAR(191) NOT NULL,
  due_at DATETIME NOT NULL,
  amount_minor BIGINT UNSIGNED NOT NULL,
  paid_amount_minor BIGINT UNSIGNED NOT NULL DEFAULT 0,
  status ENUM('upcoming','due','paid','part_paid','overdue','cancelled') NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_re_schedules_company FOREIGN KEY (company_id) REFERENCES re_companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_re_schedules_booking FOREIGN KEY (booking_id) REFERENCES re_bookings(id) ON DELETE CASCADE,
  KEY idx_schedule_company_due (company_id, booking_id, due_at, status)
) ENGINE=InnoDB;

CREATE TABLE re_payment_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  booking_id BIGINT UNSIGNED NOT NULL,
  schedule_id BIGINT UNSIGNED,
  amount_minor BIGINT UNSIGNED NOT NULL,
  paid_at DATETIME NOT NULL,
  method ENUM('cash','bank_transfer','cheque','upi','card','gateway','other') NOT NULL DEFAULT 'bank_transfer',
  external_reference VARCHAR(191),
  status ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_re_transactions_company FOREIGN KEY (company_id) REFERENCES re_companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_re_transactions_booking FOREIGN KEY (booking_id) REFERENCES re_bookings(id) ON DELETE CASCADE,
  CONSTRAINT fk_re_transactions_schedule FOREIGN KEY (schedule_id) REFERENCES re_payment_schedules(id) ON DELETE SET NULL,
  KEY idx_transaction_company_booking (company_id, booking_id, paid_at)
) ENGINE=InnoDB;

CREATE TABLE re_commissions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  partner_id BIGINT UNSIGNED NOT NULL,
  booking_id BIGINT UNSIGNED NOT NULL,
  amount_minor BIGINT UNSIGNED NOT NULL,
  status ENUM('earned','approved','paid','cancelled') NOT NULL DEFAULT 'earned',
  earned_at DATETIME NOT NULL,
  paid_at DATETIME,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_re_commissions_company FOREIGN KEY (company_id) REFERENCES re_companies(id) ON DELETE CASCADE,
  CONSTRAINT fk_re_commissions_partner FOREIGN KEY (partner_id) REFERENCES re_partners(id) ON DELETE CASCADE,
  CONSTRAINT fk_re_commissions_booking FOREIGN KEY (booking_id) REFERENCES re_bookings(id) ON DELETE CASCADE,
  KEY idx_commission_company_partner (company_id, partner_id, status)
) ENGINE=InnoDB;

CREATE TABLE re_activities (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  subject_type ENUM('lead','contact','project','property','visit','opportunity','booking','partner') NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  actor_id BIGINT UNSIGNED,
  activity_type ENUM('call','email','whatsapp','response','follow_up','stage_change','note','payment','visit','booking') NOT NULL,
  title VARCHAR(191) NOT NULL,
  description TEXT,
  metadata_json JSON,
  occurred_at DATETIME NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_re_activities_company FOREIGN KEY (company_id) REFERENCES re_companies(id) ON DELETE CASCADE,
  KEY idx_activity_company_subject (company_id, subject_type, subject_id, occurred_at)
) ENGINE=InnoDB;

CREATE TABLE re_documents (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  subject_type ENUM('project','property','lead','contact','visit','opportunity','booking','partner') NOT NULL,
  subject_id BIGINT UNSIGNED NOT NULL,
  category ENUM('agreement','brochure','floor_plan','identity','payment_receipt','rera','other') NOT NULL DEFAULT 'other',
  name VARCHAR(191) NOT NULL,
  storage_key VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  uploader_id BIGINT UNSIGNED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_re_documents_company FOREIGN KEY (company_id) REFERENCES re_companies(id) ON DELETE CASCADE,
  KEY idx_document_company_subject (company_id, subject_type, subject_id)
) ENGINE=InnoDB;

CREATE TABLE re_automation_rules (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(191) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  trigger_name VARCHAR(191) NOT NULL,
  conditions_json JSON,
  actions_json JSON,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_re_rules_company FOREIGN KEY (company_id) REFERENCES re_companies(id) ON DELETE CASCADE,
  KEY idx_rule_company_trigger (company_id, enabled, trigger_name)
) ENGINE=InnoDB;

CREATE TABLE re_integrations (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  provider_key VARCHAR(100) NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  credentials_reference VARCHAR(255) NOT NULL,
  allowed_capabilities_json JSON,
  webhook_secret_reference VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_re_integrations_company FOREIGN KEY (company_id) REFERENCES re_companies(id) ON DELETE CASCADE,
  UNIQUE KEY uq_integration_company_provider (company_id, provider_key)
) ENGINE=InnoDB;
