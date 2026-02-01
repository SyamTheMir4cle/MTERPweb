const mongoose = require('mongoose');

const workItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, default: 0 },
  volume: { type: String, default: 'M2' },
  cost: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
});

const supplySchema = new mongoose.Schema({
  item: { type: String, required: true },
  cost: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['Pending', 'Ordered', 'Delivered'],
    default: 'Pending',
  },
  deliveryDate: Date,
});

const dailyReportSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  progressPercent: { type: Number, default: 0 },
  weather: { type: String, default: 'Cerah' },
  materials: String,
  workforce: String,
  notes: String,
  photos: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

const projectSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: true,
    trim: true,
  },
  lokasi: {
    type: String,
    required: true,
    trim: true,
  },
  description: String,
  totalBudget: {
    type: Number,
    default: 0,
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  status: {
    type: String,
    enum: ['Planning', 'In Progress', 'Completed', 'On Hold'],
    default: 'Planning',
  },
  startDate: Date,
  endDate: Date,
  
  // Documents
  documents: {
    shopDrawing: String,
    hse: String,
    manPowerList: String,
    materialList: String,
  },
  
  workItems: [workItemSchema],
  supplies: [supplySchema],
  dailyReports: [dailyReportSchema],
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update progress based on work items
projectSchema.methods.calculateProgress = function() {
  if (!this.workItems || this.workItems.length === 0) return 0;
  const totalProgress = this.workItems.reduce((sum, item) => sum + (item.progress || 0), 0);
  return Math.round(totalProgress / this.workItems.length);
};

// Update timestamps
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Project', projectSchema);
