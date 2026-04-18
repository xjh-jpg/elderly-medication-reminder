-- 银发数字化·智慧养老平台数据库初始化脚本
-- MySQL 8.0.12

CREATE DATABASE IF NOT EXISTS elder_care;
USE elder_care;

-- 1. 用户表（老人账号 / 子女账号）
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    phone VARCHAR(11) UNIQUE NOT NULL COMMENT '手机号',
    password VARCHAR(255) NOT NULL COMMENT '加密密码',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    role ENUM('elder', 'child') NOT NULL DEFAULT 'elder' COMMENT '角色：elder-老人, child-子女',
    status ENUM('active', 'disabled') NOT NULL DEFAULT 'active' COMMENT '账号状态',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 2. 老人档案表
CREATE TABLE elder_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '关联用户ID',
    name VARCHAR(50) NOT NULL COMMENT '姓名',
    age INT COMMENT '年龄',
    gender ENUM('male', 'female', 'other') DEFAULT 'male' COMMENT '性别',
    height DECIMAL(5,2) COMMENT '身高(cm)',
    weight DECIMAL(5,2) COMMENT '体重(kg)',
    history_disease TEXT COMMENT '既往病史',
    allergy_medicine TEXT COMMENT '过敏药物',
    emergency_contact VARCHAR(50) COMMENT '紧急联系人',
    emergency_phone VARCHAR(11) COMMENT '紧急联系电话',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='老人档案表';

-- 3. 用药提醒表
CREATE TABLE medication_reminders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    elder_id INT NOT NULL COMMENT '关联老人ID',
    medicine_name VARCHAR(100) NOT NULL COMMENT '药品名称',
    dosage VARCHAR(50) NOT NULL COMMENT '剂量',
    frequency VARCHAR(50) NOT NULL COMMENT '频率（如：每日3次）',
    take_time TIME NOT NULL COMMENT '服用时间',
    status ENUM('pending', 'taken', 'skipped') DEFAULT 'pending' COMMENT '状态：pending-未服用, taken-已服用, skipped-跳过',
    remark VARCHAR(255) COMMENT '备注',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (elder_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_elder_id (elder_id),
    INDEX idx_take_time (take_time),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用药提醒表';

-- 4. 健康记录表
CREATE TABLE health_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    elder_id INT NOT NULL COMMENT '关联老人ID',
    type ENUM('blood_pressure', 'blood_sugar', 'heart_rate', 'weight') NOT NULL COMMENT '记录类型',
    value1 DECIMAL(8,2) COMMENT '值1（如：收缩压/血糖/心率/体重）',
    value2 DECIMAL(8,2) COMMENT '值2（如：舒张压）',
    record_time DATETIME NOT NULL COMMENT '记录时间',
    remark VARCHAR(255) COMMENT '备注',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (elder_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_elder_id (elder_id),
    INDEX idx_type (type),
    INDEX idx_record_time (record_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康记录表';

-- 5. 管理员表
CREATE TABLE admin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    account VARCHAR(50) UNIQUE NOT NULL COMMENT '管理员账号',
    password VARCHAR(255) NOT NULL COMMENT '加密密码',
    name VARCHAR(50) NOT NULL COMMENT '管理员姓名',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_account (account)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- 6. 操作日志表（可选，用于记录用户操作）
CREATE TABLE operation_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT '用户ID',
    action VARCHAR(100) NOT NULL COMMENT '操作描述',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 插入初始数据
-- 密码都是 123456 的 bcrypt 加密值

-- 老人账号
INSERT INTO users (phone, password, name, role) VALUES
('13500000001', '$2a$10$RgOG.DjOVcf/t3PB8FVL4ecyB2cyPZSONKWJaTPeFN3t5eZ.LL/oC', '张三', 'elder'),
('13500000002', '$2a$10$RgOG.DjOVcf/t3PB8FVL4ecyB2cyPZSONKWJaTPeFN3t5eZ.LL/oC', '李四', 'elder'),
('13500000003', '$2a$10$RgOG.DjOVcf/t3PB8FVL4ecyB2cyPZSONKWJaTPeFN3t5eZ.LL/oC', '王五', 'elder');

-- 子女账号
INSERT INTO users (phone, password, name, role) VALUES
('13800000001', '$2a$10$RgOG.DjOVcf/t3PB8FVL4ecyB2cyPZSONKWJaTPeFN3t5eZ.LL/oC', '张小三', 'child'),
('13800000002', '$2a$10$RgOG.DjOVcf/t3PB8FVL4ecyB2cyPZSONKWJaTPeFN3t5eZ.LL/oC', '李小四', 'child');

-- 老人档案数据
INSERT INTO elder_profiles (user_id, name, age, gender, height, weight, history_disease, allergy_medicine, emergency_contact, emergency_phone) VALUES
(1, '张三', 72, 'male', 170.5, 68.2, '高血压，糖尿病', '青霉素', '张大大', '13800000001'),
(2, '李四', 68, 'female', 162.0, 58.5, '关节炎', '头孢', '李大妈', '13800000002'),
(3, '王五', 75, 'male', 175.0, 72.0, '心脏病', '无', '王小五', '13900000000');

-- 用药提醒数据
INSERT INTO medication_reminders (elder_id, medicine_name, dosage, frequency, take_time, status, remark) VALUES
(1, '降压药', '1片', '每日1次', '08:00:00', 'pending', '早餐后服用'),
(1, '降糖药', '2片', '每日3次', '08:00:00', 'taken', '饭前服用'),
(1, '降糖药', '2片', '每日3次', '12:00:00', 'pending', '饭前服用'),
(1, '降糖药', '2片', '每日3次', '18:00:00', 'pending', '饭前服用'),
(2, '关节炎药', '1片', '每日2次', '09:00:00', 'taken', '饭后服用'),
(2, '关节炎药', '1片', '每日2次', '21:00:00', 'pending', '睡前服用'),
(3, '心脏药', '半片', '每日1次', '07:00:00', 'pending', '空腹服用');

-- 健康记录数据
INSERT INTO health_records (elder_id, type, value1, value2, record_time, remark) VALUES
(1, 'blood_pressure', 135.0, 85.0, '2026-04-14 08:00:00', '早晨测量'),
(1, 'blood_pressure', 140.0, 90.0, '2026-04-14 18:00:00', '傍晚测量'),
(1, 'blood_sugar', 6.5, NULL, '2026-04-14 08:00:00', '空腹血糖'),
(1, 'blood_sugar', 8.2, NULL, '2026-04-14 14:00:00', '餐后血糖'),
(1, 'heart_rate', 78, NULL, '2026-04-14 08:00:00', '安静状态'),
(1, 'weight', 68.2, NULL, '2026-04-14 08:00:00', '早晨测量'),
(2, 'blood_pressure', 120.0, 80.0, '2026-04-14 09:00:00', '日常监测'),
(3, 'heart_rate', 82, NULL, '2026-04-14 07:00:00', '起床后测量');

-- 管理员账号（密码：admin123）
INSERT INTO admin (account, password, name) VALUES
('admin', '$2a$10$RgOG.DjOVcf/t3PB8FVL4ecyB2cyPZSONKWJaTPeFN3t5eZ.LL/oC', '系统管理员');

-- 测试数据完成
SELECT '数据库初始化完成！' AS message;