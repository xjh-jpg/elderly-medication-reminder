const jwt = require('jsonwebtoken');
require('dotenv').config();

// JWT验证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ code: 401, message: '未授权访问' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ code: 403, message: '令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
};

// 检查用户角色
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 401, message: '未授权访问' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: '权限不足' });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  checkRole
};