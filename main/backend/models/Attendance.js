const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Store as YYYY-MM-DD
  punchIn: { type: Date },
  punchOut: { type: Date },
  breaks: [{
    breakType: { type: String, enum: ['Lunch Break', 'Tea & Refreshment', 'Restroom Pause', 'Other'] },
    startTime: { type: Date },
    endTime: { type: Date },
    durationMinutes: { type: Number, default: 0 }
  }],
  totalIdleMinutes: { type: Number, default: 0 },
  netDutyMinutes: { type: Number, default: 0 },
  status: { type: String, enum: ['Present', 'Absent', 'Half Day', 'On Leave'], default: 'Present' },
  activeBreakStart: { type: Date },
  activeBreakType: { type: String }
}, { timestamps: true });

// Ensure unique attendance per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
