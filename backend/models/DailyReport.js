const mongoose = require('mongoose');

const DailyReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'userModel',
    required: true
  },
  userModel: {
    type: String,
    enum: ['User', 'StandardUser'],
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  filename: {
    type: String,
    required: true
  },
  fileData: {
    type: Buffer,
    required: true
  },
  contentType: {
    type: String,
    default: 'application/pdf'
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DailyReport', DailyReportSchema);
