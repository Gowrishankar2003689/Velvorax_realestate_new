const mongoose = require('mongoose');

const PricingSchema = new mongoose.Schema({
  tier: {
    type: String,
    required: true,
    unique: true
  },
  inr: {
    type: Number,
    required: true
  },
  usd: {
    type: Number,
    required: true
  },
  usersLimit: {
    type: Number,
    required: true
  },
  features: [String],
  setupInr: {
    type: String,
    default: '0'
  },
  setupUsd: {
    type: String,
    default: '0'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Pricing', PricingSchema);
