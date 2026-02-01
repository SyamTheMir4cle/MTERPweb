const mongoose = require('mongoose');

const kasbonSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  reason: String,
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Paid'],
    default: 'Pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  paidAt: Date,
  rejectionReason: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Kasbon', kasbonSchema);
