const mongoose = require('mongoose');

const DailyAssignmentSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  dayOfWeek: {
    type: String,
    required: true
  },
  assignments: [{
    type: {
      type: String,
      enum: ['revision', 'new', 'special'],
      required: true
    },
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
      enum: ['perfect', 'medium', 'bad', 'not_memorized', 'special'],
      required: true
    },
    description: String,
    completed: {
      type: Boolean,
      default: false
    }
  }]
});

const ScheduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  dailyNewPages: {
    type: Number,
    required: true,
    min: 0.5,
    max: 5
  },
  totalDays: {
    type: Number,
    required: true,
    min: 1
  },
  direction: {
    type: String,
    enum: ['forward', 'reverse'],
    default: 'forward'
  },
  dailySchedule: [DailyAssignmentSchema],
  userId: {
    type: String,
    default: 'default_user'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  completedDays: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Schedule', ScheduleSchema);