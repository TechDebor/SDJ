const Department = require('../models/Department');

exports.createDepartment = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Department name is required' });
    
    const existing = await Department.findOne({ name: new RegExp(`^${name}$`, 'i') });
    if (existing) return res.status(409).json({ success: false, message: 'Department already exists' });

    const dept = await Department.create({ name, isActive: isActive !== undefined ? isActive : true });
    res.status(201).json({ success: true, data: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const query = req.query.activeOnly === 'true' ? { isActive: true } : {};
    const depts = await Department.find(query).sort('name');
    res.status(200).json({ success: true, data: depts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });

    if (name && name.toLowerCase() !== dept.name.toLowerCase()) {
      const existing = await Department.findOne({ name: new RegExp(`^${name}$`, 'i') });
      if (existing) return res.status(409).json({ success: false, message: 'Another department with this name exists' });
    }

    if (name !== undefined) dept.name = name;
    if (isActive !== undefined) dept.isActive = isActive;
    
    await dept.save();
    res.status(200).json({ success: true, data: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateDepartmentStatus = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });

    dept.isActive = req.body.isActive;
    await dept.save();
    
    res.status(200).json({ success: true, data: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndDelete(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.status(200).json({ success: true, message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
