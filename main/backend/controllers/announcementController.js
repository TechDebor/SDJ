const Announcement = require('../models/Announcement');

exports.createAnnouncement = async (req, res) => {
  try {
    const a = await Announcement.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: a });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAnnouncements = async (req, res) => {
  try {
    const a = await Announcement.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: a });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAnnouncementById = async (req, res) => {
  try {
    const a = await Announcement.findById(req.params.id);
    if (!a) return res.status(404).json({ success: false, message: 'Not found' });
    if (req.user.role === 'EMPLOYEE' && !a.isPublished) return res.status(403).json({ success: false, message: 'Not published' });
    res.status(200).json({ success: true, data: a });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const a = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: a });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
