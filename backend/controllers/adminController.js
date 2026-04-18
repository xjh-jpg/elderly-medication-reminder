const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

// 管理员登录
exports.adminLogin = async (req, res) => {
  try {
    const { account, password } = req.body;

    // 查询管理员
    const [admins] = await pool.execute(
      'SELECT * FROM admin WHERE account = ?',
      [account]
    );

    if (admins.length === 0) {
      return res.status(401).json({ 
        code: 401, 
        message: '账号或密码错误' 
      });
    }

    const admin = admins[0];

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        code: 401, 
        message: '账号或密码错误' 
      });
    }

    // 生成管理员JWT令牌
    const token = jwt.sign(
      { 
        id: admin.id, 
        account: admin.account, 
        name: admin.name, 
        role: 'admin' 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // 返回管理员信息（不包含密码）
    const adminInfo = {
      id: admin.id,
      account: admin.account,
      name: admin.name,
      create_time: admin.create_time
    };

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        admin: adminInfo,
        token
      }
    });
  } catch (error) {
    console.error('管理员登录错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 获取用户列表
exports.getUserList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, role, phone, name } = req.query;
    const offset = (page - 1) * pageSize;

    const whereClauses = [];
    const params = [];

    if (role) {
      whereClauses.push('role = ?');
      params.push(role);
    }

    if (phone) {
      whereClauses.push('phone LIKE ?');
      params.push(`%${phone}%`);
    }

    if (name) {
      whereClauses.push('name LIKE ?');
      params.push(`%${name}%`);
    }

    const whereStr = whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : '';

    // 获取总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM users ${whereStr}`,
      params
    );
    const total = countResult[0].total;

    // 获取分页数据
    const [users] = await pool.execute(
      `SELECT id, phone, name, role, status, create_time 
       FROM users ${whereStr}
       ORDER BY create_time DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    // 获取每个用户的档案信息
    const usersWithProfiles = await Promise.all(
      users.map(async (user) => {
        if (user.role === 'elder') {
          const [profiles] = await pool.execute(
            'SELECT * FROM elder_profiles WHERE user_id = ?',
            [user.id]
          );
          user.profile = profiles[0] || null;
        }
        return user;
      })
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: usersWithProfiles,
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 获取老人数据统计
exports.getElderStats = async (req, res) => {
  try {
    // 用户总数统计
    const [userStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'elder' THEN 1 ELSE 0 END) as elder_count,
        SUM(CASE WHEN role = 'child' THEN 1 ELSE 0 END) as child_count
       FROM users`
    );

    // 健康记录统计
    const [healthStats] = await pool.execute(
      `SELECT 
        type,
        COUNT(*) as record_count
       FROM health_records 
       GROUP BY type`
    );

    // 用药提醒统计
    const [medicationStats] = await pool.execute(
      `SELECT 
        status,
        COUNT(*) as count
       FROM medication_reminders 
       GROUP BY status`
    );

    // 最近7天活跃用户
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const [activeUsers] = await pool.execute(
      `SELECT 
        u.id, u.phone, u.name, u.role,
        MAX(hr.record_time) as last_health_record,
        MAX(mr.create_time) as last_medication
       FROM users u
       LEFT JOIN health_records hr ON u.id = hr.elder_id
         AND hr.record_time >= ?
       LEFT JOIN medication_reminders mr ON u.id = mr.elder_id
         AND mr.create_time >= ?
       WHERE hr.id IS NOT NULL OR mr.id IS NOT NULL
       GROUP BY u.id, u.phone, u.name, u.role
       ORDER BY MAX(COALESCE(hr.record_time, '2000-01-01')) DESC,
                MAX(COALESCE(mr.create_time, '2000-01-01')) DESC
       LIMIT 10`,
      [sevenDaysAgoStr, sevenDaysAgoStr]
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        user_stats: userStats[0],
        health_stats: healthStats,
        medication_stats: medicationStats,
        active_users: activeUsers.map(user => ({
          ...user,
          last_health_record: user.last_health_record 
            ? user.last_health_record.toISOString().replace('T', ' ').substring(0, 16)
            : null,
          last_medication: user.last_medication
            ? user.last_medication.toISOString().replace('T', ' ').substring(0, 16)
            : null
        })),
        analysis_period: {
          start: sevenDaysAgoStr,
          end: new Date().toISOString().split('T')[0]
        }
      }
    });
  } catch (error) {
    console.error('获取老人数据统计错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 导出老人数据
exports.exportElderData = async (req, res) => {
  try {
    const { start_date, end_date, data_type } = req.query;

    let data;
    let filename;

    if (data_type === 'health') {
      // 导出健康记录
      let query = `SELECT 
                    hr.*,
                    u.name as elder_name,
                    u.phone
                   FROM health_records hr
                   JOIN users u ON hr.elder_id = u.id
                   WHERE 1=1`;
      const params = [];

      if (start_date) {
        query += ' AND DATE(hr.record_time) >= ?';
        params.push(start_date);
      }

      if (end_date) {
        query += ' AND DATE(hr.record_time) <= ?';
        params.push(end_date);
      }

      query += ' ORDER BY hr.record_time DESC';

      const [records] = await pool.execute(query, params);

      data = records.map(record => ({
        老人姓名: record.elder_name,
        手机号: record.phone,
        记录类型: record.type,
        值1: record.value1,
        值2: record.value2,
        记录时间: record.record_time.toISOString().replace('T', ' ').substring(0, 19),
        备注: record.remark || ''
      }));

      filename = `健康记录_${new Date().toISOString().split('T')[0]}.json`;

    } else if (data_type === 'medication') {
      // 导出用药记录
      let query = `SELECT 
                    mr.*,
                    u.name as elder_name,
                    u.phone
                   FROM medication_reminders mr
                   JOIN users u ON mr.elder_id = u.id
                   WHERE 1=1`;
      const params = [];

      if (start_date) {
        query += ' AND DATE(mr.create_time) >= ?';
        params.push(start_date);
      }

      if (end_date) {
        query += ' AND DATE(mr.create_time) <= ?';
        params.push(end_date);
      }

      query += ' ORDER BY mr.create_time DESC';

      const [records] = await pool.execute(query, params);

      data = records.map(record => ({
        老人姓名: record.elder_name,
        手机号: record.phone,
        药品名称: record.medicine_name,
        剂量: record.dosage,
        频率: record.frequency,
        服用时间: record.take_time.substring(0, 5),
        状态: record.status,
        创建时间: record.create_time.toISOString().replace('T', ' ').substring(0, 19),
        备注: record.remark || ''
      }));

      filename = `用药记录_${new Date().toISOString().split('T')[0]}.json`;

    } else if (data_type === 'elder') {
      // 导出老人档案
      const [records] = await pool.execute(
        `SELECT 
          u.id, u.phone, u.name, u.role, u.create_time,
          ep.age, ep.gender, ep.height, ep.weight,
          ep.history_disease, ep.allergy_medicine,
          ep.emergency_contact, ep.emergency_phone
         FROM users u
         LEFT JOIN elder_profiles ep ON u.id = ep.user_id
         WHERE u.role = 'elder'
         ORDER BY u.create_time DESC`
      );

      data = records.map(record => ({
        姓名: record.name,
        手机号: record.phone,
        年龄: record.age || '',
        性别: record.gender || '',
        身高: record.height || '',
        体重: record.weight || '',
        既往病史: record.history_disease || '',
        过敏药物: record.allergy_medicine || '',
        紧急联系人: record.emergency_contact || '',
        紧急电话: record.emergency_phone || '',
        注册时间: record.create_time.toISOString().replace('T', ' ').substring(0, 19)
      }));

      filename = `老人档案_${new Date().toISOString().split('T')[0]}.json`;

    } else {
      return res.status(400).json({ 
        code: 400, 
        message: '请指定导出类型(health/medication/elder)' 
      });
    }

    res.json({
      code: 200,
      message: '导出成功',
      data: {
        filename,
        data,
        export_time: new Date().toISOString(),
        record_count: data.length,
        export_params: { start_date, end_date, data_type }
      }
    });
  } catch (error) {
    console.error('导出老人数据错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 禁用/启用用户
exports.toggleUserStatus = async (req, res) => {
  try {
    const { user_id, action } = req.body;

    if (!['disable', 'enable'].includes(action)) {
      return res.status(400).json({ 
        code: 400, 
        message: '操作必须是disable或enable' 
      });
    }

    // 检查用户是否存在
    const [users] = await pool.execute('SELECT id, name FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    const newStatus = action === 'disable' ? 'disabled' : 'active';
    await pool.execute('UPDATE users SET status = ? WHERE id = ?', [newStatus, user_id]);

    // 记录操作日志
    try {
      await pool.execute(
        'INSERT INTO operation_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
        [req.user.id, `${action === 'disable' ? '禁用' : '启用'}用户 ${users[0].name}(ID:${user_id})`, req.ip || '']
      );
    } catch (logErr) {
      // 日志写入失败不影响主操作
      console.warn('操作日志写入失败:', logErr.message);
    }

    res.json({
      code: 200,
      message: action === 'disable' ? '用户已禁用' : '用户已启用',
      data: { user_id, status: newStatus }
    });
  } catch (error) {
    console.error('操作用户状态错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 获取操作日志
exports.getOperationLogs = async (req, res) => {
  try {
    const { page = 1, pageSize = 50, user_id, start_date, end_date } = req.query;
    const offset = (page - 1) * pageSize;

    const whereClauses = [];
    const params = [];

    if (user_id) {
      whereClauses.push('ol.user_id = ?');
      params.push(user_id);
    }

    if (start_date) {
      whereClauses.push('DATE(ol.create_time) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      whereClauses.push('DATE(ol.create_time) <= ?');
      params.push(end_date);
    }

    const whereStr = whereClauses.length > 0 ? ' WHERE ' + whereClauses.join(' AND ') : '';

    // 获取总数
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM operation_logs ol LEFT JOIN users u ON ol.user_id = u.id ${whereStr}`,
      params
    );
    const total = countResult[0].total;

    // 获取分页数据
    const [logs] = await pool.execute(
      `SELECT ol.*, u.name as user_name, u.phone
       FROM operation_logs ol
       LEFT JOIN users u ON ol.user_id = u.id
       ${whereStr}
       ORDER BY ol.create_time DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(pageSize), offset]
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: logs.map(log => ({
          ...log,
          create_time: log.create_time.toISOString().replace('T', ' ').substring(0, 19)
        })),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    console.error('获取操作日志错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 修改管理员密码
exports.changeAdminPassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const adminId = req.user.id;

    // 获取当前管理员密码
    const [admins] = await pool.execute(
      'SELECT password FROM admin WHERE id = ?',
      [adminId]
    );

    if (admins.length === 0) {
      return res.status(404).json({ 
        code: 404, 
        message: '管理员不存在' 
      });
    }

    // 验证旧密码
    const isValidPassword = await bcrypt.compare(old_password, admins[0].password);
    if (!isValidPassword) {
      return res.status(400).json({ 
        code: 400, 
        message: '原密码错误' 
      });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // 更新密码
    await pool.execute(
      'UPDATE admin SET password = ? WHERE id = ?',
      [hashedPassword, adminId]
    );

    // 记录操作日志
    try {
      await pool.execute(
        'INSERT INTO operation_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
        [adminId, '修改管理员密码', req.ip || '']
      );
    } catch (logErr) {
      console.warn('操作日志写入失败:', logErr.message);
    }

    res.json({
      code: 200,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改管理员密码错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 获取系统配置（简化版）
exports.getSystemConfig = async (req, res) => {
  try {
    // 这里可以返回系统配置信息
    const config = {
      system_name: '银发数字化·智慧养老平台',
      version: '1.0.0',
      contact_email: 'support@eldercare.com',
      contact_phone: '400-123-4567',
      maintenance_mode: false,
      allow_registration: true,
      max_health_records_per_day: 10,
      max_medications_per_user: 20,
      data_retention_days: 365
    };

    res.json({
      code: 200,
      message: '获取成功',
      data: config
    });
  } catch (error) {
    console.error('获取系统配置错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};