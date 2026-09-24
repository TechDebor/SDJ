const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
  badge: { type: String, required: true },
  title: { type: String, required: true },
  subtitle: { type: String, required: true },
  cta: { type: String },
  image: { type: String },
  icon: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Advertisement', advertisementSchema);
