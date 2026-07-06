const mongoose = require("mongoose");

const HotLeadSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("HotLead", HotLeadSchema);
