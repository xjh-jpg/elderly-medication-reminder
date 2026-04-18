const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');
const validation = require('../middleware/validation');
const { authenticateToken } = require('../middleware/auth');

// 所有路由需要认证
router.use(authenticateToken);

// 获取健康记录
router.get('/', healthController.getHealthRecords);

// 获取最新健康记录
router.get('/latest', healthController.getLatestHealthRecords);

// 获取健康统计（必须在 /:id 之前）
router.get('/stats', healthController.getHealthStats);

// 批量导入健康记录（必须在 /:id 之前）
router.post('/batch-import', healthController.batchImportHealthRecords);

// 创建健康记录
router.post('/', validation.healthRecordValidation, healthController.createHealthRecord);

// 更新健康记录
router.put('/:id', validation.healthRecordValidation, healthController.updateHealthRecord);

// 删除健康记录
router.delete('/:id', healthController.deleteHealthRecord);

module.exports = router;