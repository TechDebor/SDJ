const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.createEmployee = async (req, res) => {
  try {
    const { name, mobile, password, role, designation, department, salary, pan, uan, avatar } = req.body;
    
    if (role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Cannot create SuperAdmin via this route' });
    }
    
    if (req.user.role === 'ADMIN' && role !== 'EMPLOYEE') {
      return res.status(403).json({ success: false, message: 'Admin can only create employees' });
    }

    const existing = await User.findOne({ mobile });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Mobile already exists' });
    }

    let hashedPassword = undefined;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
      }
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const user = await User.create({ 
      name, mobile, password: hashedPassword, role, designation, department, salary, pan, uan, avatar 
    });
    
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ success: true, data: userResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'ADMIN') {
      query.role = 'EMPLOYEE';
    } else if (req.user.role === 'EMPLOYEE') {
      query._id = req.user._id;
    }

    const users = await User.find(query).select('-__v');
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-__v');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    
    if (req.user.role === 'EMPLOYEE' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    if (req.user.role === 'ADMIN' && user.role !== 'EMPLOYEE' && req.user._id.toString() !== user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    if (req.user.role === 'EMPLOYEE' && req.user._id.toString() !== targetUser._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    if (req.user.role === 'ADMIN' && targetUser.role === 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // prevent role escalation
    if (req.body.role && req.user.role !== 'SUPER_ADMIN') {
      delete req.body.role;
    }

    // prevent self-demotion or self-deactivation for super admin
    if (targetUser._id.toString() === req.user._id.toString() && targetUser.role === 'SUPER_ADMIN') {
      if (req.body.role && req.body.role !== 'SUPER_ADMIN') {
        delete req.body.role;
      }
      if (req.body.isActive === false) {
        delete req.body.isActive;
      }
    }
    
    // Validate password complexity and hash it
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
      }
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).select('-__v');
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deactivateUser = async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

    if (req.user.role === 'ADMIN' && targetUser.role !== 'EMPLOYEE') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot deactivate own account' });
    }

    targetUser.isActive = false;
    await targetUser.save();
    res.status(200).json({ success: true, message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
