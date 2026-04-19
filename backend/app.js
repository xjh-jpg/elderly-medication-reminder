const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// 加载环境变量
dotenv.config();

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件 - CORS 支持本地和多个线上域名
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // 允许无 origin 的请求（如 Postman、移动端直接调用）
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(o => origin.startsWith(o) || o === '*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ============================================
// 路由注册（必须在 404 之前）
// ============================================

// API 根路径 - 服务信息
app.get('/', (req, res) => {
  res.json({
    name: '银发数字化·智慧养老平台 API',
    version: '1.0.0',
    status: 'running',
    docs: '/api-docs',
    health: '/health',
    timestamp: new Date().toISOString()
  });
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'elder-care-api'
  });
});

// API文档端点
app.get('/api-docs', (req, res) => {
  res.json({
    service: '银发数字化·智慧养老平台API',
    version: '1.0.0',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        profile: 'GET /api/auth/me',
        changePassword: 'POST /api/auth/change-password'
      },
      elder: {
        profile: 'GET /api/elder/profile/:elder_id?',
        updateProfile: 'PUT /api/elder/profile',
        contacts: 'GET /api/elder/emergency-contacts',
        stats: 'GET /api/elder/stats',
        list: 'GET /api/elder/list'
      },
      medication: {
        list: 'GET /api/medication',
        today: 'GET /api/medication/today',
        create: 'POST /api/medication',
        update: 'PUT /api/medication/:id',
        markStatus: 'PATCH /api/medication/:id/status',
        delete: 'DELETE /api/medication/:id',
        stats: 'GET /api/medication/stats'
      },
      health: {
        list: 'GET /api/health',
        latest: 'GET /api/health/latest',
        create: 'POST /api/health',
        update: 'PUT /api/health/:id',
        delete: 'DELETE /api/health/:id',
        stats: 'GET /api/health/stats',
        batchImport: 'POST /api/health/batch-import'
      },
      admin: {
        login: 'POST /api/admin/login',
        users: 'GET /api/admin/users',
        toggleStatus: 'POST /api/admin/users/toggle-status',
        stats: 'GET /api/admin/stats',
        export: 'GET /api/admin/export',
        logs: 'GET /api/admin/logs',
        config: 'GET /api/admin/config',
        changePassword: 'POST /api/admin/change-password'
      }
    }
  });
});

// 路由导入
const authRoutes = require('./routes/authRoutes');
const elderRoutes = require('./routes/elderRoutes');
const medicationRoutes = require('./routes/medicationRoutes');
const healthRoutes = require('./routes/healthRoutes');
const adminRoutes = require('./routes/adminRoutes');

// 业务路由注册
app.use('/api/auth', authRoutes);
app.use('/api/elder', elderRoutes);
app.use('/api/medication', medicationRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/admin', adminRoutes);

// ============================================
// 错误处理（必须在所有路由之后）
// ============================================

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      code: 400,
      message: '参数验证失败',
      errors: err.errors
    });
  }

  res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: '请求的资源不存在'
  });
});

// 启动服务器 - 绑定 0.0.0.0 确保 Railway 等云平台可访问
app.listen(PORT, '0.0.0.0', () => {
  console.log(`银发数字化·智慧养老平台 API 服务器启动成功，端口: ${PORT}`);
  console.log(`健康检查: http://0.0.0.0:${PORT}/health`);
  console.log(`API文档: http://0.0.0.0:${PORT}/api-docs`);
  console.log(`数据库: ${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`);
});

module.exports = app;
