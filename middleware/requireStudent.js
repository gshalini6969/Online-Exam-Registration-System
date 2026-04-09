module.exports = function requireStudent(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'student') {
    return res.status(401).json({
      success: false,
      message: 'Student authentication required'
    });
  }
  next();
};