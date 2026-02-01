const express = require('express');
const { Project, Attendance } = require('../models');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/updates - Get site updates/activity feed
router.get('/', auth, async (req, res) => {
  try {
    const updates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get today's date range
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);
    
    // Last 7 days
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // 1. Get recently created projects (last 7 days)
    const recentProjects = await Project.find({
      createdAt: { $gte: weekAgo }
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('nama lokasi createdAt status');
    
    recentProjects.forEach(project => {
      updates.push({
        _id: `project-${project._id}`,
        type: 'project',
        icon: 'HardHat',
        title: 'New Project',
        description: project.nama,
        subtitle: project.lokasi,
        timestamp: project.createdAt,
        color: '#D97706',
        bg: '#FEF3C7',
      });
    });
    
    // 2. Get today's attendance summary
    const todayAttendance = await Attendance.find({
      date: { $gte: today, $lte: todayEnd }
    }).populate('userId', 'fullName');
    
    if (todayAttendance.length > 0) {
      // Calculate total hours worked today
      let totalHours = 0;
      let completedCount = 0;
      
      todayAttendance.forEach(a => {
        if (a.checkIn?.time && a.checkOut?.time) {
          const hours = (new Date(a.checkOut.time) - new Date(a.checkIn.time)) / (1000 * 60 * 60);
          totalHours += hours;
          completedCount++;
        }
      });
      
      updates.push({
        _id: 'attendance-today',
        type: 'attendance',
        icon: 'Clock',
        title: 'Today\'s Attendance',
        description: `${todayAttendance.length} checked in`,
        subtitle: completedCount > 0 ? `${totalHours.toFixed(1)} total man-hours` : 'In progress',
        timestamp: new Date(),
        color: '#10B981',
        bg: '#D1FAE5',
      });
    }
    
    // 3. Get recent daily reports (from projects with recent dailyReports)
    const projectsWithReports = await Project.find({
      'dailyReports.date': { $gte: weekAgo }
    })
      .select('nama dailyReports')
      .limit(5);
    
    projectsWithReports.forEach(project => {
      const recentReports = project.dailyReports
        .filter(r => new Date(r.date) >= weekAgo)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      if (recentReports.length > 0) {
        const latestReport = recentReports[0];
        updates.push({
          _id: `report-${project._id}-${latestReport._id || latestReport.date}`,
          type: 'report',
          icon: 'FileText',
          title: 'Daily Report',
          description: project.nama,
          subtitle: `${latestReport.progressPercent || 0}% progress`,
          timestamp: latestReport.date,
          color: '#3B82F6',
          bg: '#DBEAFE',
        });
      }
    });
    
    // Sort all updates by timestamp (newest first)
    updates.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit to latest 10
    const limitedUpdates = updates.slice(0, 10);
    
    res.json(limitedUpdates);
  } catch (error) {
    console.error('Get updates error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
