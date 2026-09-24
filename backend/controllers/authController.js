const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { sendOTP, verifyOTP } = require('../utils/otp');

const bcrypt = require('bcryptjs');

exports.createSuperAdmin = async (req, res) => {
  try {
    const { name, mobile, password, designation, department, salary, pan, uan, isActive, avatar } = req.body;
    
    if (!name || !mobile || !password) {
      return res.status(400).json({ success: false, message: 'Name, mobile, and password required' });
    }

    const role = 'SUPER_ADMIN'; // Trust backend, force role

    // Keep this route strictly as an initial seed mechanism. Lock it if a SUPER_ADMIN exists.
    const existing = await User.findOne({ role: 'SUPER_ADMIN' });
    if (existing) {
      return res.status(409).json({ success: false, message: 'SuperAdmin already exists' });
    }

    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'Mobile already registered' });
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
      avatar
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({ success: true, message: 'User created successfully', data: userResponse });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { mobile, password } = req.body;
    
    if (!mobile || !password) {
      return res.status(400).json({ success: false, message: 'Mobile and password required' });
    }

    const user = await User.findOne({ mobile }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, mobile: user.mobile },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ success: false, message: 'Mobile required' });

    const user = await User.findOne({ mobile, isActive: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found or inactive' });

    await sendOTP(mobile);
    res.status(200).json({ success: true, message: 'OTP sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) return res.status(400).json({ success: false, message: 'Mobile and OTP required' });

    const isValid = verifyOTP(mobile, otp);
    if (!isValid) return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });

    const user = await User.findOne({ mobile, isActive: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d'
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        role: user.role,
        mobile: user.mobile
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
