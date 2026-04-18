const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const validation = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// 所有路由需要认证
router.use(authenticateToken);

// 获取用药提醒列表
router.get('/', medicationController.getMedications);

// 获取今日用药提醒
router.get('/today', medicationController.getTodayMedications);

// 获取用药统计（必须在 /:id 之前）
router.get('/stats', medicationController.getMedicationStats);

// 创建用药提醒
router.post('/', validation.medicationValidation, medicationController.createMedication);

// 更新用药提醒
router.put('/:id', validation.medicationValidation, medicationController.updateMedication);

// 标记用药状态
router.patch('/:id/status', medicationController.markMedicationStatus);

// 删除用药提醒
router.delete('/:id', medicationController.deleteMedication);

module.exports = router;