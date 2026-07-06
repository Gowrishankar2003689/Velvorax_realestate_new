const mongoose = require("mongoose");

const PromptUsageSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: String, // format: YYYY-MM-DD
    required: true,
    index: true
  },
  count: {
    type: Number,
    required: true,
    default: 0
  }
});

// Compound index to ensure uniqueness of user email + date combination
PromptUsageSchema.index({ email: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("PromptUsage", PromptUsageSchema);
