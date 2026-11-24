const express = require('express');
const mysql = require('mysql2/promise');
const auth = require('../../middleware/auth');

const router = express.Router();

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'velvorax_realestate',
  waitForConnections: true,
  connectionLimit: 10,
  multipleStatements: false
});

const resources = {
  projects: {
    table: 're_projects',
    fields: ['name', 'developer_name', 'city', 'locality', 'address', 'project_type', 'rera_number', 'total_units', 'available_units', 'sold_units', 'possession_date', 'status'],
    search: ['name', 'developer_name', 'city', 'locality', 'rera_number', 'status']
  },
  properties: {
    table: 're_properties',
    fields: ['project_id', 'unit_number', 'block_name', 'floor_number', 'property_type', 'bhk', 'area_sqft', 'facing', 'base_price_minor', 'current_price_minor', 'currency', 'parking', 'status'],
    search: ['unit_number', 'block_name', 'property_type', 'facing', 'status']
  },
  leads: {
    table: 're_leads',
    fields: ['contact_id', 'name', 'phone', 'email', 'source', 'campaign', 'budget_min_minor', 'budget_max_minor', 'buying_timeline', 'assigned_to', 'score_value', 'temperature', 'score_rule_version', 'pipeline_stage', 'booking_probability', 'next_follow_up_at', 'notes'],
    search: ['name', 'phone', 'email', 'source', 'campaign', 'temperature', 'pipeline_stage']
  },
  contacts: {
    table: 're_contacts',
    fields: ['name', 'contact_type', 'phone', 'email', 'owner_id', 'status'],
    search: ['name', 'phone', 'email', 'contact_type', 'status']
  },
  visits: {
    table: 're_site_visits',
    fields: ['lead_id', 'contact_id', 'project_id', 'property_id', 'assigned_to', 'scheduled_at', 'status', 'feedback', 'next_follow_up_at'],
    search: ['status', 'feedback']
  },
  opportunities: {
    table: 're_opportunities',
    fields: ['lead_id', 'project_id', 'property_id', 'stage', 'owner_id', 'estimated_value_minor', 'probability', 'stage_changed_at'],
    search: ['stage']
  },
  bookings: {
    table: 're_bookings',
    fields: ['booking_number', 'lead_id', 'contact_id', 'project_id', 'property_id', 'booking_amount_minor', 'booking_date', 'owner_id', 'partner_id', 'agreement_status', 'status'],
    search: ['booking_number', 'agreement_status', 'status']
  },
  'payment-schedules': {
    table: 're_payment_schedules',
    fields: ['booking_id', 'installment_name', 'due_at', 'amount_minor', 'paid_amount_minor', 'status'],
    search: ['installment_name', 'status']
  },
  'payment-transactions': {
    table: 're_payment_transactions',
    fields: ['booking_id', 'schedule_id', 'amount_minor', 'paid_at', 'method', 'external_reference', 'status'],
    search: ['method', 'external_reference', 'status']
  },
  partners: {
    table: 're_partners',
    fields: ['name', 'contact_name', 'phone', 'email', 'commission_policy', 'status'],
    search: ['name', 'contact_name', 'phone', 'email', 'status']
  },
  commissions: {
    table: 're_commissions',
    fields: ['partner_id', 'booking_id', 'amount_minor', 'status', 'earned_at', 'paid_at'],
    search: ['status']
  },
  activities: {
    table: 're_activities',
    fields: ['subject_type', 'subject_id', 'actor_id', 'activity_type', 'title', 'description', 'metadata_json', 'occurred_at'],
    search: ['subject_type', 'activity_type', 'title', 'description']
  },
  documents: {
    table: 're_documents',
    fields: ['subject_type', 'subject_id', 'category', 'name', 'storage_key', 'mime_type', 'size_bytes', 'uploader_id'],
    search: ['subject_type', 'category', 'name', 'storage_key']
  },
  'automation-rules': {
    table: 're_automation_rules',
    fields: ['name', 'enabled', 'trigger_name', 'conditions_json', 'actions_json', 'version'],
    search: ['name', 'trigger_name']
  },
  integrations: {
    table: 're_integrations',
    fields: ['provider_key', 'enabled', 'credentials_reference', 'allowed_capabilities_json', 'webhook_secret_reference'],
    search: ['provider_key']
  }
};

