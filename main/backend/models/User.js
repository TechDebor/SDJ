const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, select: false },
  role: { type: String, enum: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE'], required: true },
  designation: { type: String },
  department: { 
    type: String, 
    enum: [
      'Engineering & Operations',
      'DevOps & Systems',
      'Product & Design',
      'Quality Assurance',
      'Executive Board'
    ]
  },
  salary: { type: Number },
  pan: { type: String },
  uan: { type: String },
  avatar: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
