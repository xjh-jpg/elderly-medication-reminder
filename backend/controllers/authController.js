const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
require('dotenv').config();

// 用户登录（支持密码登录和验证码登录）
exports.login = async (req, res) => {
  try {
    const { phone, password, code, loginType, role } = req.body;
    
    // 管理员登录走单独逻辑
    if (role === 'admin') {
      const [admins] = await pool.execute(
        'SELECT * FROM admin WHERE account = ?',
        [phone]
      );
      
      if (admins.length === 0) {
        return res.status(401).json({ 
          code: 401, 
          message: '管理员账号不存在' 
        });
      }
      
      const admin = admins[0];
      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({ 
          code: 401, 
          message: '密码错误' 
        });
      }
      
      // 生成管理员JWT令牌
      const token = jwt.sign(
        { 
          id: admin.id, 
          account: admin.account,
          role: 'admin' 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      
      res.json({
        code: 200,
        message: '管理员登录成功',
        data: {
          user: {
            id: admin.id,
            account: admin.account,
            role: 'admin'
          },
          token
        }
      });
      return;
    }

    // 查询用户
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );

    if (users.length === 0) {
      return res.status(401).json({ 
        code: 401, 
        message: '手机号不存在' 
      });
    }

    const user = users[0];
    
    // 检查角色（如果指定了角色）
    if (role && user.role !== role) {
      return res.status(403).json({ 
        code: 403, 
        message: '账号角色不匹配' 
      });
    }
    
    // 验证码登录逻辑
    if (loginType === 'code') {
      // 简单验证码验证（实际项目中应使用Redis或数据库存储验证码）
      if (!code || code !== '123456') {
        return res.status(401).json({ 
          code: 401, 
          message: '验证码错误' 
        });
      }
      
      // 生成JWT令牌
      const token = jwt.sign(
        { 
          id: user.id, 
          phone: user.phone, 
          name: user.name, 
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // 返回用户信息（不包含密码）
      const userInfo = {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
        create_time: user.create_time
      };

      res.json({
        code: 200,
        message: '验证码登录成功',
        data: {
          user: userInfo,
          token
        }
      });
      return;
    }
    
    // 密码登录逻辑
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        code: 401, 
        message: '密码错误' 
      });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { 
        id: user.id, 
        phone: user.phone, 
        name: user.name, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 返回用户信息（不包含密码）
    const userInfo = {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      create_time: user.create_time
    };

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        user: userInfo,
        token
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 用户注册
exports.register = async (req, res) => {
  try {
    const { phone, password, name, role } = req.body;

    // 检查手机号是否已存在
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE phone = ?',
      [phone]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ 
        code: 400, 
        message: '手机号已注册' 
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const [result] = await pool.execute(
      'INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)',
      [phone, hashedPassword, name, role]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ 
        code: 500, 
        message: '注册失败' 
      });
    }

    // 如果是老人账号，创建默认档案
    if (role === 'elder') {
      await pool.execute(
        'INSERT INTO elder_profiles (user_id, name) VALUES (?, ?)',
        [result.insertId, name]
      );
    }

    res.json({
      code: 200,
      message: '注册成功',
      data: {
        id: result.insertId,
        phone,
        name,
        role
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.execute(
      'SELECT id, phone, name, role, create_time FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        code: 404, 
        message: '用户不存在' 
      });
    }

    const user = users[0];

    // 如果是老人，获取档案信息
    if (user.role === 'elder') {
      const [profiles] = await pool.execute(
        'SELECT * FROM elder_profiles WHERE user_id = ?',
        [userId]
      );

      if (profiles.length > 0) {
        user.profile = profiles[0];
      }
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: user
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 修改密码
exports.changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;
    const userId = req.user.id;

    // 获取当前用户密码
    const [users] = await pool.execute(
      'SELECT password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        code: 404, 
        message: '用户不存在' 
      });
    }

    // 验证旧密码
    const isValidPassword = await bcrypt.compare(old_password, users[0].password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        code: 401, 
        message: '旧密码错误' 
      });
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(new_password, 10);

    // 更新密码
    const [result] = await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ 
        code: 500, 
        message: '密码修改失败' 
      });
    }

    res.json({
      code: 200,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 发送验证码
exports.sendVerificationCode = async (req, res) => {
  try {
    const { phone } = req.body;
    
    // 验证手机号格式
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ 
        code: 400, 
        message: '手机号格式不正确' 
      });
    }
    
    // 简单验证码生成（实际项目中应集成短信服务）
    const code = '123456';
    
    // 记录验证码发送（实际项目中应存储到Redis或数据库）
    console.log(`验证码 ${code} 已发送到 ${phone}`);
    
    res.json({
      code: 200,
      message: '验证码发送成功',
      data: {
        phone
        // 实际项目中不应返回验证码，这里为了方便测试说明一下
      }
    });
  } catch (error) {
    console.error('发送验证码错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};

// 检查手机号是否已注册
exports.checkPhone = async (req, res) => {
  try {
    const { phone } = req.params;
    
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE phone = ?',
      [phone]
    );

    res.json({
      code: 200,
      message: '查询成功',
      data: {
        phone,
        registered: existingUsers.length > 0
      }
    });
  } catch (error) {
    console.error('检查手机号错误:', error);
    res.status(500).json({ 
      code: 500, 
      message: '服务器内部错误' 
    });
  }
};