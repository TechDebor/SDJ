const Advertisement = require('../models/Advertisement');

exports.createAd = async (req, res) => {
  try {
    const ad = await Advertisement.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: ad });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAds = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'EMPLOYEE' || req.user.role === 'ADMIN') query.isActive = true;
    const ads = await Advertisement.find(query);
    res.status(200).json({ success: true, data: ads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAdById = async (req, res) => {
  try {
    const ad = await Advertisement.findById(req.params.id);
    if (!ad) return res.status(404).json({ success: false, message: 'Not found' });
    res.status(200).json({ success: true, data: ad });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAd = async (req, res) => {
  try {
    const ad = await Advertisement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: ad });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAd = async (req, res) => {
  try {
    await Advertisement.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
