const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: String,
    default: 'Velvorax Intelligence'
  },
  authorEmail: {
    type: String,
    required: true
  },
  authorPhone: {
    type: String
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    default: 'General'
  },
  image: {
    type: String,
    default: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200&auto=format&fit=crop'
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);