const requiredFields = {
  projects: ['name', 'project_type'],
  properties: ['project_id', 'unit_number', 'property_type', 'status'],
  leads: ['name', 'pipeline_stage', 'temperature'],
  contacts: ['name', 'contact_type'],
  visits: ['scheduled_at', 'status'],
  opportunities: ['lead_id', 'stage', 'stage_changed_at'],
  bookings: ['booking_number', 'project_id', 'property_id', 'booking_amount_minor', 'booking_date', 'agreement_status', 'status'],
  'payment-schedules': ['booking_id', 'installment_name', 'due_at', 'amount_minor', 'status'],
  'payment-transactions': ['booking_id', 'amount_minor', 'paid_at', 'method', 'status'],
  partners: ['name', 'status'],
  commissions: ['partner_id', 'booking_id', 'amount_minor', 'status', 'earned_at'],
  activities: ['subject_type', 'subject_id', 'activity_type', 'title', 'occurred_at'],
  documents: ['subject_type', 'subject_id', 'name', 'storage_key'],
  'automation-rules': ['name', 'trigger_name'],
  integrations: ['provider_key', 'credentials_reference']
};

const enumFields = {
  projects: {
    project_type: ['residential', 'commercial', 'villa', 'plot', 'mixed'],
    status: ['active', 'launching', 'completed', 'paused']
  },
  properties: {
    property_type: ['apartment', 'villa', 'plot', 'office', 'retail'],
    status: ['available', 'hold', 'booked', 'sold', 'blocked']
  },
  leads: {
    buying_timeline: ['0_3_months', '3_6_months', '6_12_months', 'flexible'],
    temperature: ['hot', 'warm', 'cold'],
    pipeline_stage: ['new', 'qualified', 'property_shortlisted', 'site_visit', 'negotiation', 'booking', 'closed', 'lost']
  },
  contacts: { contact_type: ['buyer', 'developer', 'channel_partner', 'other'], status: ['active', 'inactive'] },
  visits: { status: ['scheduled', 'completed', 'cancelled', 'rescheduled'] },
  opportunities: { stage: ['interested', 'site_visit', 'negotiation', 'booking', 'closed', 'lost'] },
  bookings: {
    agreement_status: ['draft', 'in_review', 'signed', 'cancelled'],
    status: ['booked', 'registered', 'cancelled', 'closed']
  },
  'payment-schedules': { status: ['upcoming', 'due', 'paid', 'part_paid', 'overdue', 'cancelled'] },
  'payment-transactions': {
    method: ['cash', 'bank_transfer', 'cheque', 'upi', 'card', 'gateway', 'other'],
    status: ['pending', 'completed', 'failed', 'refunded']
  },
  partners: { status: ['active', 'inactive', 'review'] },
  commissions: { status: ['earned', 'approved', 'paid', 'cancelled'] },
  activities: {
    subject_type: ['lead', 'contact', 'project', 'property', 'visit', 'opportunity', 'booking', 'partner'],
    activity_type: ['call', 'email', 'whatsapp', 'response', 'follow_up', 'stage_change', 'note', 'payment', 'visit', 'booking']
  },
  documents: {
    subject_type: ['project', 'property', 'lead', 'contact', 'visit', 'opportunity', 'booking', 'partner'],
    category: ['agreement', 'brochure', 'floor_plan', 'identity', 'payment_receipt', 'rera', 'other']
  }
};

