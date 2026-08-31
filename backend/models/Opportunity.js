const mongoose = require('mongoose');

const OpportunitySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  stage: {
    type: String,
    enum: ['Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
    default: 'Discovery'
  },
  probability: {
    type: Number,
    default: 10
  },
  expectedClose: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Opportunity', OpportunitySchema);
