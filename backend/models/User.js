const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },

  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: String,
  roleInCompany: String,
  preferredLanguage: String,
  timezone: String,

  role: {
    type: String,
    enum: ['super_admin', 'client', 'admin', 'staff'],
    default: 'staff'
  },
  // Multi-platform session handling
  isLoggedInWeb: {
    type: Boolean,
    default: false
  },
  activeTokenWeb: {
    type: String,
    default: null
  },
  isLoggedInApp: {
    type: Boolean,
    default: false
  },
  activeTokenApp: {
    type: String,
    default: null
  },
  // Keep legacy fields for partial compatibility
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  activeToken: {
    type: String,
    default: null
  },
  location: {
    lat: Number,
    lng: Number,
    lastUpdated: Date
  },
  dailyActivityLog: [{
    activity: String,
    type: String,
    time: { type: Date, default: Date.now }
  }],
  workSessions: [{
    punchIn: Date,
    punchOut: Date,
    durationMinutes: { type: Number, default: 0 }
  }],
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);