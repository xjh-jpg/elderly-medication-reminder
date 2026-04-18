const pool = require('../config/db');

// 获取用药提醒列表
exports.getMedications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, status } = req.query;

    let query = 'SELECT * FROM medication_reminders WHERE elder_id = ?';
    const params = [userId];

    if (date) {
      query += ' AND DATE(create_time) = ?';
      params.push(date);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY take_time ASC';

    const [medications] = await pool.execute(query, params);

    // 格式化数据
    const formattedMedications = medications.map(med => ({
      ...med,
      take_time: med.take_time.substring(0, 5) // 只保留HH:mm
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: formattedMedications
    });
  } catch (error) {
    console.error('获取用药提醒错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 获取今日用药提醒
exports.getTodayMedications = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    const today = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;

    const [medications] = await pool.execute(
      `SELECT * FROM medication_reminders 
       WHERE elder_id = ? 
       AND DATE(create_time) = ? 
       ORDER BY take_time ASC`,
      [userId, today]
    );

    // 按状态分组
    const pendingMeds = medications.filter(med => med.status === 'pending');
    const takenMeds = medications.filter(med => med.status === 'taken');
    const skippedMeds = medications.filter(med => med.status === 'skipped');

    // 获取当前时间（now 已在上面声明）
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // 找出最近要服用的药物
    let nextMedication = null;
    for (const med of pendingMeds) {
      const takeTime = med.take_time.substring(0, 5);
      if (takeTime >= currentTime) {
        nextMedication = { ...med, take_time: takeTime };
        break;
      }
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        all: medications.map(med => ({
          ...med,
          take_time: med.take_time.substring(0, 5)
        })),
        pending: pendingMeds.map(med => ({
          ...med,
          take_time: med.take_time.substring(0, 5)
        })),
        taken: takenMeds.map(med => ({
          ...med,
          take_time: med.take_time.substring(0, 5)
        })),
        skipped: skippedMeds.map(med => ({
          ...med,
          take_time: med.take_time.substring(0, 5)
        })),
        next_medication: nextMedication,
        current_time: currentTime,
        stats: {
          total: medications.length,
          pending: pendingMeds.length,
          taken: takenMeds.length,
          skipped: skippedMeds.length
        }
      }
    });
  } catch (error) {
    console.error('获取今日用药提醒错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 创建用药提醒
exports.createMedication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { medicine_name, dosage, frequency, take_time, remark } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO medication_reminders 
       (elder_id, medicine_name, dosage, frequency, take_time, remark) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, medicine_name, dosage, frequency, take_time, remark ?? null]
    );

    const [newMedication] = await pool.execute(
      'SELECT * FROM medication_reminders WHERE id = ?',
      [result.insertId]
    );

    res.json({
      code: 200,
      message: '创建成功',
      data: {
        ...newMedication[0],
        take_time: newMedication[0].take_time.substring(0, 5)
      }
    });
  } catch (error) {
    console.error('创建用药提醒错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 更新用药提醒
exports.updateMedication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    // 检查权限
    const [existing] = await pool.execute(
      'SELECT id FROM medication_reminders WHERE id = ? AND elder_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ 
        code: 404, 
        message: '用药提醒不存在或无权访问' 
      });
    }

    // 构建更新语句
    const updateFields = [];
    const updateValues = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updateData[key]);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        code: 400, 
        message: '没有要更新的数据' 
      });
    }

    updateValues.push(id);
    updateValues.push(userId);

    await pool.execute(
      `UPDATE medication_reminders 
       SET ${updateFields.join(', ')} 
       WHERE id = ? AND elder_id = ?`,
      updateValues
    );

    // 获取更新后的数据
    const [updated] = await pool.execute(
      'SELECT * FROM medication_reminders WHERE id = ?',
      [id]
    );

    res.json({
      code: 200,
      message: '更新成功',
      data: {
        ...updated[0],
        take_time: updated[0].take_time.substring(0, 5)
      }
    });
  } catch (error) {
    console.error('更新用药提醒错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 标记用药状态
exports.markMedicationStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!['taken', 'skipped', 'pending'].includes(status)) {
      return res.status(400).json({ 
        code: 400, 
        message: '状态必须是taken、skipped或pending' 
      });
    }

    // 检查权限
    const [existing] = await pool.execute(
      'SELECT id FROM medication_reminders WHERE id = ? AND elder_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ 
        code: 404, 
        message: '用药提醒不存在或无权访问' 
      });
    }

    await pool.execute(
      'UPDATE medication_reminders SET status = ? WHERE id = ?',
      [status, id]
    );

    // 记录操作日志
    await pool.execute(
      'INSERT INTO operation_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
      [userId, `标记用药状态为${status === 'taken' ? '已服用' : status === 'skipped' ? '已跳过' : '待服用'}`, req.ip || '']
    );

    res.json({
      code: 200,
      message: `已标记为${status === 'taken' ? '已服用' : status === 'skipped' ? '已跳过' : '待服用'}`
    });
  } catch (error) {
    console.error('标记用药状态错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 删除用药提醒
exports.deleteMedication = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // 检查权限
    const [existing] = await pool.execute(
      'SELECT id FROM medication_reminders WHERE id = ? AND elder_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ 
        code: 404, 
        message: '用药提醒不存在或无权访问' 
      });
    }

    await pool.execute(
      'DELETE FROM medication_reminders WHERE id = ?',
      [id]
    );

    // 记录操作日志
    await pool.execute(
      'INSERT INTO operation_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
      [userId, '删除用药提醒', req.ip || '']
    );

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除用药提醒错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 获取用药提醒统计
exports.getMedicationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { start_date, end_date } = req.query;

    let dateCondition = '';
    const params = [userId];

    if (start_date && end_date) {
      dateCondition = 'AND DATE(create_time) BETWEEN ? AND ?';
      params.push(start_date, end_date);
    } else if (start_date) {
      dateCondition = 'AND DATE(create_time) >= ?';
      params.push(start_date);
    } else if (end_date) {
      dateCondition = 'AND DATE(create_time) <= ?';
      params.push(end_date);
    }

    // 按日统计
    const [dailyStats] = await pool.execute(
      `SELECT 
        DATE(create_time) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken,
        SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending
       FROM medication_reminders 
       WHERE elder_id = ? ${dateCondition}
       GROUP BY DATE(create_time)
       ORDER BY date DESC
       LIMIT 30`,
      params
    );

    // 按药品统计
    const [medicineStats] = await pool.execute(
      `SELECT 
        medicine_name,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken_rate
       FROM medication_reminders 
       WHERE elder_id = ? ${dateCondition}
       GROUP BY medicine_name
       ORDER BY total DESC`,
      params
    );

    // 总体统计
    const [overallStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'taken' THEN 1 ELSE 0 END) as taken,
        SUM(CASE WHEN status = 'skipped' THEN 1 ELSE 0 END) as skipped,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        COUNT(DISTINCT medicine_name) as medicine_count
       FROM medication_reminders 
       WHERE elder_id = ? ${dateCondition}`,
      params
    );

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        daily_stats: dailyStats,
        medicine_stats: medicineStats,
        overall_stats: overallStats[0] || {
          total: 0,
          taken: 0,
          skipped: 0,
          pending: 0,
          medicine_count: 0
        }
      }
    });
  } catch (error) {
    console.error('获取用药统计错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};