const express = require('express');
const router = express.Router();
const elderController = require('../controllers/elderController');
const validation = require('../middleware/validation');
const { authenticateToken, checkRole } = require('../middleware/auth');

// 所有路由需要认证
router.use(authenticateToken);

// 获取老人档案（老人查看自己的，子女查看关联的）
router.get('/profile/:elder_id?', elderController.getProfile);

// 更新老人档案
router.put('/profile', validation.elderProfileValidation, elderController.updateProfile);

// 获取紧急联系人
router.get('/emergency-contacts', elderController.getEmergencyContacts);

// 获取老人统计信息
router.get('/stats', elderController.getElderStats);

// 获取老人列表（子女和管理员用）
router.get('/list', 
  checkRole(['child', 'admin']), 
  elderController.getElderList
);

module.exports = router;