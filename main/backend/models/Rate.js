const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema({
  date: String,
  gold999: String,
  gold995: String,
  silver999: String,
  gold22k: String,
  gold18k: String,
  gold14k: String
}, { timestamps: true });

module.exports = mongoose.model('Rate', rateSchema);