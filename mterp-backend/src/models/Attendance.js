const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: () => new Date().setHours(0, 0, 0, 0),
  },
  checkIn: {
    time: Date,
    photo: String,
    location: {
      lat: Number,
      lng: Number,
    },
  },
  checkOut: {
    time: Date,
    photo: String,
    location: {
      lat: Number,
      lng: Number,
    },
  },
  wageType: {
    type: String,
    enum: ['daily', 'overtime_1.5', 'overtime_2'],
    default: 'daily',
  },
  wageMultiplier: {
    type: Number,
    default: 1,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  notes: String,
  status: {
    type: String,
    enum: ['Present', 'Absent', 'Late', 'Half-day'],
    default: 'Present',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index for user + date uniqueness
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
