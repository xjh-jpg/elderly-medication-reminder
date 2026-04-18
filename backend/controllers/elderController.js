const pool = require('../config/db');

// 获取老人档案
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { elder_id } = req.params;

    // 检查权限：老人只能查看自己的档案，子女可以查看关联老人的档案
    let targetUserId = userId;
    
    if (req.user.role === 'child' && elder_id) {
      // 子女查看指定老人档案
      targetUserId = elder_id;
      
      // 这里可以添加关联关系验证（实际项目中应有老人-子女关联表）
      // 暂时允许子女查看所有老人档案（测试用）
    }

    const [profiles] = await pool.execute(
      `SELECT * FROM elder_profiles WHERE user_id = ?`,
      [targetUserId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ 
        code: 404, 
        message: '未找到老人档案' 
      });
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: profiles[0]
    });
  } catch (error) {
    console.error('获取老人档案错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 创建/更新老人档案
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    // 检查是否已有档案
    const [existingProfiles] = await pool.execute(
      'SELECT id FROM elder_profiles WHERE user_id = ?',
      [userId]
    );

    let result;
    // 不允许被更新的字段
    const IMMUTABLE_FIELDS = new Set(['id', 'elder_id', 'user_id', 'create_time', 'update_time']);

    if (existingProfiles.length > 0) {
      // 更新现有档案
      const updateFields = [];
      const updateValues = [];

      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== undefined && !IMMUTABLE_FIELDS.has(key)) {
          updateFields.push(`${key} = ?`);
          updateValues.push(profileData[key]);
        }
      });

      if (updateFields.length === 0) {
        return res.status(400).json({ 
          code: 400, 
          message: '没有要更新的数据' 
        });
      }

      updateValues.push(userId);

      result = await pool.execute(
        `UPDATE elder_profiles SET ${updateFields.join(', ')} WHERE user_id = ?`,
        updateValues
      );
    } else {
      // 创建新档案
      const fields = ['user_id', 'name'];
      const values = [userId, profileData.name || req.user.name];
      const placeholders = ['?', '?'];

      Object.keys(profileData).forEach(key => {
        if (key !== 'name' && profileData[key] !== undefined) {
          fields.push(key);
          values.push(profileData[key]);
          placeholders.push('?');
        }
      });

      result = await pool.execute(
        `INSERT INTO elder_profiles (${fields.join(', ')}) VALUES (${placeholders.join(', ')})`,
        values
      );
    }

    // 获取更新后的档案
    const [profiles] = await pool.execute(
      'SELECT * FROM elder_profiles WHERE user_id = ?',
      [userId]
    );

    res.json({
      code: 200,
      message: existingProfiles.length > 0 ? '更新成功' : '创建成功',
      data: profiles[0]
    });
  } catch (error) {
    console.error('更新老人档案错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 获取所有老人列表（子女和管理员用）
exports.getElderList = async (req, res) => {
  try {
    const [elders] = await pool.execute(
      `SELECT 
        u.id, u.phone, u.name, u.role, u.create_time,
        ep.age, ep.gender, ep.emergency_contact, ep.emergency_phone
       FROM users u
       LEFT JOIN elder_profiles ep ON u.id = ep.user_id
       WHERE u.role = 'elder'
       ORDER BY u.create_time DESC`
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: elders
    });
  } catch (error) {
    console.error('获取老人列表错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 获取紧急联系人信息
exports.getEmergencyContacts = async (req, res) => {
  try {
    const userId = req.user.id;

    const [profiles] = await pool.execute(
      `SELECT 
        emergency_contact, 
        emergency_phone,
        name as elder_name
       FROM elder_profiles 
       WHERE user_id = ?`,
      [userId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ 
        code: 404, 
        message: '未找到老人档案' 
      });
    }

    const profile = profiles[0];
    
    // 获取子女联系人（如果有）
    const [children] = await pool.execute(
      `SELECT name, phone 
       FROM users 
       WHERE role = 'child' 
       ORDER BY create_time DESC 
       LIMIT 3`
    );

    const contacts = [
      {
        name: '120急救',
        phone: '120',
        type: 'emergency',
        icon: 'ambulance'
      },
      {
        name: profile.emergency_contact || '紧急联系人',
        phone: profile.emergency_phone || '未设置',
        type: 'family',
        icon: 'user'
      }
    ];

    // 添加子女联系人
    children.forEach(child => {
      contacts.push({
        name: child.name,
        phone: child.phone,
        type: 'child',
        icon: 'child'
      });
    });

    // 添加社区电话（模拟）
    contacts.push({
      name: '社区服务中心',
      phone: '400-123-4567',
      type: 'community',
      icon: 'home'
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        elder_name: profile.elder_name,
        contacts
      }
    });
  } catch (error) {
    console.error('获取紧急联系人错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 获取老人统计信息
exports.getElderStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取用药提醒统计
    const [medicationStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM medication_reminders 
       WHERE elder_id = ?`,
      [userId]
    );

    // 获取健康记录统计
    const [healthStats] = await pool.execute(
      `SELECT 
        type, 
        COUNT(*) as count,
        MAX(record_time) as last_record
       FROM health_records 
       WHERE elder_id = ? 
       GROUP BY type`,
      [userId]
    );

    // 获取今日用药提醒
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
    const [todayMedications] = await pool.execute(
      `SELECT * FROM medication_reminders 
       WHERE elder_id = ? 
       AND DATE(create_time) = ? 
       ORDER BY take_time`,
      [userId, today]
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        medication: medicationStats[0] || { total: 0, taken: 0, pending: 0 },
        health_records: healthStats,
        today_medications: todayMedications,
        stats_date: today
      }
    });
  } catch (error) {
    console.error('获取老人统计错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};