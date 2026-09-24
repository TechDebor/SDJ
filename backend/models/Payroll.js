const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true },
  basic: { type: Number, required: true },
  hra: { type: Number, required: true },
  incentive: { type: Number, default: 0 },
  gross: { type: Number, required: true },
  epf: { type: Number, required: true },
  pt: { type: Number, required: true },
  tds: { type: Number, required: true },
  net: { type: Number, required: true },
  paidOn: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Prevent duplicate statements using the existing employee identifier and month
payrollSchema.index({ employee: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
