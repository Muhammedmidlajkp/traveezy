

const jwt = require('jsonwebtoken');
const User = require('../models/user');



exports.protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    // 🚫 No token → not logged in
    if (!token) {
      return res.redirect('/auth/login');
    }

    // 🔐 Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🧩 If admin
    if (decoded.role === 'admin') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      req.admin = { role: 'admin' };
      res.locals.admin = req.admin; // 👈 allow admin data in templates
      return next();
    }

    // 👤 Otherwise, find user in DB
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.clearCookie('token');
      return res.redirect('/auth/login');
    }

    req.user = user;
    res.locals.user = user; // 👈 ADD THIS LINE — makes user accessible in EJS templates globally

    // 🛑 Prevent back button after logout
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    next();

  } catch (error) {
    console.error('Auth Middleware Error:', error.message);

    res.clearCookie('token');

    if (req.originalUrl.startsWith('/admin')) {
      return res.redirect('/admin/login');
    } else {
      return res.redirect('/auth/login');
    }
  }
};

// ✅ Verify Admin middleware
exports.verifyAdmin = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.redirect('/admin/login');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== 'admin') {
      return res.status(403).redirect('/auth/login');
    }

    req.admin = { role: 'admin' };
    next();
  } catch (error) {
    console.error('Admin Auth Middleware Error:', error.message);
    res.clearCookie('token');
    return res.redirect('/admin/login');
  }
};
