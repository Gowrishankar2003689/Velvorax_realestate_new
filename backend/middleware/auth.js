const jwt = require('jsonwebtoken');

module.exports = async function(req, res, next) {

  // Get token from header
  const token =
    req.header('x-auth-token') ||
    req.header('Authorization')?.replace('Bearer ', '');

  // Check token
  if (!token) {
    return res.status(401).json({
      msg: 'No token, authorization denied'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const userType = decoded.user.type || 'User';
    const platform = decoded.user.platform || 'web';

    const Model = userType === 'StandardUser'
      ? require('../models/StandardUser')
      : require('../models/User');

    const selectFields = platform === 'app' ? 'isLoggedInApp activeTokenApp' : 'isLoggedInWeb activeTokenWeb';

    const storedUser = await Model.findById(decoded.user.id).select(selectFields);
    if (!storedUser) {
      console.warn(`AUTH: User ${decoded.user.id} not found in model ${userType}`);
      return res.status(401).json({ msg: 'User no longer exists. Please login again.' });
    }

    const isLoggedIn = platform === 'app' ? storedUser.isLoggedInApp : storedUser.isLoggedInWeb;
    const activeToken = platform === 'app' ? storedUser.activeTokenApp : storedUser.activeTokenWeb;

    if (!isLoggedIn) {
      console.warn(`AUTH: User ${decoded.user.id} is marked as logged out on ${platform}`);
      return res.status(401).json({ msg: `Session expired on ${platform}. Please login again.` });
    }

    if (activeToken !== token) {
      console.warn(`AUTH: Token mismatch for user ${decoded.user.id} on ${platform}`);
      return res.status(401).json({ msg: `You have logged in on another ${platform} device. This session is now invalid.` });
    }

    req.user = decoded.user;

    next();

  } catch (err) {
    console.error('AUTH ERROR:', err && err.message ? err.message : err);
    res.status(401).json({
      msg: 'Token is not valid'
    });
  }
};