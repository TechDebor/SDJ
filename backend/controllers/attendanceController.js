const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const User = require('../models/User');

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

exports.clockIn = async (req, res) => {
  try {
    const dateStr = getTodayString();
    const todayDate = new Date();

    // Check Leave conflict
    const leaves = await Leave.find({
      user: req.user._id,
      status: 'Approved',
      fromDate: { $lte: todayDate },
      toDate: { $gte: new Date(new Date().setHours(0,0,0,0)) }
    });
    if (leaves.length > 0) {
      // Check if it really covers today by checking exact string dates if preferred, 
      // but standard query above usually catches it.
      return res.status(400).json({ success: false, message: 'Cannot punch in. You are on an approved leave today.' });
    }

    let att = await Attendance.findOne({ user: req.user._id, date: dateStr });
    if (att && att.punchIn) {
      return res.status(400).json({ success: false, message: 'Already punched in today.' });
    }

    if (!att) {
      att = new Attendance({ 
        user: req.user._id, 
        date: dateStr, 
        punchIn: new Date(),
        status: 'Present'
      });
    } else {
      att.punchIn = new Date();
      att.status = 'Present';
    }
    
    await att.save();
    res.status(200).json({ success: true, data: att });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clockOut = async (req, res) => {
  try {
    const dateStr = getTodayString();

    const att = await Attendance.findOne({ user: req.user._id, date: dateStr });
    if (!att || !att.punchIn) {
      return res.status(400).json({ success: false, message: 'Not punched in yet.' });
    }
    if (att.punchOut) {
      return res.status(400).json({ success: false, message: 'Already punched out.' });
    }

    if (att.activeBreakStart) {
      return res.status(400).json({ success: false, message: 'Must end break before punching out.' });
    }

    att.punchOut = new Date();
    
    // Calculate final metrics
    const grossMinutes = Math.floor((att.punchOut - att.punchIn) / 60000);
    const totalIdle = att.breaks.reduce((acc, b) => acc + (b.durationMinutes || 0), 0);
    
    att.totalIdleMinutes = totalIdle;
    att.netDutyMinutes = Math.max(0, grossMinutes - totalIdle);

    await att.save();
    res.status(200).json({ success: true, data: att });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.startBreak = async (req, res) => {
  try {
    const { breakType } = req.body;
    if (!breakType) return res.status(400).json({ success: false, message: 'Break type is required' });

    const dateStr = getTodayString();
    const att = await Attendance.findOne({ user: req.user._id, date: dateStr });
    
    if (!att || !att.punchIn) return res.status(400).json({ success: false, message: 'Not punched in.' });
    if (att.punchOut) return res.status(400).json({ success: false, message: 'Already punched out.' });
    if (att.activeBreakStart) return res.status(400).json({ success: false, message: 'Already on an active break.' });

    att.activeBreakStart = new Date();
    att.activeBreakType = breakType;
    await att.save();
    
    res.status(200).json({ success: true, data: att });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.endBreak = async (req, res) => {
  try {
    const dateStr = getTodayString();
    const att = await Attendance.findOne({ user: req.user._id, date: dateStr });
    
    if (!att || !att.activeBreakStart) return res.status(400).json({ success: false, message: 'Not on an active break.' });

    const endTime = new Date();
    const duration = Math.floor((endTime - att.activeBreakStart) / 60000);
    
    att.breaks.push({
      breakType: att.activeBreakType,
      startTime: att.activeBreakStart,
      endTime: endTime,
      durationMinutes: duration
    });
    
    att.totalIdleMinutes += duration;
    
    // reset active break
    att.activeBreakStart = undefined;
    att.activeBreakType = undefined;

    await att.save();
    res.status(200).json({ success: true, data: att });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    // Determine scope based on role
    let userQuery = {};
    if (req.user.role === 'ADMIN') {
      userQuery = { $or: [{ role: 'EMPLOYEE' }, { _id: req.user._id }] };
    } else if (req.user.role === 'EMPLOYEE') {
      userQuery = { _id: req.user._id };
    }
    
    const allowedUsers = await User.find(userQuery).select('_id');
    const allowedIds = allowedUsers.map(u => u._id);

    const data = await Attendance.find({ user: { $in: allowedIds } })
      .populate('user', 'name role avatar')
      .sort({ date: -1, punchIn: -1 });

    // Mark On Leave for people who have approved leave today and no attendance record
    const dateStr = getTodayString();
    const todayDate = new Date();
    
    const leaves = await Leave.find({
      user: { $in: allowedIds },
      status: 'Approved',
      fromDate: { $lte: todayDate },
      toDate: { $gte: new Date(new Date().setHours(0,0,0,0)) }
    }).populate('user', 'name role avatar');

    // Create virtual attendance records for those on leave so it shows in the table
    const existingAttUserIds = data.filter(d => d.date === dateStr).map(d => d.user._id.toString());
    const onLeaveAdditions = [];

    leaves.forEach(lv => {
      if (!existingAttUserIds.includes(lv.user._id.toString())) {
        onLeaveAdditions.push({
          _id: 'virtual_' + lv._id,
          user: lv.user,
          date: dateStr,
          status: 'On Leave',
          idleMinutes: 0,
          netDutyMinutes: 0,
          breaks: [],
          isVirtual: true
        });
      }
    });

    const finalData = [...onLeaveAdditions, ...data];

    res.status(200).json({ success: true, data: finalData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
