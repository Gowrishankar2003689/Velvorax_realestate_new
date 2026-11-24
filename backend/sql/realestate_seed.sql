USE velvorax_realestate;

INSERT INTO re_companies (name, industry, approval_status)
VALUES ('Velvorax Real Estate', 'Real Estate', 'Approved')
ON DUPLICATE KEY UPDATE industry = VALUES(industry), approval_status = VALUES(approval_status);

SET @company_id = (SELECT id FROM re_companies WHERE name = 'Velvorax Real Estate' LIMIT 1);

INSERT INTO re_projects (
  company_id, name, developer_name, city, locality, project_type, rera_number,
  total_units, available_units, sold_units, possession_date, status
) VALUES
  (@company_id, 'Aurelia Heights', 'Northstar Developers', 'Hyderabad', 'Gachibowli',
   'residential', 'P02400007182', 240, 64, 148, '2028-12-31', 'active'),
  (@company_id, 'Palm Grove Villas', 'Greenway Estates', 'Hyderabad', 'Tellapur',
   'villa', 'P02400004976', 48, 11, 33, '2027-06-30', 'active')
ON DUPLICATE KEY UPDATE
  developer_name = VALUES(developer_name),
  city = VALUES(city),
  locality = VALUES(locality),
  project_type = VALUES(project_type),
  rera_number = VALUES(rera_number),
  total_units = VALUES(total_units),
  available_units = VALUES(available_units),
  sold_units = VALUES(sold_units),
  possession_date = VALUES(possession_date),
  status = VALUES(status);

INSERT INTO re_properties (
  company_id, project_id, unit_number, block_name, floor_number, property_type, bhk,
  area_sqft, facing, base_price_minor, current_price_minor, currency, parking, status
) VALUES
  (@company_id,
   (SELECT id FROM re_projects WHERE company_id = @company_id AND name = 'Aurelia Heights'),
   'AH-T2-1104', 'Tower 2', 11, 'apartment', 3, 1685.00, 'east',
   1180000000, 1240000000, 'INR', 1, 'available'),
  (@company_id,
   (SELECT id FROM re_projects WHERE company_id = @company_id AND name = 'Palm Grove Villas'),
   'VG-V-014', 'Villa 14', 2, 'villa', 4, 2850.00, 'north_east',
   2500000000, 2650000000, 'INR', 2, 'available')
ON DUPLICATE KEY UPDATE
  block_name = VALUES(block_name),
  floor_number = VALUES(floor_number),
  property_type = VALUES(property_type),
  bhk = VALUES(bhk),
  area_sqft = VALUES(area_sqft),
  facing = VALUES(facing),
  base_price_minor = VALUES(base_price_minor),
  current_price_minor = VALUES(current_price_minor),
  parking = VALUES(parking),
  status = VALUES(status);

INSERT INTO re_contacts (
  company_id, name, contact_type, phone, email, status
) VALUES (@company_id, 'Aarav Mehta', 'buyer', '+91-0000000001', 'aarav@example.test', 'active')
ON DUPLICATE KEY UPDATE
  name = VALUES(name), phone = VALUES(phone), status = VALUES(status);

SET @contact_id = (
  SELECT id FROM re_contacts
  WHERE company_id = @company_id AND email = 'aarav@example.test'
  LIMIT 1
);

INSERT INTO re_leads (
  company_id, contact_id, name, phone, email, source, campaign,
  budget_min_minor, budget_max_minor, buying_timeline,
  score_value, temperature, score_rule_version, pipeline_stage,
  booking_probability, next_follow_up_at
) VALUES (
  @company_id, @contact_id, 'Aarav Mehta', '+91-0000000001', 'aarav@example.test',
  'google_ads', 'hyderabad_2bhk_q4', 750000000, 900000000, '0_3_months',
  70, 'hot', 'v1', 'site_visit', 54, '2026-11-24 10:00:00'
) ON DUPLICATE KEY UPDATE
  contact_id = VALUES(contact_id), phone = VALUES(phone),
  source = VALUES(source), campaign = VALUES(campaign),
  budget_min_minor = VALUES(budget_min_minor), budget_max_minor = VALUES(budget_max_minor),
  score_value = VALUES(score_value), temperature = VALUES(temperature),
  pipeline_stage = VALUES(pipeline_stage), booking_probability = VALUES(booking_probability),
  next_follow_up_at = VALUES(next_follow_up_at);

SET @lead_id = (
  SELECT id FROM re_leads
  WHERE company_id = @company_id AND email = 'aarav@example.test'
  LIMIT 1
);

INSERT INTO re_partners (
  company_id, name, contact_name, phone, email, commission_policy, status
) VALUES (@company_id, 'BlueKey Realty', 'Sales Team', '+91-0000000000',
          'sales@bluekey.example', 'Standard partner policy', 'active')
ON DUPLICATE KEY UPDATE
  contact_name = VALUES(contact_name), phone = VALUES(phone), email = VALUES(email),
  commission_policy = VALUES(commission_policy), status = VALUES(status);