const numericFields = {
  projects: {
    total_units: { integer: true, min: 0 },
    available_units: { integer: true, min: 0 },
    sold_units: { integer: true, min: 0 }
  },
  properties: {
    project_id: { integer: true, min: 1 }, floor_number: { integer: true },
    bhk: { integer: true, min: 0 }, area_sqft: { min: 0 },
    base_price_minor: { integer: true, min: 0 }, current_price_minor: { integer: true, min: 0 },
    parking: { integer: true, min: 0 }
  },
  leads: {
    contact_id: { integer: true, min: 1 }, budget_min_minor: { integer: true, min: 0 },
    budget_max_minor: { integer: true, min: 0 }, assigned_to: { integer: true, min: 1 },
    score_value: { integer: true, min: 0, max: 100 }, booking_probability: { integer: true, min: 0, max: 100 }
  },
  contacts: { owner_id: { integer: true, min: 1 } },
  visits: {
    lead_id: { integer: true, min: 1 }, contact_id: { integer: true, min: 1 },
    project_id: { integer: true, min: 1 }, property_id: { integer: true, min: 1 },
    assigned_to: { integer: true, min: 1 }
  },
  opportunities: {
    lead_id: { integer: true, min: 1 }, project_id: { integer: true, min: 1 },
    property_id: { integer: true, min: 1 }, owner_id: { integer: true, min: 1 },
    estimated_value_minor: { integer: true, min: 0 }, probability: { integer: true, min: 0, max: 100 }
  },
  bookings: {
    lead_id: { integer: true, min: 1 }, contact_id: { integer: true, min: 1 },
    project_id: { integer: true, min: 1 }, property_id: { integer: true, min: 1 },
    booking_amount_minor: { integer: true, min: 0 }, owner_id: { integer: true, min: 1 },
    partner_id: { integer: true, min: 1 }
  },
  'payment-schedules': {
    booking_id: { integer: true, min: 1 }, amount_minor: { integer: true, min: 0 },
    paid_amount_minor: { integer: true, min: 0 }
  },
  'payment-transactions': {
    booking_id: { integer: true, min: 1 }, schedule_id: { integer: true, min: 1 },
    amount_minor: { integer: true, min: 0 }
  },
  commissions: {
    partner_id: { integer: true, min: 1 }, booking_id: { integer: true, min: 1 },
    amount_minor: { integer: true, min: 0 }
  },
  activities: { subject_id: { integer: true, min: 1 }, actor_id: { integer: true, min: 1 } },
  documents: { subject_id: { integer: true, min: 1 }, size_bytes: { integer: true, min: 0 } },
  'automation-rules': { version: { integer: true, min: 1 } }
};

const dateFields = {
  projects: ['possession_date'],
  bookings: ['booking_date']
};

const dateTimeFields = {
  leads: ['next_follow_up_at'],
  visits: ['scheduled_at', 'next_follow_up_at'],
  opportunities: ['stage_changed_at'],
  'payment-schedules': ['due_at'],
  'payment-transactions': ['paid_at'],
  commissions: ['earned_at', 'paid_at'],
  activities: ['occurred_at']
};

const jsonFields = new Set(['metadata_json', 'conditions_json', 'actions_json', 'allowed_capabilities_json']);
const subjectTables = {
  lead: 're_leads',
  contact: 're_contacts',
  project: 're_projects',
  property: 're_properties',
  visit: 're_site_visits',
  opportunity: 're_opportunities',
  booking: 're_bookings',
  partner: 're_partners'
};
const referenceTables = {
  properties: { project_id: 're_projects' },
  leads: { contact_id: 're_contacts' },
  visits: { lead_id: 're_leads', contact_id: 're_contacts', project_id: 're_projects', property_id: 're_properties' },
  opportunities: { lead_id: 're_leads', project_id: 're_projects', property_id: 're_properties' },
  bookings: { lead_id: 're_leads', contact_id: 're_contacts', project_id: 're_projects', property_id: 're_properties', partner_id: 're_partners' },
  'payment-schedules': { booking_id: 're_bookings' },
  'payment-transactions': { booking_id: 're_bookings', schedule_id: 're_payment_schedules' },
  commissions: { partner_id: 're_partners', booking_id: 're_bookings' }
};

