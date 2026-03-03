const mongoose = require('mongoose');

const materialLogSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  supplyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supply',
    required: true,
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  qtyUsed: {
    type: Number,
    required: true,
    min: 0,
  },
  qtyLeft: {
    type: Number,
    default: 0,
  },
  notes: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient queries
materialLogSchema.index({ projectId: 1, date: -1 });
materialLogSchema.index({ supplyId: 1, date: -1 });

module.exports = mongoose.model('MaterialLog', materialLogSchema);
