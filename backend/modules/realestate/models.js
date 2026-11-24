const mongoose = require('mongoose');

const { Schema } = mongoose;
const objectId = (ref) => ({ type: Schema.Types.ObjectId, ref, required: true, index: true });
const tenantId = { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true };

const ReProjectSchema = new Schema({
  companyId: tenantId,
  name: { type: String, required: true, trim: true },
  developerName: { type: String, trim: true },
  location: {
    city: String,
    locality: String,
    address: String
  },
  projectType: { type: String, enum: ['residential', 'commercial', 'villa', 'plot', 'mixed'], default: 'residential' },
  reraNumber: String,
  totalUnits: { type: Number, min: 0, default: 0 },
  availableUnits: { type: Number, min: 0, default: 0 },
  soldUnits: { type: Number, min: 0, default: 0 },
  blocks: [{ name: String, floors: Number }],
  amenities: [String],
  possessionDate: Date,
  status: { type: String, enum: ['active', 'launching', 'completed', 'paused'], default: 'active' }
}, { timestamps: true, collection: 're_projects' });
ReProjectSchema.index({ companyId: 1, status: 1, name: 1 });

const RePropertySchema = new Schema({
  companyId: tenantId,
  projectId: objectId('ReProject'),
  unitNumber: { type: String, required: true, trim: true },
  block: String,
  floor: Number,
  propertyType: { type: String, enum: ['apartment', 'villa', 'plot', 'office', 'retail'], default: 'apartment' },
  bhk: { type: Number, min: 0 },
  areaSqFt: { type: Number, min: 0 },
  facing: String,
  basePriceMinor: { type: Number, min: 0, default: 0 },
  currentPriceMinor: { type: Number, min: 0, default: 0 },
  currency: { type: String, default: 'INR' },
  parking: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['available', 'hold', 'booked', 'sold', 'blocked'], default: 'available' }
}, { timestamps: true, collection: 're_properties' });
RePropertySchema.index({ companyId: 1, projectId: 1, unitNumber: 1 }, { unique: true });
RePropertySchema.index({ companyId: 1, status: 1, projectId: 1 });

const ReContactSchema = new Schema({
  companyId: tenantId,
  name: { type: String, required: true, trim: true },
  contactType: { type: String, enum: ['buyer', 'developer', 'channel_partner', 'other'], default: 'buyer' },
  phone: String,
  email: String,
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true, collection: 're_contacts' });
ReContactSchema.index({ companyId: 1, phone: 1 });
ReContactSchema.index({ companyId: 1, email: 1 });