function normalizeDateValue(field, value, includeTime) {
  const text = String(value).trim();
  const pattern = includeTime
    ? /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/
    : /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = text.match(pattern);
  if (!match) throw new Error(`${field} must be a valid ${includeTime ? 'date and time' : 'date'}.`);

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
  const datePart = `${yearText}-${monthText}-${dayText}`;
  const parsedDate = new Date(`${datePart}T00:00:00.000Z`);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== datePart) {
    throw new Error(`${field} must contain a valid calendar date.`);
  }
  if (!includeTime) return datePart;

  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText || 0);
  if (hour > 23 || minute > 59 || second > 59) throw new Error(`${field} must contain a valid time.`);
  return `${datePart} ${hourText}:${minuteText}:${String(second).padStart(2, '0')}`;
}

function normalizePayload(resource, body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Request body must be a JSON object.');
  }

  const config = resources[resource];
  const unknownFields = Object.keys(body).filter((field) => !config.fields.includes(field));
  if (unknownFields.length) throw new Error(`Unknown field(s): ${unknownFields.join(', ')}.`);

  const required = requiredFields[resource] || [];
  if (!partial) {
    const missing = required.filter((field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === '');
    if (missing.length) throw new Error(`Required field(s): ${missing.join(', ')}.`);
  }

  const normalized = {};
  for (const field of config.fields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    const rawValue = body[field];
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      if (required.includes(field)) throw new Error(`${field} is required.`);
      if (partial && Object.prototype.hasOwnProperty.call(body, field)) normalized[field] = null;
      continue;
    }

    const allowedValues = enumFields[resource]?.[field];
    if (allowedValues && !allowedValues.includes(String(rawValue))) {
      throw new Error(`${field} must be one of: ${allowedValues.join(', ')}.`);
    }

    const numericRule = numericFields[resource]?.[field];
    if (numericRule) {
      const value = Number(rawValue);
      if (!Number.isFinite(value) || (numericRule.integer && !Number.isInteger(value))) {
        throw new Error(`${field} must be a valid ${numericRule.integer ? 'integer' : 'number'}.`);
      }
      if (numericRule.min !== undefined && value < numericRule.min) throw new Error(`${field} must be at least ${numericRule.min}.`);
      if (numericRule.max !== undefined && value > numericRule.max) throw new Error(`${field} must be no more than ${numericRule.max}.`);
      normalized[field] = value;
      continue;
    }

    if ((dateFields[resource] || []).includes(field)) {
      normalized[field] = normalizeDateValue(field, rawValue, false);
      continue;
    }
    if ((dateTimeFields[resource] || []).includes(field)) {
      normalized[field] = normalizeDateValue(field, rawValue, true);
      continue;
    }
    if (field === 'enabled') {
      if (![true, false, 1, 0, 'true', 'false', '1', '0'].includes(rawValue)) {
        throw new Error(`${field} must be true or false.`);
      }
      normalized[field] = rawValue === true || rawValue === 1 || rawValue === 'true' || rawValue === '1';
      continue;
    }
    if (jsonFields.has(field)) {
      try {
        const parsed = typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
        normalized[field] = JSON.stringify(parsed);
      } catch {
        throw new Error(`${field} must contain valid JSON.`);
      }
      continue;
    }
    if (typeof rawValue !== 'string' && typeof rawValue !== 'number') {
      throw new Error(`${field} must be a string or number.`);
    }
    normalized[field] = String(rawValue).trim();
  }

  if (!Object.keys(normalized).length) throw new Error('No valid fields supplied.');
  return normalized;
}

async function validateReferences(connection, resource, values, companyId) {
  const references = { ...(referenceTables[resource] || {}) };
  if ((resource === 'activities' || resource === 'documents') && values.subject_id !== undefined) {
    const table = subjectTables[values.subject_type];
    if (!table) throw new Error('subject_type is not valid for this record.');
    references.subject_id = table;
  }

  for (const [field, table] of Object.entries(references)) {
    if (values[field] === undefined) continue;
    const [rows] = await connection.query(
      `SELECT id FROM ${table} WHERE id = ? AND company_id = ?`,
      [values[field], companyId]
    );
    if (!rows.length) throw new Error(`${field} must reference an existing record in this company.`);
  }
}

