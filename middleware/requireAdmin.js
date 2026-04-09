module.exports = function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(401).json({
      success: false,
      message: 'Admin authentication required'
    });
  }
  next();
};