const mongoose = require('mongoose');

const MemorizationStatusSchema = new mongoose.Schema({
  surahNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 114
  },
  pageNumber: {
    type: Number,
    required: true,
    min: 1,
    max: 604
  },
  status: {
    type: String,
    enum: ['perfect', 'medium', 'bad', 'not_memorized'],
    default: 'not_memorized',
    required: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  userId: {
    type: String,
    default: 'default_user' // For MVP, using single user
  }
}, {
  timestamps: true
});

// Compound index to ensure one status per user per surah per page
MemorizationStatusSchema.index({ userId: 1, surahNumber: 1, pageNumber: 1 }, { unique: true });

module.exports = mongoose.model('MemorizationStatus', MemorizationStatusSchema);