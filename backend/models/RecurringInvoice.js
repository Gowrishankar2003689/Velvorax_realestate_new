const mongoose = require('mongoose');

const RecurringInvoiceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Yearly'],
    required: true
  },
  nextDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('RecurringInvoice', RecurringInvoiceSchema);
