const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  leadId: String,

  name: { type: String, required: true },
  company: String,
  email: String,
  phone: String,
  whatsapp: String,
  address: String,
  industry: String,
  businessType: String,
  designation: String,
  requirement: String,

  service: {
    type: String,
    enum: ["CRM", "Website", "App", "AI Automation", "Marketing", "Other"],
    default: "Other"
  },
  timeline: {
    type: String,
    default: "Flexible"
  },
  urgent: {
    type: Boolean,
    default: false
  },
  isHot: {
    type: Boolean,
    default: false,
    index: true
  },
  teleCaller: {
    type: String,
    default: "Unassigned"
  },
  vendingDetails: {
    type: String,
    default: "Pending initial callback checklist."
  },

  budget: { type: Number, default: 0 },

  priority: {
    type: String,
    enum: ['Hot', 'Warm', 'Cold'],
    default: 'Warm'
  },

  status: {
    type: String,
    enum: ['New', 'Assigned', 'In Process', 'Converted', 'Recycled', 'Closed', 'Lost'],
    default: 'New'
  },

  source: String,
  followUpDate: Date,
  notes: String,

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'createdByModel'
  },
  createdByModel: {
    type: String,
    enum: ['User', 'StandardUser'],
    default: 'User'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'assignedToModel'
  },
  assignedToModel: {
    type: String,
    enum: ['User', 'StandardUser'],
    default: 'User'
  },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },

  lastActivity: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Lead', LeadSchema);