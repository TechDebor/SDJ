const Task = require('../models/Task');
const User = require('../models/User');

exports.createTask = async (req, res) => {
  try {
    const { title, issueType, priority, status, storyPoints, dueDate, assignedTo } = req.body;
    
    // Employee can only assign to themselves
    if (req.user.role === 'EMPLOYEE' && assignedTo !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Employees can only assign tasks to themselves' });
    }

    // Admin can only assign to themselves or Employees
    if (req.user.role === 'ADMIN') {
      const targetUser = await User.findById(assignedTo);
      if (!targetUser) {
        return res.status(404).json({ success: false, message: 'Assigned user not found' });
      }
      if (targetUser.role === 'SUPER_ADMIN' || (targetUser.role === 'ADMIN' && targetUser._id.toString() !== req.user._id.toString())) {
        return res.status(403).json({ success: false, message: 'Admins can only assign tasks to themselves or Employees' });
      }
    }

    const task = await Task.create({
      title, issueType, priority, status, storyPoints, dueDate, assignedTo,
      assignedBy: req.user._id
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'EMPLOYEE') {
      query.assignedTo = req.user._id;
    }
    // Admin/SuperAdmin sees all

    const tasks = await Task.find(query).populate('assignedTo assignedBy', 'name role avatar');
    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('assignedTo assignedBy', 'name role avatar');
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    if (req.user.role === 'EMPLOYEE' && task.assignedTo._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (req.user.role === 'EMPLOYEE' && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: updatedTask });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (req.user.role === 'EMPLOYEE') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await task.deleteOne();
    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
