const Leave = require('../models/Leave');
const User = require('../models/User');

exports.createLeave = async (req, res) => {
  try {
    const { type, fromDate, toDate, reason } = req.body;
    
    if (!fromDate || !toDate || !reason || !type) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (end < start) {
      return res.status(400).json({ success: false, message: 'To Date cannot be before From Date' });
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check for overlaps
    const overlap = await Leave.findOne({
      user: req.user._id,
      status: { $in: ['Pending', 'Approved'] },
      $or: [
        { fromDate: { $lte: end }, toDate: { $gte: start } }
      ]
    });

    if (overlap) {
      return res.status(400).json({ success: false, message: 'Overlapping leave request already exists' });
    }

    const leave = await Leave.create({ 
      user: req.user._id,
      type,
      fromDate: start,
      toDate: end,
      days,
      reason,
      status: 'Pending'
    });
    
    res.status(201).json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLeaves = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'EMPLOYEE') {
      query.user = req.user._id;
    } else if (req.user.role === 'ADMIN') {
      const employees = await User.find({ role: 'EMPLOYEE' }).select('_id');
      const employeeIds = employees.map(e => e._id);
      query.user = { $in: [req.user._id, ...employeeIds] };
    } else if (req.user.role === 'SUPER_ADMIN') {
      const admins = await User.find({ role: { $in: ['ADMIN', 'SUPER_ADMIN'] } }).select('_id');
      const adminIds = admins.map(a => a._id);
      query.user = { $in: adminIds };
    }
    
    const leaves = await Leave.find(query).populate('user reviewedBy', 'name role avatar').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).populate('user reviewedBy', 'name role');
    if (!leave) return res.status(404).json({ success: false, message: 'Not found' });
    
    if (req.user.role === 'EMPLOYEE' && leave.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    res.status(200).json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).populate('user');
    if (!leave) return res.status(404).json({ success: false, message: 'Not found' });
    
    const isStatusUpdate = req.body.status && ['Approved', 'Rejected'].includes(req.body.status);
    
    if (isStatusUpdate) {
      if (leave.status !== 'Pending') {
        return res.status(400).json({ success: false, message: 'Can only approve/reject PENDING requests' });
      }

      if (req.user.role === 'EMPLOYEE') {
        return res.status(403).json({ success: false, message: 'Employees cannot approve/reject leaves' });
      }

      if (req.user.role === 'ADMIN' && leave.user.role !== 'EMPLOYEE') {
         return res.status(403).json({ success: false, message: 'Admins can only approve Employee leaves' });
      }

      if (req.user.role === 'SUPER_ADMIN' && leave.user.role === 'EMPLOYEE') {
         return res.status(403).json({ success: false, message: 'Super Admin does not handle Employee leaves directly' });
      }

      leave.status = req.body.status;
      leave.reviewedBy = req.user._id;
    } else {
      if (leave.user._id.toString() !== req.user._id.toString() || leave.status !== 'Pending') {
        return res.status(403).json({ success: false, message: 'Cannot edit this leave' });
      }
      const allowedUpdates = ['type', 'fromDate', 'toDate', 'reason', 'status'];
      allowedUpdates.forEach(u => {
        if (req.body[u] !== undefined) leave[u] = req.body[u];
      });
      if (req.body.status && req.body.status !== 'Pending' && req.body.status !== 'Cancelled') {
        leave.status = 'Pending';
      }
      if (req.body.fromDate || req.body.toDate) {
         const start = new Date(leave.fromDate);
         const end = new Date(leave.toDate);
         leave.days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      }
    }
    
    await leave.save();
    res.status(200).json({ success: true, data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
