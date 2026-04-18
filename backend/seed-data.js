/**
 * 测试数据填充脚本
 * 为子女账号（张小三，user_id=4）创建对应的老人档案、用药提醒、健康记录
 * 使用本地时区生成日期
 */
const mysql = require('mysql2/promise');

// 获取本地时区日期字符串 (YYYY-MM-DD)
function getLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function seedData() {
  const pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '123456',
    database: 'elder_care',
    charset: 'utf8mb4'
  });

  try {
    console.log('开始填充测试数据...');

    // 先清理旧数据（防止重复）
    await pool.execute('DELETE FROM health_records WHERE elder_id = 4');
    await pool.execute('DELETE FROM medication_reminders WHERE elder_id = 4');
    await pool.execute('DELETE FROM elder_profiles WHERE user_id = 4');
    console.log('✅ 已清理旧数据');

    // 1. 为张小三（id=4）创建老人档案
    await pool.execute(`
      INSERT INTO elder_profiles (user_id, name, age, gender, height, weight, history_disease, allergy_medicine, emergency_contact, emergency_phone)
      VALUES (4, '张大山', 73, 'male', 172.0, 70.5, '高血压、糖尿病前期', '青霉素、磺胺类药物', '张小三', '13800000001')
    `);
    console.log('✅ 老人档案已创建（张大山，id=4）');

    // 2. 创建用药提醒
    const medications = [
      ['降压药（苯磺酸氨氯地平片）', '1片（5mg）', '每日1次', '07:30:00', 'taken', '早餐后30分钟服用，不可擅自停药'],
      ['阿司匹林肠溶片', '1片（100mg）', '每日1次', '08:00:00', 'taken', '饭后服用，注意观察有无出血倾向'],
      ['二甲双胍片', '1片（500mg）', '每日2次', '08:00:00', 'taken', '随餐服用，减少胃肠不适'],
      ['二甲双胍片', '1片（500mg）', '每日2次', '19:00:00', 'pending', '随晚餐服用'],
      ['钙尔奇D', '1片', '每日1次', '12:00:00', 'pending', '午餐后服用，补充钙质'],
      ['深海鱼油', '2粒', '每日1次', '21:00:00', 'pending', '睡前服用，有助于心血管健康'],
      ['维生素C', '1片', '每日1次', '08:30:00', 'pending', '早餐后服用，增强免疫力'],
    ];

    for (const med of medications) {
      await pool.execute(`
        INSERT INTO medication_reminders (elder_id, medicine_name, dosage, frequency, take_time, status, remark)
        VALUES (4, ?, ?, ?, ?, ?, ?)
      `, med);
    }
    console.log(`✅ 用药提醒已创建（${medications.length}条）`);

    // 3. 创建健康记录（近7天的数据，使用本地时区）
    const today = new Date();
    const healthRecords = [];

    // 血压数据（近7天）
    const bpData = [
      [128, 82], [132, 85], [125, 80], [138, 88], [130, 83], [135, 86], [127, 81]
    ];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateStr(d);
      healthRecords.push(['blood_pressure', bpData[6-i][0], bpData[6-i][1], `${dateStr} 08:00:00`, '早晨空腹测量']);
      // 下午测量
      if (i < 5) {
        healthRecords.push(['blood_pressure', bpData[6-i][0] + 5, bpData[6-i][1] + 3, `${dateStr} 17:30:00`, '傍晚测量']);
      }
    }

    // 血糖数据
    const bsData = [5.8, 6.2, 5.5, 6.8, 5.9, 6.3, 5.7];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateStr(d);
      healthRecords.push(['blood_sugar', bsData[6-i], null, `${dateStr} 07:30:00`, '空腹血糖']);
      if (i < 4) {
        healthRecords.push(['blood_sugar', bsData[6-i] + 2.5, null, `${dateStr} 12:30:00`, '餐后2小时血糖']);
      }
    }

    // 心率数据
    const hrData = [72, 75, 70, 78, 73, 76, 71];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateStr(d);
      healthRecords.push(['heart_rate', hrData[6-i], null, `${dateStr} 08:00:00`, '安静状态下测量']);
    }

    // 体重数据
    const wtData = [70.5, 70.3, 70.4, 70.2, 70.5, 70.1, 70.3];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = getLocalDateStr(d);
      healthRecords.push(['weight', wtData[6-i], null, `${dateStr} 08:00:00`, '早晨排空后测量']);
    }

    for (const rec of healthRecords) {
      await pool.execute(`
        INSERT INTO health_records (elder_id, type, value1, value2, record_time, remark)
        VALUES (4, ?, ?, ?, ?, ?)
      `, rec);
    }
    console.log(`✅ 健康记录已创建（${healthRecords.length}条）`);

    console.log('\n🎉 测试数据填充完成！');
    console.log('  - 老人档案：张大山（73岁，男）');
    console.log(`  - 用药提醒：${medications.length}条`);
    console.log(`  - 健康记录：${healthRecords.length}条（血压/血糖/心率/体重）`);

  } catch (err) {
    console.error('❌ 填充数据失败:', err.message);
  } finally {
    await pool.end();
  }
}

seedData();
