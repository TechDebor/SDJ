const Payroll = require('../models/Payroll');
const User = require('../models/User');

exports.createPayroll = async (req, res) => {
  try {
    const { employee, month } = req.body;
    const basic = Number(req.body.basic || 0);
    const hra = Number(req.body.hra || 0);
    const incentive = Number(req.body.incentive || 0);
    const pt = Number(req.body.pt || 0);

    if (basic < 0 || hra < 0 || incentive < 0 || pt < 0) {
      return res.status(400).json({ success: false, message: 'Payroll values cannot be negative' });
    }
    
    const gross = basic + hra + incentive;
    const epf = basic * 0.12;
    const tds = (gross * 0.10); // simplified calc
    const net = gross - epf - pt - tds;

    const payroll = await Payroll.create({
      employee, month, basic, hra, incentive, gross, epf, pt, tds, net, createdBy: req.user._id, paidOn: new Date()
    });

    res.status(201).json({ success: true, data: payroll });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPayroll = async (req, res) => {
  try {
    const currentMonth = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date());

    let userQuery = {};
    if (req.user.role === 'ADMIN') {
      userQuery = { $or: [{ role: 'EMPLOYEE' }, { _id: req.user._id }] };
    } else if (req.user.role === 'EMPLOYEE') {
      userQuery = { _id: req.user._id };
    }

    const usersInScope = await User.find(userQuery);
    
    // Auto-generate missing payrolls for the current month
    for (const u of usersInScope) {
      if (!u.salary) continue; 
      
      const exists = await Payroll.findOne({ employee: u._id, month: currentMonth });
      if (!exists) {
        const gross = u.salary;
        const basic = gross;
        const epf = basic * 0.12;
        const tds = gross * 0.10;
        const pt = 0;
        const net = gross - epf - pt - tds;

        await Payroll.create({
          employee: u._id,
          month: currentMonth,
          basic,
          hra: 0,
          incentive: 0,
          gross,
          epf,
          pt,
          tds,
          net,
          paidOn: new Date(),
          createdBy: req.user._id
        });
      }
    }

    let payrollQuery = {};
    if (req.user.role === 'ADMIN') {
      const allowedIds = usersInScope.map(u => u._id);
      payrollQuery.employee = { $in: allowedIds };
    } else if (req.user.role === 'EMPLOYEE') {
      payrollQuery.employee = req.user._id;
    }

    const list = await Payroll.find(payrollQuery).populate('employee', 'name role avatar designation pan');
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPayrollById = async (req, res) => {
  try {
    const p = await Payroll.findById(req.params.id).populate('employee', 'name role avatar designation pan');
    if (!p) return res.status(404).json({ success: false, message: 'Not found' });
    if (req.user.role === 'EMPLOYEE' && p.employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    res.status(200).json({ success: true, data: p });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePayroll = async (req, res) => {
  try {
    let payload = { ...req.body };
    
    // Explicitly recalculate net on the backend to prevent frontend tampering
    if (payload.gross !== undefined || payload.epf !== undefined || payload.pt !== undefined || payload.tds !== undefined) {
      const p = await Payroll.findById(req.params.id);
      if (!p) return res.status(404).json({ success: false, message: 'Not found' });
      
      const gross = payload.gross !== undefined ? Number(payload.gross) : p.gross;
      const epf = payload.epf !== undefined ? Number(payload.epf) : p.epf;
      const pt = payload.pt !== undefined ? Number(payload.pt) : p.pt;
      const tds = payload.tds !== undefined ? Number(payload.tds) : p.tds;
      
      if (gross < 0 || epf < 0 || pt < 0 || tds < 0) {
        return res.status(400).json({ success: false, message: 'Payroll values cannot be negative' });
      }

      const net = gross - (epf + pt + tds);
      if (net < 0) {
        return res.status(400).json({ success: false, message: 'Deductions cannot exceed Gross Pay' });
      }
      payload.net = net;
    }

    const updated = await Payroll.findByIdAndUpdate(req.params.id, payload, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePayroll = async (req, res) => {
  try {
    await Payroll.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
