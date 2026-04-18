const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const validation = require('../middleware/validation');
const { authenticateToken, checkRole } = require('../middleware/auth');

// 管理员登录（不需要认证）
router.post('/login', validation.adminLoginValidation, adminController.adminLogin);

// 以下路由需要管理员认证
router.use(authenticateToken);
router.use(checkRole(['admin']));

// 用户管理
router.get('/users', adminController.getUserList);
router.post('/users/toggle-status', adminController.toggleUserStatus);

// 数据统计
router.get('/stats', adminController.getElderStats);

// 数据导出
router.get('/export', adminController.exportElderData);

// 操作日志
router.get('/logs', adminController.getOperationLogs);

// 系统配置
router.get('/config', adminController.getSystemConfig);

// 修改密码
router.post('/change-password', adminController.changeAdminPassword);

module.exports = router;