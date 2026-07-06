const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const { OAuth2Client } = require('google-auth-library');
const auth = require('../middleware/auth');
const { User, Company } = require('../models');
const StandardUser = require('../models/StandardUser');
const { generateRegistrationPDF } = require('../utils/pdfGenerator');
const {
    sendRegistrationNotification,
    sendRegistrationConfirmation,
    sendPasswordResetEmail
} = require('../utils/emailService');
const { sendRegistrationWhatsApp } = require('../utils/whatsappService');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @route   POST api/auth/google-login
router.post('/google-login', async (req, res) => {
  const { idToken, platform = 'web' } = req.body;
  if (!idToken) return res.status(400).json({ msg: 'No token provided' });

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const { name, email } = ticket.getPayload();

    let user = await User.findOne({ email });
    let type = 'User';

    if (!user) {
      user = await StandardUser.findOne({ email });
      type = 'StandardUser';
    }

    if (!user) {
      return res.status(404).json({ msg: 'This Google account is not registered. Please register first.' });
    }

    if (user.role !== 'super_admin') {
      if (type === 'User') {
        const company = await Company.findById(user.companyId);
        if (!company || company.approvalStatus !== 'Approved') {
          return res.status(403).json({ msg: 'Account not approved yet.' });
        }
      } else {
        if (user.status !== 'approved' && user.status !== 'active') {
          return res.status(403).json({ msg: 'Staff account not approved.' });
        }
      }
    }

    const payload = { user: { id: user.id, role: user.role, companyId: user.companyId, type, platform } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 });

    if (platform === 'app') {
        user.isLoggedInApp = true;
        user.activeTokenApp = token;
    } else {
        user.isLoggedInWeb = true;
        user.activeTokenWeb = token;
    }

    user.isLoggedIn = true;
    user.activeToken = token;
    await user.save();

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId, type } });

  } catch (err) {
    console.error('Google Login Error:', err);
    res.status(500).json({ msg: 'Google Authentication failed' });
  }
});

// @route   POST api/auth/register
router.post('/register', async (req, res) => {
  const {
    companyName, website, country, industry, employeesCount,
    servicesNeeded, budgetRange, projectTimeline, referralSource,
    name, email, password, phone, roleInCompany, preferredLanguage, timezone,
    logo, platform = 'web'
  } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const company = new Company({
      name: companyName, website, country, industry, employeesCount,
      servicesNeeded, budgetRange, projectTimeline, referralSource, logo
    });
    await company.save();

    user = new User({
      companyId: company._id, name, email, password, phone,
      roleInCompany, preferredLanguage, timezone, role: 'client'
    });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { user: { id: user.id, role: user.role, companyId: user.companyId, type: 'User', platform } };

    (async () => {
      let pdfPath = null;
      try {
        pdfPath = await generateRegistrationPDF(req.body);
        await sendRegistrationNotification(req.body, pdfPath);
        await sendRegistrationConfirmation(email, name);
        await sendRegistrationWhatsApp({ name, phone, email });
      } catch (error) {
        console.error('Background Notification Error:', error.message);
      } finally {
        if (pdfPath && fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
      }
    })();

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 });
    user.isLoggedIn = true;
    user.activeToken = token;
    if (platform === 'app') { user.isLoggedInApp = true; user.activeTokenApp = token; }
    else { user.isLoggedInWeb = true; user.activeTokenWeb = token; }
    await user.save();

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId, type: 'User' } });
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/login
router.post('/login', async (req, res) => {
  const { email, password, platform = 'web' } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isApp = platform === 'app';
    const currentToken = isApp ? user.activeTokenApp : user.activeTokenWeb;
    const isLoggedInField = isApp ? 'isLoggedInApp' : 'isLoggedInWeb';
    const tokenField = isApp ? 'activeTokenApp' : 'activeTokenWeb';

    if (user[isLoggedInField] && currentToken) {
        try {
            jwt.verify(currentToken, process.env.JWT_SECRET);
            const lastActive = user.updatedAt || user.createdAt;
            const diff = Date.now() - new Date(lastActive).getTime();
            if (diff < 15 * 60 * 1000) return res.status(403).json({ msg: `User already logged in on another ${platform} device` });
            user[isLoggedInField] = false;
            user[tokenField] = null;
        } catch (verifyErr) {
            user[isLoggedInField] = false;
            user[tokenField] = null;
        }
    }

    if (user.role !== 'super_admin') {
      const company = await Company.findById(user.companyId);
      if (!company) return res.status(400).json({ msg: 'Company data missing.' });
      if (company.approvalStatus !== 'Approved') return res.status(403).json({ msg: `Your account is ${company.approvalStatus}. Please wait for approval.`, status: company.approvalStatus });
    }

    const payload = { user: { id: user.id, role: user.role, companyId: user.companyId, type: 'User', platform } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 });

    if (platform === 'app') { user.isLoggedInApp = true; user.activeTokenApp = token; }
    else { user.isLoggedInWeb = true; user.activeTokenWeb = token; }
    user.isLoggedIn = true;
    user.activeToken = token;
    await user.save();

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId, type: 'User' } });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) user = await StandardUser.findOne({ email });

    if (!user) return res.json({ msg: 'If this email is registered, a recovery link will be dispatched shortly.' });

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password.html?token=${token}`;

    try {
        await sendPasswordResetEmail(user.email, user.name, resetUrl);
    } catch (mailErr) {
        console.error('SMTP Error:', mailErr.message);
        return res.status(500).json({ msg: 'Email service error. Please contact admin.', error: mailErr.message });
    }

    res.json({ msg: 'If this email is registered, a recovery link will be dispatched shortly.' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ msg: 'Internal server error', error: err.message });
  }
});

// @route   POST api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  const { password } = req.body;
  try {
    let user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) user = await StandardUser.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });

    if (!user) return res.status(400).json({ msg: 'Invalid or expired password reset token' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ msg: 'Password reset successful. You can now login.' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

router.post('/logout', auth, async (req, res) => {
  const { platform = 'web' } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (user) {
      if (platform === 'app') { user.isLoggedInApp = false; user.activeTokenApp = null; }
      else { user.isLoggedInWeb = false; user.activeTokenWeb = null; }
      if (!user.isLoggedInApp && !user.isLoggedInWeb) { user.isLoggedIn = false; user.activeToken = null; }
      await user.save();
    }
    res.json({ msg: `Logged out successfully` });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

router.post('/clear-sessions', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });
    user.isLoggedIn = false; user.activeToken = null;
    user.isLoggedInWeb = false; user.activeTokenWeb = null;
    user.isLoggedInApp = false; user.activeTokenApp = null;
    await user.save();
    res.json({ msg: 'All sessions cleared successfully.' });
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: 'Server Error' });
  }
});

module.exports = router;
