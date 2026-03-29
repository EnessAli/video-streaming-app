/*
  Rol kontrol middleware'i
  authorize('admin', 'editor') seklinde kullanilir.
  protect middleware'inden sonra calisir — req.user zaten mevcut olmali
*/
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Oncelikle giris yapmalisiniz'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Bu islem icin yetkiniz yok. Gerekli rol: ${roles.join(' veya ')}`
      });
    }

    next();
  };
};

module.exports = authorize;
