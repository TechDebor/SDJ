const crypto = require('crypto');
const axios = require('axios');

// In-memory store for OTPs (in production, use Redis or DB with TTL)
const otpStore = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

const sendOTP = async (mobile) => {
  const otp = generateOTP();
  const hashedOTP = hashOTP(otp);
  
  // Store with expiry (5 mins)
  otpStore.set(mobile, {
    hash: hashedOTP,
    expiresAt: Date.now() + 5 * 60 * 1000
  });

  // Call MSG91
  if (process.env.MSG91_AUTH_KEY) {
    try {
      await axios.post('https://control.msg91.com/api/v5/otp', null, {
        params: {
          authkey: process.env.MSG91_AUTH_KEY,
          template_id: process.env.MSG91_TEMPLATE_ID,
          mobile: `91${mobile}`,
          otp: otp
        }
      });
    } catch (err) {
      console.error('MSG91 Error:', err.message);
    }
  } else {
    console.log(`[DEV MODE] OTP for ${mobile} is ${otp}`);
  }

  return true;
};

const verifyOTP = (mobile, otp) => {
  const record = otpStore.get(mobile);
  if (!record) return false;
  
  if (Date.now() > record.expiresAt) {
    otpStore.delete(mobile);
    return false;
  }
  
  const isValid = record.hash === hashOTP(otp);
  if (isValid) {
    otpStore.delete(mobile); // Single use
  }
  
  return isValid;
};

module.exports = { sendOTP, verifyOTP };
