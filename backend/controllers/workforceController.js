const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.getWorkforce = async (req, res) => {
  try {
    const { search, role, department, designation, status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { designation: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (role) query.role = role;
    if (department) query.department = department;
    if (designation) query.designation = designation;
    if (status !== undefined) query.isActive = status === 'true';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const users = await User.find(query).select('-password -__v').skip(skip).limit(parseInt(limit));
    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWorkforceUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -__v');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createWorkforceUser = async (req, res) => {
  try {
    const { name, mobile, password, role, designation, department, salary, pan, uan, isActive, avatar } = req.body;

    if (!name || !mobile || !password || !role) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    if (role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot create SUPER_ADMIN via Workforce Directory' });
    }

    if (!['ADMIN', 'EMPLOYEE'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const existing = await User.findOne({ mobile });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Mobile already exists' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      mobile,
      password: hashedPassword,
      role,
      designation,
      department,
      salary,
      pan,
      uan,
      isActive: isActive !== undefined ? isActive : true,
      avatar: avatar || req.body.avatar
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ success: true, data: userResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateWorkforceUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    if (targetUser.role === 'SUPER_ADMIN') {
      if (targetUser._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Cannot modify another SUPER_ADMIN' });
      }
    }

    const updates = { ...req.body };
    
    // Don't overwrite avatar if not provided
    if (!req.body.avatar) {
      delete updates.avatar;
    }

    if (updates.password) {
      if (updates.password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
      }
      updates.password = await bcrypt.hash(updates.password, 10);
    } else {
      delete updates.password;
    }

    // Role escalation/change protection
    if (targetUser.role === 'SUPER_ADMIN') {
      delete updates.role; // Cannot change own role
      delete updates.isActive; // Cannot deactivate self
    } else if (updates.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot escalate to SUPER_ADMIN' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password -__v');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateWorkforceStatus = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    if (targetUser.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot deactivate SUPER_ADMIN' });
    }

    targetUser.isActive = req.body.isActive;
    await targetUser.save();
    
    res.status(200).json({ success: true, data: targetUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteWorkforceUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    if (targetUser.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot delete SUPER_ADMIN' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
