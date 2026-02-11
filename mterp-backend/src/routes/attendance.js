const express = require('express');
const { Attendance, User } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// GET /api/attendance - Get attendance records
router.get('/', auth, async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;
    
    let query = {};
    
    // Filter by user (workers can only see their own)
    if (req.user.role === 'worker') {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const attendance = await Attendance.find(query)
      .populate('userId', 'fullName role')
      .populate('projectId', 'nama')
      .sort({ date: -1 });
    
    res.json(attendance);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/attendance/today - Get today's attendance for current user
router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      userId: req.user._id,
      date: today,
    });
    
    res.json(attendance || null);
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/attendance/recap - Get attendance recap/summary
router.get('/recap', auth, async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    let query = {};
    
    // Workers can only see their own
    if (req.user.role === 'worker') {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }
    
    // Date range filter
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const attendance = await Attendance.find(query)
      .populate('userId', 'fullName role')
      .sort({ date: -1 });
    
    // Calculate summary
    const summary = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'Present').length,
      late: attendance.filter(a => a.status === 'Late').length,
      absent: attendance.filter(a => a.status === 'Absent').length,
      totalHours: 0,
      wageMultiplierTotal: 0,
    };
    
    // Calculate hours worked
    attendance.forEach(a => {
      if (a.checkIn?.time && a.checkOut?.time) {
        const hours = (new Date(a.checkOut.time) - new Date(a.checkIn.time)) / (1000 * 60 * 60);
        summary.totalHours += hours;
      }
      summary.wageMultiplierTotal += a.wageMultiplier || 1;
    });
    
    res.json({ records: attendance, summary });
  } catch (error) {
    console.error('Get attendance recap error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/attendance/users - Get list of users for filtering (supervisors+)
router.get('/users', auth, authorize('owner', 'director', 'supervisor'), async (req, res) => {
  try {
    const users = await User.find({ isVerified: true })
      .select('_id fullName role')
      .sort({ fullName: 1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/attendance/checkin - Simple check in (no photo required)
router.post('/checkin', auth, async (req, res) => {
  try {
    const { projectId, lat, lng } = req.body;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if already checked in today
    let attendance = await Attendance.findOne({
      userId: req.user._id,
      date: today,
    });
    
    if (attendance && attendance.checkIn?.time) {
      return res.status(400).json({ msg: 'Already checked in today' });
    }
    
    const checkInData = {
      time: new Date(),
      location: lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
    };
    
    if (attendance) {
      attendance.checkIn = checkInData;
    } else {
      attendance = new Attendance({
        userId: req.user._id,
        date: today,
        checkIn: checkInData,
        wageType: 'daily',
        wageMultiplier: 1,
        projectId: projectId || undefined,
        status: 'Present',
      });
    }
    
    await attendance.save();
    await attendance.populate('userId', 'fullName');
    
    res.status(201).json(attendance);
  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/attendance/checkout - Check out (with selfie photo required)
router.put('/checkout', auth, uploadLimiter, upload.single('photo'), async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.findOne({
      userId: req.user._id,
      date: today,
    });
    
    if (!attendance) {
      return res.status(400).json({ msg: 'No check-in record found for today' });
    }
    
    if (attendance.checkOut?.time) {
      return res.status(400).json({ msg: 'Already checked out today' });
    }
    
    if (!req.file) {
      return res.status(400).json({ msg: 'Selfie photo is required for check-out' });
    }
    
    attendance.checkOut = {
      time: new Date(),
      photo: req.file.path,
      location: lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
    };
    
    await attendance.save();
    await attendance.populate('userId', 'fullName');
    
    res.json(attendance);
  } catch (error) {
    console.error('Check out error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/attendance/:id/wage - Set wage type (supervisor only)
router.put('/:id/wage', auth, authorize('owner', 'director', 'supervisor'), async (req, res) => {
  try {
    const { wageType } = req.body;
    
    const wageMultipliers = {
      'daily': 1,
      'overtime_1.5': 1.5,
      'overtime_2': 2,
    };
    
    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          wageType: wageType || 'daily',
          wageMultiplier: wageMultipliers[wageType] || 1,
        }
      },
      { new: true }
    ).populate('userId', 'fullName role');
    
    if (!attendance) {
      return res.status(404).json({ msg: 'Attendance record not found' });
    }
    
    res.json(attendance);
  } catch (error) {
    console.error('Update wage error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Legacy POST /api/attendance - for backwards compatibility
router.post('/', auth, uploadLimiter, upload.single('photo'), async (req, res) => {
  try {
    const { wageType, projectId, lat, lng } = req.body;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let attendance = await Attendance.findOne({
      userId: req.user._id,
      date: today,
    });
    
    if (attendance && attendance.checkIn?.time) {
      return res.status(400).json({ msg: 'Already checked in today' });
    }
    
    const wageMultipliers = {
      'daily': 1,
      'overtime_1.5': 1.5,
      'overtime_2': 2,
    };
    
    const checkInData = {
      time: new Date(),
      photo: req.file ? req.file.path : undefined,
      location: lat && lng ? { lat: Number(lat), lng: Number(lng) } : undefined,
    };
    
    if (attendance) {
      attendance.checkIn = checkInData;
      attendance.wageType = wageType || 'daily';
      attendance.wageMultiplier = wageMultipliers[wageType] || 1;
    } else {
      attendance = new Attendance({
        userId: req.user._id,
        date: today,
        checkIn: checkInData,
        wageType: wageType || 'daily',
        wageMultiplier: wageMultipliers[wageType] || 1,
        projectId: projectId || undefined,
        status: 'Present',
      });
    }
    
    await attendance.save();
    await attendance.populate('userId', 'fullName');
    
    res.status(201).json(attendance);
  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;

