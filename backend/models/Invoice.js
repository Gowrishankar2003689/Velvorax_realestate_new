const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true
  },
  billFrom: {
    type: String,
    required: true
  },
  billTo: {
    type: String,
    required: true
  },
  poNumber: {
    type: String
  },
  lineItems: [
    {
      description: { type: String, required: true },
      quantity: { type: Number, required: true },
      rate: { type: Number, required: true },
      amount: { type: Number, required: true }
    }
  ],
  currency: {
    type: String,
    default: 'USD'
  },
  taxPercent: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Paid', 'Unpaid', 'Pending'],
    default: 'Unpaid'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);
