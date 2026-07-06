const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  dueDate: Date,
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'On Hold'],
    default: 'Pending'
  },
  completionPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Dynamic reference: Can link to 'User' OR 'StandardUser'
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'assignedToModel'
  },
  assignedToModel: {
    type: String,
    required: true,
    enum: ['User', 'StandardUser'],
    default: 'User'
  },
  relatedTo: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', TaskSchema);