const ReLeadSchema = new Schema({
  companyId: tenantId,
  contactId: { type: Schema.Types.ObjectId, ref: 'ReContact' },
  name: { type: String, required: true, trim: true },
  phone: String,
  email: String,
  source: { type: String, default: 'website' },
  campaign: String,
  propertyInterest: [{ projectId: { type: Schema.Types.ObjectId, ref: 'ReProject' }, bhk: Number, location: String }],
  budgetMinMinor: { type: Number, min: 0, default: 0 },
  budgetMaxMinor: { type: Number, min: 0, default: 0 },
  buyingTimeline: { type: String, enum: ['0_3_months', '3_6_months', '6_12_months', 'flexible'], default: 'flexible' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  score: {
    value: { type: Number, min: 0, max: 100, default: 0 },
    temperature: { type: String, enum: ['hot', 'warm', 'cold'], default: 'cold' },
    ruleSetVersion: { type: String, default: 'v1' }
  },
  signals: {
    budgetProvided: { type: Boolean, default: false },
    propertySelected: { type: Boolean, default: false },
    callCount: { type: Number, min: 0, default: 0 },
    responseCount: { type: Number, min: 0, default: 0 },
    siteVisitCompleted: { type: Boolean, default: false },
    followUpCompleted: { type: Boolean, default: false },
    negotiationStarted: { type: Boolean, default: false },
    bookingInterest: { type: Boolean, default: false }
  },
  pipelineStage: { type: String, enum: ['new', 'qualified', 'property_shortlisted', 'site_visit', 'negotiation', 'booking', 'closed', 'lost'], default: 'new' },
  bookingProbability: { type: Number, min: 0, max: 100, default: 0 },
  nextFollowUpAt: Date,
  notes: String
}, { timestamps: true, collection: 're_leads' });
ReLeadSchema.index({ companyId: 1, assignedTo: 1, nextFollowUpAt: 1 });
ReLeadSchema.index({ companyId: 1, source: 1, createdAt: -1 });

const ReSiteVisitSchema = new Schema({
  companyId: tenantId,
  leadId: { type: Schema.Types.ObjectId, ref: 'ReLead' },
  contactId: { type: Schema.Types.ObjectId, ref: 'ReContact' },
  projectId: { type: Schema.Types.ObjectId, ref: 'ReProject' },
  propertyId: { type: Schema.Types.ObjectId, ref: 'ReProperty' },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
  scheduledAt: { type: Date, required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'], default: 'scheduled' },
  feedback: String,
  nextFollowUpAt: Date
}, { timestamps: true, collection: 're_site_visits' });
ReSiteVisitSchema.index({ companyId: 1, scheduledAt: 1, status: 1 });

const ReOpportunitySchema = new Schema({
  companyId: tenantId,
  leadId: { type: Schema.Types.ObjectId, ref: 'ReLead', required: true },
  projectId: { type: Schema.Types.ObjectId, ref: 'ReProject' },
  propertyId: { type: Schema.Types.ObjectId, ref: 'ReProperty' },
  stage: { type: String, enum: ['interested', 'site_visit', 'negotiation', 'booking', 'closed', 'lost'], default: 'interested' },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  estimatedValueMinor: { type: Number, min: 0, default: 0 },
  probability: { type: Number, min: 0, max: 100, default: 0 },
  stageChangedAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 're_opportunities' });
ReOpportunitySchema.index({ companyId: 1, stage: 1, ownerId: 1 });

const ReBookingSchema = new Schema({
  companyId: tenantId,
  bookingNumber: { type: String, unique: true, required: true },
  leadId: { type: Schema.Types.ObjectId, ref: 'ReLead' },
  contactId: { type: Schema.Types.ObjectId, ref: 'ReContact' },
  projectId: { type: Schema.Types.ObjectId, ref: 'ReProject', required: true },
  propertyId: { type: Schema.Types.ObjectId, ref: 'ReProperty', required: true },
  bookingAmountMinor: { type: Number, min: 0, required: true },
  bookingDate: { type: Date, required: true },
  ownerId: { type: Schema.Types.ObjectId, ref: 'User' },
  partnerId: { type: Schema.Types.ObjectId, ref: 'RePartner' },
  agreementStatus: { type: String, enum: ['draft', 'in_review', 'signed', 'cancelled'], default: 'draft' },
  status: { type: String, enum: ['booked', 'registered', 'cancelled', 'closed'], default: 'booked' }
}, { timestamps: true, collection: 're_bookings' });
ReBookingSchema.index({ companyId: 1, projectId: 1, status: 1 });

const RePaymentScheduleSchema = new Schema({
  companyId: tenantId,
  bookingId: { type: Schema.Types.ObjectId, ref: 'ReBooking', required: true },
  installmentName: { type: String, required: true },
  dueAt: { type: Date, required: true },
  amountMinor: { type: Number, min: 0, required: true },
  paidAmountMinor: { type: Number, min: 0, default: 0 },
  status: { type: String, enum: ['upcoming', 'due', 'paid', 'part_paid', 'overdue', 'cancelled'], default: 'upcoming' }
}, { timestamps: true, collection: 're_paymentSchedules' });
RePaymentScheduleSchema.index({ companyId: 1, bookingId: 1, dueAt: 1, status: 1 });

const RePartnerSchema = new Schema({
  companyId: tenantId,
  name: { type: String, required: true, trim: true },
  contactName: String,
  phone: String,
  email: String,
  commissionPolicy: String,
  status: { type: String, enum: ['active', 'inactive', 'review'], default: 'active' }
}, { timestamps: true, collection: 're_partners' });
RePartnerSchema.index({ companyId: 1, name: 1 });

const ReActivitySchema = new Schema({
  companyId: tenantId,
  subjectType: { type: String, enum: ['lead', 'contact', 'project', 'property', 'visit', 'opportunity', 'booking', 'partner'], required: true },
  subjectId: { type: Schema.Types.ObjectId, required: true },
  actorId: { type: Schema.Types.ObjectId, ref: 'User' },
  activityType: { type: String, enum: ['call', 'email', 'whatsapp', 'response', 'follow_up', 'stage_change', 'note', 'payment', 'visit', 'booking'], required: true },
  title: { type: String, required: true },
  description: String,
  metadata: Schema.Types.Mixed,
  occurredAt: { type: Date, default: Date.now }
}, { timestamps: true, collection: 're_activities' });
ReActivitySchema.index({ companyId: 1, subjectType: 1, subjectId: 1, occurredAt: -1 });

const RePaymentTransactionSchema = new Schema({
  companyId: tenantId,
  bookingId: { type: Schema.Types.ObjectId, ref: 'ReBooking', required: true },
  scheduleId: { type: Schema.Types.ObjectId, ref: 'RePaymentSchedule' },
  amountMinor: { type: Number, min: 0, required: true },
  paidAt: { type: Date, required: true },
  method: { type: String, enum: ['cash', 'bank_transfer', 'cheque', 'upi', 'card', 'gateway', 'other'], default: 'bank_transfer' },
  externalReference: String,
  receiptDocumentId: { type: Schema.Types.ObjectId, ref: 'ReDocument' },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'completed' }
}, { timestamps: true, collection: 're_paymentTransactions' });
RePaymentTransactionSchema.index({ companyId: 1, bookingId: 1, paidAt: -1 });

const ReCommissionSchema = new Schema({
  companyId: tenantId,
  partnerId: { type: Schema.Types.ObjectId, ref: 'RePartner', required: true },
  bookingId: { type: Schema.Types.ObjectId, ref: 'ReBooking', required: true },
  amountMinor: { type: Number, min: 0, required: true },
  status: { type: String, enum: ['earned', 'approved', 'paid', 'cancelled'], default: 'earned' },
  earnedAt: { type: Date, default: Date.now },
  paidAt: Date
}, { timestamps: true, collection: 're_commissions' });
ReCommissionSchema.index({ companyId: 1, partnerId: 1, status: 1 });

const ReDocumentSchema = new Schema({
  companyId: tenantId,
  subjectType: { type: String, enum: ['project', 'property', 'lead', 'contact', 'visit', 'opportunity', 'booking', 'partner'], required: true },
  subjectId: { type: Schema.Types.ObjectId, required: true },
  category: { type: String, enum: ['agreement', 'brochure', 'floor_plan', 'identity', 'payment_receipt', 'rera', 'other'], default: 'other' },
  name: { type: String, required: true },
  storageKey: { type: String, required: true },
  mimeType: String,
  sizeBytes: { type: Number, min: 0, default: 0 },
  uploaderId: { type: Schema.Types.ObjectId, ref: 'User' },
  acl: [{ type: Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true, collection: 're_documents' });
ReDocumentSchema.index({ companyId: 1, subjectType: 1, subjectId: 1 });

const ReAutomationRuleSchema = new Schema({
  companyId: tenantId,
  name: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  trigger: { type: String, required: true },
  conditions: Schema.Types.Mixed,
  actions: [{ type: { type: String, required: true }, config: Schema.Types.Mixed }],
  version: { type: Number, min: 1, default: 1 }
}, { timestamps: true, collection: 're_automationRules' });
ReAutomationRuleSchema.index({ companyId: 1, enabled: 1, trigger: 1 });

const ReIntegrationSchema = new Schema({
  companyId: tenantId,
  providerKey: { type: String, required: true },
  enabled: { type: Boolean, default: false },
  credentialsReference: { type: String, required: true },
  allowedCapabilities: [String],
  webhookSecretReference: String
}, { timestamps: true, collection: 're_integrations' });
ReIntegrationSchema.index({ companyId: 1, providerKey: 1 }, { unique: true });

module.exports = {
  ReProject: mongoose.model('ReProject', ReProjectSchema),
  ReProperty: mongoose.model('ReProperty', RePropertySchema),
  ReContact: mongoose.model('ReContact', ReContactSchema),
  ReLead: mongoose.model('ReLead', ReLeadSchema),
  ReSiteVisit: mongoose.model('ReSiteVisit', ReSiteVisitSchema),
  ReOpportunity: mongoose.model('ReOpportunity', ReOpportunitySchema),
  ReBooking: mongoose.model('ReBooking', ReBookingSchema),
  RePaymentSchedule: mongoose.model('RePaymentSchedule', RePaymentScheduleSchema),
  RePartner: mongoose.model('RePartner', RePartnerSchema),
  ReActivity: mongoose.model('ReActivity', ReActivitySchema),
  RePaymentTransaction: mongoose.model('RePaymentTransaction', RePaymentTransactionSchema),
  ReCommission: mongoose.model('ReCommission', ReCommissionSchema),
  ReDocument: mongoose.model('ReDocument', ReDocumentSchema),
  ReAutomationRule: mongoose.model('ReAutomationRule', ReAutomationRuleSchema),
  ReIntegration: mongoose.model('ReIntegration', ReIntegrationSchema)
};