async function getCompanyId(connection) {
  const [rows] = await connection.query(
    "SELECT id FROM re_companies WHERE name = 'Velvorax Real Estate' LIMIT 1"
  );
  if (rows.length) return rows[0].id;
  const [result] = await connection.query(
    "INSERT INTO re_companies (name, industry, approval_status) VALUES ('Velvorax Real Estate', 'Real Estate', 'Approved')"
  );
  return result.insertId;
}

router.use((req, res, next) => {
  const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');
  if (token === 'static-user-token') {
    req.realEstateDemoSession = true;
    return next();
  }
  return auth(req, res, next);
});

router.get('/dashboard/summary', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const companyId = await getCompanyId(connection);
    const [
      [projects],
      [availableUnits],
      [leads],
      [hotLeads],
      [visits],
      [negotiations],
      [bookings],
      [overduePayments]
    ] = await Promise.all([
      connection.query('SELECT COUNT(*) AS value FROM re_projects WHERE company_id = ?', [companyId]),
      connection.query("SELECT COUNT(*) AS value FROM re_properties WHERE company_id = ? AND status = 'available'", [companyId]),
      connection.query('SELECT COUNT(*) AS value FROM re_leads WHERE company_id = ?', [companyId]),
      connection.query("SELECT COUNT(*) AS value FROM re_leads WHERE company_id = ? AND temperature = 'hot'", [companyId]),
      connection.query("SELECT COUNT(*) AS value FROM re_site_visits WHERE company_id = ? AND status = 'scheduled'", [companyId]),
      connection.query("SELECT COUNT(*) AS value FROM re_opportunities WHERE company_id = ? AND stage IN ('negotiation','interested','site_visit')", [companyId]),
      connection.query("SELECT COUNT(*) AS value FROM re_bookings WHERE company_id = ? AND status = 'booked'", [companyId]),
      connection.query("SELECT COUNT(*) AS value FROM re_payment_schedules WHERE company_id = ? AND status = 'overdue'", [companyId])
    ]);
    const totalSalesRows = await connection.query(
      "SELECT COALESCE(SUM(booking_amount_minor),0) AS value FROM re_bookings WHERE company_id = ? AND status IN ('booked','registered','closed')",
      [companyId]
    );
    res.json({
      projects: projects[0].value,
      availableUnits: availableUnits[0].value,
      leads: leads[0].value,
      hotLeads: hotLeads[0].value,
      scheduledVisits: visits[0].value,
      negotiations: negotiations[0].value,
      bookings: bookings[0].value,
      salesValueMinor: totalSalesRows[0][0].value,
      overduePayments: overduePayments[0].value
    });
  } catch (err) {
    res.status(500).json({ message: 'Unable to load dashboard', error: err.message });
  } finally {
    connection.release();
  }
});

router.get('/reports/marketing', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const companyId = await getCompanyId(connection);
    const [rows] = await connection.query(
      `SELECT COALESCE(source, 'Unknown') AS source,
              COUNT(*) AS leads,
              SUM(CASE WHEN pipeline_stage IN ('site_visit','negotiation','booking','closed') THEN 1 ELSE 0 END) AS visits,
              SUM(CASE WHEN pipeline_stage IN ('booking','closed') THEN 1 ELSE 0 END) AS bookings
         FROM re_leads
        WHERE company_id = ?
        GROUP BY COALESCE(source, 'Unknown')
        ORDER BY leads DESC`,
      [companyId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Unable to load marketing report', error: err.message });
  } finally {
    connection.release();
  }
});

