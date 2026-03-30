/*
  Role check middleware
  Used as authorize('admin', 'editor').
  Runs after protect middleware — req.user must already exist
*/
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'You must log in first'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `You do not have permission for this action. Required role: ${roles.join(' or ')}`
      });
    }

    next();
  };
};

module.exports = authorize;
