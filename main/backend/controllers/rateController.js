const Rate = require('../models/Rate');

exports.getRates = async (req, res) => {
  try {
    let rate = await Rate.findOne();
    if (!rate) {
      rate = await Rate.create({
        date: '23 September 2026',
        gold999: '15,678',
        gold995: '15,600',
        silver999: '242',
        gold22k: '14,280',
        gold18k: '12,170',
        gold14k: '9,670'
      });
    }
    res.status(200).json({ success: true, data: rate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateRates = async (req, res) => {
  try {
    let rate = await Rate.findOne();
    if (rate) {
      Object.assign(rate, req.body);
      await rate.save();
    } else {
      rate = await Rate.create(req.body);
    }
    res.status(200).json({ success: true, data: rate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};