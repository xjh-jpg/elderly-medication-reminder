const pool = require('../config/db');

// 格式化时间为本地时间字符串 (YYYY-MM-DD HH:mm)
function formatLocalTime(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

// 获取健康记录
exports.getHealthRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, start_date, end_date, limit } = req.query;

    let query = 'SELECT * FROM health_records WHERE elder_id = ?';
    const params = [userId];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (start_date) {
      query += ' AND DATE(record_time) >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND DATE(record_time) <= ?';
      params.push(end_date);
    }

    query += ' ORDER BY record_time DESC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(parseInt(limit));
    }

    const [records] = await pool.execute(query, params);

    // 格式化数据
    const formattedRecords = records.map(record => ({
      ...record,
      record_time: formatLocalTime(record.record_time)
    }));

    res.json({
      code: 200,
      message: '获取成功',
      data: formattedRecords
    });
  } catch (error) {
    console.error('获取健康记录错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 获取最新健康记录
exports.getLatestHealthRecords = async (req, res) => {
  try {
    const userId = req.user.id;

    // 获取每种类型的最新记录
    const [latestRecords] = await pool.execute(
      `SELECT h1.* FROM health_records h1
       INNER JOIN (
         SELECT type, MAX(record_time) as max_time
         FROM health_records 
         WHERE elder_id = ?
         GROUP BY type
       ) h2 ON h1.type = h2.type AND h1.record_time = h2.max_time
       WHERE h1.elder_id = ?
       ORDER BY h1.record_time DESC`,
      [userId, userId]
    );

    // 获取最近7天的记录用于趋势分析
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const pad2 = n => String(n).padStart(2, '0');
    const sevenDaysAgoStr = `${sevenDaysAgo.getFullYear()}-${pad2(sevenDaysAgo.getMonth()+1)}-${pad2(sevenDaysAgo.getDate())}`;

    const [trendRecords] = await pool.execute(
      `SELECT * FROM health_records 
       WHERE elder_id = ? 
       AND record_time >= ?
       ORDER BY record_time ASC`,
      [userId, sevenDaysAgoStr]
    );

    // 按类型分组
    const recordsByType = {
      blood_pressure: [],
      blood_sugar: [],
      heart_rate: [],
      weight: []
    };

    trendRecords.forEach(record => {
      if (recordsByType[record.type]) {
        recordsByType[record.type].push({
          value: record.value1,
          time: formatLocalTime(record.record_time),
          remark: record.remark
        });
      }
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        latest: latestRecords.map(record => ({
          ...record,
          record_time: formatLocalTime(record.record_time)
        })),
        trends: recordsByType
      }
    });
  } catch (error) {
    console.error('获取最新健康记录错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 创建健康记录
exports.createHealthRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, value1, value2, record_time, remark } = req.body;

    // 验证数据范围
    const validations = {
      blood_pressure: {
        min1: 50, max1: 250,  // 收缩压
        min2: 30, max2: 150   // 舒张压
      },
      blood_sugar: {
        min1: 2, max1: 30     // 血糖
      },
      heart_rate: {
        min1: 30, max1: 200   // 心率
      },
      weight: {
        min1: 20, max1: 300   // 体重
      }
    };

    const validation = validations[type];
    if (validation) {
      if (value1 < validation.min1 || value1 > validation.max1) {
        return res.status(400).json({ 
          code: 400, 
          message: `值1超出合理范围(${validation.min1}-${validation.max1})` 
        });
      }
      if (value2 !== undefined && validation.min2 && validation.max2) {
        if (value2 < validation.min2 || value2 > validation.max2) {
          return res.status(400).json({ 
            code: 400, 
            message: `值2超出合理范围(${validation.min2}-${validation.max2})` 
          });
        }
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO health_records 
       (elder_id, type, value1, value2, record_time, remark) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, value1, value2 ?? null, record_time ? new Date(record_time).toISOString().slice(0, 19).replace('T', ' ') : null, remark ?? null]
    );

    const [newRecord] = await pool.execute(
      'SELECT * FROM health_records WHERE id = ?',
      [result.insertId]
    );

    res.json({
      code: 200,
      message: '创建成功',
      data: {
        ...newRecord[0],
        record_time: formatLocalTime(newRecord[0].record_time)
      }
    });
  } catch (error) {
    console.error('创建健康记录错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 更新健康记录
exports.updateHealthRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    // 检查权限
    const [existing] = await pool.execute(
      'SELECT id FROM health_records WHERE id = ? AND elder_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ 
        code: 404, 
        message: '健康记录不存在或无权访问' 
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
      `UPDATE health_records 
       SET ${updateFields.join(', ')} 
       WHERE id = ? AND elder_id = ?`,
      updateValues
    );

    // 获取更新后的数据
    const [updated] = await pool.execute(
      'SELECT * FROM health_records WHERE id = ?',
      [id]
    );

    res.json({
      code: 200,
      message: '更新成功',
      data: {
        ...updated[0],
        record_time: formatLocalTime(updated[0].record_time)
      }
    });
  } catch (error) {
    console.error('更新健康记录错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 删除健康记录
exports.deleteHealthRecord = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // 检查权限
    const [existing] = await pool.execute(
      'SELECT id FROM health_records WHERE id = ? AND elder_id = ?',
      [id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ 
        code: 404, 
        message: '健康记录不存在或无权访问' 
      });
    }

    await pool.execute(
      'DELETE FROM health_records WHERE id = ?',
      [id]
    );

    // 记录操作日志
    await pool.execute(
      'INSERT INTO operation_logs (user_id, action, ip_address) VALUES (?, ?, ?)',
      [userId, '删除健康记录', req.ip || '']
    );

    res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除健康记录错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 获取健康统计
exports.getHealthStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    const pad = n => String(n).padStart(2, '0');
    const startDateStr = `${startDate.getFullYear()}-${pad(startDate.getMonth()+1)}-${pad(startDate.getDate())}`;

    let typeCondition = '';
    const params = [userId, startDateStr];

    if (type) {
      typeCondition = 'AND type = ?';
      params.push(type);
    }

    // 获取统计数据
    const [stats] = await pool.execute(
      `SELECT 
        type,
        COUNT(*) as record_count,
        MIN(value1) as min_value,
        MAX(value1) as max_value,
        AVG(value1) as avg_value,
        MAX(record_time) as last_record
       FROM health_records 
       WHERE elder_id = ? 
       AND record_time >= ?
       ${typeCondition}
       GROUP BY type`,
      params
    );

    // 获取最近记录
    const [recentRecords] = await pool.execute(
      `SELECT * FROM health_records 
       WHERE elder_id = ? 
       AND record_time >= ?
       ${typeCondition}
       ORDER BY record_time DESC
       LIMIT 20`,
      params
    );

    // 健康指标评估
    const healthAssessments = stats.map(stat => {
      let assessment = '正常';
      let color = 'success';
      let message = '';

      switch (stat.type) {
        case 'blood_pressure':
          const systolic = stat.avg_value;
          if (systolic < 90) {
            assessment = '偏低';
            color = 'warning';
            message = '建议咨询医生';
          } else if (systolic > 140) {
            assessment = '偏高';
            color = 'danger';
            message = '建议及时就医';
          }
          break;

        case 'blood_sugar':
          if (stat.avg_value < 3.9) {
            assessment = '偏低';
            color = 'warning';
            message = '注意低血糖';
          } else if (stat.avg_value > 7.8) {
            assessment = '偏高';
            color = 'danger';
            message = '建议控制饮食';
          }
          break;

        case 'heart_rate':
          if (stat.avg_value < 60) {
            assessment = '偏慢';
            color = 'warning';
            message = '注意休息';
          } else if (stat.avg_value > 100) {
            assessment = '偏快';
            color = 'danger';
            message = '建议放松心情';
          }
          break;

        case 'weight':
          // 这里需要结合身高计算BMI，简化处理
          assessment = '稳定';
          break;
      }

      return {
        ...stat,
        last_record: formatLocalTime(stat.last_record),
        assessment,
        color,
        message
      };
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        stats: healthAssessments,
        recent_records: recentRecords.map(record => ({
          ...record,
          record_time: formatLocalTime(record.record_time)
        })),
        analysis_period: {
          start: startDateStr,
          days: days,
          end: formatLocalTime(new Date()).split(' ')[0]
        }
      }
    });
  } catch (error) {
    console.error('获取健康统计错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 批量导入健康记录（简化版）
exports.batchImportHealthRecords = async (req, res) => {
  try {
    const userId = req.user.id;
    const { records } = req.body;

    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ 
        code: 400, 
        message: '请提供健康记录数组' 
      });
    }

    const results = [];
    const errors = [];

    for (const record of records) {
      try {
        const { type, value1, value2, record_time, remark } = record;

        const [result] = await pool.execute(
          `INSERT INTO health_records 
           (elder_id, type, value1, value2, record_time, remark) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [userId, type, value1, value2 || null, record_time, remark]
        );

        results.push({
          id: result.insertId,
          type,
          success: true
        });
      } catch (error) {
        errors.push({
          record,
          error: error.message
        });
      }
    }

    res.json({
      code: 200,
      message: `导入完成，成功${results.length}条，失败${errors.length}条`,
      data: {
        success_count: results.length,
        failed_count: errors.length,
        results,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('批量导入健康记录错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};