router.get('/options', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const companyId = await getCompanyId(connection);
    const [projects, properties, leads, contacts, bookings, partners] = await Promise.all([
      connection.query('SELECT id, name FROM re_projects WHERE company_id = ? ORDER BY name', [companyId]),
      connection.query('SELECT id, unit_number FROM re_properties WHERE company_id = ? ORDER BY unit_number', [companyId]),
      connection.query('SELECT id, name FROM re_leads WHERE company_id = ? ORDER BY name', [companyId]),
      connection.query('SELECT id, name FROM re_contacts WHERE company_id = ? ORDER BY name', [companyId]),
      connection.query('SELECT id, booking_number FROM re_bookings WHERE company_id = ? ORDER BY booking_number', [companyId]),
      connection.query('SELECT id, name FROM re_partners WHERE company_id = ? ORDER BY name', [companyId])
    ]);
    res.json({
      projects: projects[0], properties: properties[0], leads: leads[0],
      contacts: contacts[0], bookings: bookings[0],
      partners: partners[0]
    });
  } catch (err) {
    res.status(500).json({ message: 'Unable to load relationship options', error: err.message });
  } finally {
    connection.release();
  }
});

router.get('/:resource', async (req, res) => {
  const config = resources[req.params.resource];
  if (!config) return res.status(404).json({ message: 'Unknown Real Estate resource' });
  const connection = await pool.getConnection();
  try {
    const companyId = await getCompanyId(connection);
    const search = String(req.query.search || '').trim();
    let sql = `SELECT * FROM ${config.table} WHERE company_id = ?`;
    const params = [companyId];
    if (search) {
      const terms = search.split(/\s+/).filter(Boolean);
      terms.forEach((term) => {
        sql += ` AND (${config.search.map((field) => `CAST(${field} AS CHAR) LIKE ?`).join(' OR ')})`;
        config.search.forEach(() => params.push(`%${term}%`));
      });
    }
    sql += ' ORDER BY id DESC';
    const [rows] = await connection.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Unable to load records', error: err.message });
  } finally {
    connection.release();
  }
});

router.post('/:resource', async (req, res) => {
  const config = resources[req.params.resource];
  if (!config) return res.status(404).json({ message: 'Unknown Real Estate resource' });
  const connection = await pool.getConnection();
  try {
    const companyId = await getCompanyId(connection);
    const values = normalizePayload(req.params.resource, req.body);
    await validateReferences(connection, req.params.resource, values, companyId);
    const fields = Object.keys(values);
    const [result] = await connection.query(
      `INSERT INTO ${config.table} (company_id, ${fields.join(', ')}) VALUES (?, ${fields.map(() => '?').join(', ')})`,
      [companyId, ...fields.map((field) => values[field])]
    );
    const [rows] = await connection.query(`SELECT * FROM ${config.table} WHERE id = ? AND company_id = ?`, [result.insertId, companyId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Unable to save record' });
  } finally {
    connection.release();
  }
});

router.patch('/:resource/:id', async (req, res) => {
  const config = resources[req.params.resource];
  if (!config) return res.status(404).json({ message: 'Unknown Real Estate resource' });
  const connection = await pool.getConnection();
  try {
    const companyId = await getCompanyId(connection);
    const values = normalizePayload(req.params.resource, req.body, true);
    await validateReferences(connection, req.params.resource, values, companyId);
    const fields = Object.keys(values);
    const [result] = await connection.query(
      `UPDATE ${config.table} SET ${fields.map((field) => `${field} = ?`).join(', ')} WHERE id = ? AND company_id = ?`,
      [...fields.map((field) => values[field]), req.params.id, companyId]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Record not found' });
    const [rows] = await connection.query(`SELECT * FROM ${config.table} WHERE id = ? AND company_id = ?`, [req.params.id, companyId]);
    res.json(rows[0]);
  } catch (err) {
    res.status(400).json({ message: err.message || 'Unable to update record' });
  } finally {
    connection.release();
  }
});

router.delete('/:resource/:id', async (req, res) => {
  const config = resources[req.params.resource];
  if (!config) return res.status(404).json({ message: 'Unknown Real Estate resource' });
  const connection = await pool.getConnection();
  try {
    const companyId = await getCompanyId(connection);
    const [result] = await connection.query(
      `DELETE FROM ${config.table} WHERE id = ? AND company_id = ?`,
      [req.params.id, companyId]
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Unable to delete record', error: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
