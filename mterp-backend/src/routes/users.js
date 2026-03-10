const express = require('express');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes in this file require auth and owner role
router.use(auth);
router.use(authorize('owner'));

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password -otp')
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/users - Create new user as owner
router.post('/', async (req, res) => {
  try {
    const { username, email, password, fullName, role, phone, address } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create user (Auto-verify since owner creates it)
    const user = new User({
      username,
      email,
      password,
      fullName,
      role: role || 'worker',
      phone,
      address,
      isVerified: true
    });

    await user.save();
    res.status(201).json(user.toJSON());
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/users/:id/role - Update user role
router.put('/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    
    // Validate role exists in our enum
    const validRoles = [
      'worker', 'tukang', 'helper',
      'supervisor', 'site_manager', 'foreman',
      'device_admin', 'asset_admin', 'admin_project',
      'director', 'president_director', 'operational_director',
      'owner'
    ];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ msg: 'Invalid role provided' });
    }

    // Prevent owner from removing their own owner role through this endpoint 
    // to avoid locking themselves out, unless there are other owners.
    if (req.params.id === req.user._id.toString() && role !== 'owner') {
      const ownerCount = await User.countDocuments({ role: 'owner' });
      if (ownerCount <= 1) {
        return res.status(400).json({ msg: 'Cannot remove last owner role' });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role } },
      { new: true }
    ).select('-password -otp');

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// PUT /api/users/:id/verify - Manually verify a user
router.put('/:id/verify', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (user.isVerified) {
      return res.status(400).json({ msg: 'User is already verified' });
    }

    user.isVerified = true;
    user.otp = undefined; // Clear any pending OTP
    await user.save();

    res.json(user.toJSON());
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// DELETE /api/users/:id - Delete a user
router.delete('/:id', async (req, res) => {
  try {
    // Prevent owner from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ msg: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json({ msg: 'User removed successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
