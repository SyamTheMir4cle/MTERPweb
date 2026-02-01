const express = require('express');
const { Project } = require('../models');
const { auth, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/projects - Get all projects
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // Workers and supervisors see only assigned projects
    if (['worker', 'supervisor'].includes(req.user.role)) {
      query = {
        $or: [
          { assignedTo: req.user._id },
          { createdBy: req.user._id }
        ]
      };
    }
    
    const projects = await Project.find(query)
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/projects/:id - Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('createdBy', 'fullName')
      .populate('assignedTo', 'fullName role');
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/projects - Create project
router.post('/', auth, authorize('owner', 'director'), 
  upload.fields([
    { name: 'shopDrawing', maxCount: 1 },
    { name: 'hse', maxCount: 1 },
    { name: 'manPowerList', maxCount: 1 },
    { name: 'materialList', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { nama, lokasi, description, totalBudget, startDate, endDate, supplies, workItems } = req.body;
      
      const documents = {};
      if (req.files) {
        Object.keys(req.files).forEach(key => {
          if (req.files[key] && req.files[key][0]) {
            documents[key] = req.files[key][0].path;
          }
        });
      }
      
      const project = new Project({
        nama,
        lokasi,
        description,
        totalBudget: Number(totalBudget) || 0,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        documents,
        supplies: supplies ? JSON.parse(supplies) : [],
        workItems: workItems ? JSON.parse(workItems) : [],
        createdBy: req.user._id,
      });
      
      await project.save();
      res.status(201).json(project);
    } catch (error) {
      console.error('Create project error:', error);
      res.status(500).json({ msg: 'Server error' });
    }
  }
);

// PUT /api/projects/:id - Update project
router.put('/:id', auth, authorize('owner', 'director', 'supervisor'), async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/projects/:id/progress - Update project progress
router.put('/:id/progress', auth, authorize('owner', 'director', 'supervisor'), async (req, res) => {
  try {
    const { progress } = req.body;
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          progress: Math.min(100, Math.max(0, Number(progress))),
          status: Number(progress) >= 100 ? 'Completed' : 'In Progress'
        } 
      },
      { new: true }
    );
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    res.json(project);
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/projects/:id/daily-report - Add daily report
router.post('/:id/daily-report', auth, authorize('supervisor', 'owner', 'director'), async (req, res) => {
  try {
    const { progressPercent, weather, materials, workforce, notes, date } = req.body;
    
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    const report = {
      date: date ? new Date(date) : new Date(),
      progressPercent: Number(progressPercent) || 0,
      weather,
      materials,
      workforce,
      notes,
      createdBy: req.user._id,
    };
    
    project.dailyReports.push(report);
    
    // Update overall progress
    const newProgress = Math.min(100, (project.progress || 0) + Number(progressPercent));
    project.progress = newProgress;
    if (newProgress >= 100) {
      project.status = 'Completed';
    } else {
      project.status = 'In Progress';
    }
    
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error('Add daily report error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', auth, authorize('owner'), async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }
    
    res.json({ msg: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
