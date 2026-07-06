const mongoose = require('mongoose');

const DailyActivitySchema = new mongoose.Schema({
    activity: {
        type: String
    },
    type: {
        type: String
    },
    time: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

const WorkSessionSchema = new mongoose.Schema({
    punchIn: Date,
    punchOut: Date,
    durationMinutes: {
        type: Number,
        default: 0
    }
}, { _id: false });

const UserSchema = new mongoose.Schema({

    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    phone: {
        type: String,
        required: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        default: 'staff'
    },

    status: {
        type: String,
        enum: ['pending', 'approved', 'active', 'rejected'],
        default: 'pending'
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

    dailyActivityLog: {
        type: [DailyActivitySchema],
        default: []
    },

    workSessions: {
        type: [WorkSessionSchema],
        default: []
    },

    totalCalls: {
        type: Number,
        default: 0
    },

    talkTimeSeconds: {
        type: Number,
        default: 0
    },

    qualityScore: {
        type: Number,
        default: 0
    },

    resetPasswordToken: String,
    resetPasswordExpires: Date

}, {
    timestamps: true
});

module.exports = mongoose.models.StandardUser ||
    mongoose.model('StandardUser', UserSchema);