SET @partner_id = (
  SELECT id FROM re_partners
  WHERE company_id = @company_id AND name = 'BlueKey Realty'
  LIMIT 1
);

SET @project_id = (
  SELECT id FROM re_projects
  WHERE company_id = @company_id AND name = 'Aurelia Heights'
  LIMIT 1
);

SET @property_id = (
  SELECT id FROM re_properties
  WHERE company_id = @company_id AND unit_number = 'AH-T2-1104'
  LIMIT 1
);

INSERT INTO re_site_visits (
  company_id, lead_id, contact_id, project_id, property_id,
  scheduled_at, status, next_follow_up_at
) VALUES (
  @company_id, @lead_id, @contact_id, @project_id, @property_id,
  '2026-11-24 10:00:00', 'scheduled', '2026-11-24 10:00:00'
);

INSERT INTO re_opportunities (
  company_id, lead_id, project_id, property_id, stage,
  estimated_value_minor, probability, stage_changed_at
) VALUES (
  @company_id, @lead_id, @project_id, @property_id, 'site_visit',
  1240000000, 54, '2026-11-23 10:00:00'
);

INSERT INTO re_bookings (
  company_id, booking_number, lead_id, contact_id, project_id, property_id,
  booking_amount_minor, booking_date, partner_id, agreement_status, status
) VALUES (
  @company_id, 'RE-2026-0001', @lead_id, @contact_id, @project_id, @property_id,
  50000000, '2026-11-23', @partner_id, 'in_review', 'booked'
) ON DUPLICATE KEY UPDATE
  lead_id = VALUES(lead_id), contact_id = VALUES(contact_id),
  project_id = VALUES(project_id), property_id = VALUES(property_id),
  booking_amount_minor = VALUES(booking_amount_minor), booking_date = VALUES(booking_date),
  partner_id = VALUES(partner_id), agreement_status = VALUES(agreement_status),
  status = VALUES(status);

SET @booking_id = (
  SELECT id FROM re_bookings
  WHERE company_id = @company_id AND booking_number = 'RE-2026-0001'
  LIMIT 1
);

INSERT INTO re_payment_schedules (
  company_id, booking_id, installment_name, due_at,
  amount_minor, paid_amount_minor, status
) VALUES (
  @company_id, @booking_id, 'Booking Amount', '2026-11-23 00:00:00',
  50000000, 50000000, 'paid'
) ON DUPLICATE KEY UPDATE
  installment_name = VALUES(installment_name), due_at = VALUES(due_at),
  amount_minor = VALUES(amount_minor), paid_amount_minor = VALUES(paid_amount_minor),
  status = VALUES(status);

SET @schedule_id = (
  SELECT id FROM re_payment_schedules
  WHERE company_id = @company_id AND booking_id = @booking_id
  LIMIT 1
);

INSERT INTO re_payment_transactions (
  company_id, booking_id, schedule_id, amount_minor, paid_at,
  method, external_reference, status
) VALUES (
  @company_id, @booking_id, @schedule_id, 50000000, '2026-11-23 12:00:00',
  'bank_transfer', 'SEED-RECEIPT-0001', 'completed'
);

INSERT INTO re_commissions (
  company_id, partner_id, booking_id, amount_minor, status, earned_at
) VALUES (
  @company_id, @partner_id, @booking_id, 11600000, 'earned', '2026-11-23 12:00:00'
);

INSERT INTO re_documents (
  company_id, subject_type, subject_id, category, name,
  storage_key, mime_type, size_bytes
) VALUES (
  @company_id, 'project', @project_id, 'brochure', 'Aurelia Heights Brochure',
  'realestate/projects/aurelia-heights/brochure.pdf', 'application/pdf', 0
);

INSERT INTO re_activities (
  company_id, subject_type, subject_id, activity_type,
  title, description, metadata_json, occurred_at
) VALUES (
  @company_id, 'lead', @lead_id, 'call',
  'Qualification call',
  'Customer confirmed a 3 BHK requirement and Gachibowli location preference.',
  JSON_OBJECT('durationMinutes', 12, 'outcome', 'interested'),
  '2026-11-23 10:30:00'
);

INSERT INTO re_automation_rules (
  company_id, name, enabled, trigger_name, conditions_json, actions_json, version
) VALUES (
  @company_id, 'Hot lead follow-up', TRUE, 'lead.score.changed',
  JSON_OBJECT('minimumScore', 70),
  JSON_ARRAY(JSON_OBJECT('type', 'create_follow_up',
                         'config', JSON_OBJECT('priority', 'high', 'dueInHours', 24))),
  1
);

INSERT INTO re_integrations (
  company_id, provider_key, enabled, credentials_reference,
  allowed_capabilities_json
) VALUES (
  @company_id, 'whatsapp', FALSE, 'vault://realestate/whatsapp',
  JSON_ARRAY('send_message', 'receive_webhook')
) ON DUPLICATE KEY UPDATE
  enabled = VALUES(enabled),
  credentials_reference = VALUES(credentials_reference),
  allowed_capabilities_json = VALUES(allowed_capabilities_json);
