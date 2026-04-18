const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validation = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// 用户登录
router.post('/login', validation.loginValidation, authController.login);

// 用户注册
router.post('/register', validation.registerValidation, authController.register);

// 获取当前用户信息
router.get('/me', authenticateToken, authController.getCurrentUser);

// 修改密码
router.post('/change-password', authenticateToken, authController.changePassword);

// 发送验证码
router.post('/send-code', authController.sendVerificationCode);

module.exports = router;