const { body, validationResult } = require('express-validator');

// 验证错误处理
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      code: 400, 
      message: '参数验证失败', 
      errors: errors.array() 
    });
  }
  next();
};

// 登录验证规则（灵活校验，支持密码登录和验证码登录）
const loginValidation = [
  body('phone')
    .matches(/^1[3-9]\d{9}$|^admin$/)
    .withMessage('请输入正确的手机号'),
  body('password')
    .if(body('loginType').not().equals('code'))
    .isLength({ min: 6, max: 20 })
    .withMessage('密码长度6-20位'),
  body('code')
    .if(body('loginType').equals('code'))
    .isLength({ min: 4, max: 6 })
    .withMessage('验证码长度4-6位'),
  validate
];

// 注册验证规则
const registerValidation = [
  body('phone')
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入正确的手机号'),
  body('password')
    .isLength({ min: 6, max: 20 })
    .withMessage('密码长度6-20位'),
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('姓名长度2-50位'),
  body('role')
    .isIn(['elder', 'child'])
    .withMessage('角色必须是elder或child'),
  validate
];

// 老人档案验证
const elderProfileValidation = [
  body('name')
    .isLength({ min: 2, max: 50 })
    .withMessage('姓名长度2-50位'),
  body('age')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('年龄必须在0-150之间'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('性别必须是male、female或other'),
  body('height')
    .optional()
    .isFloat({ min: 50, max: 250 })
    .withMessage('身高必须在50-250cm之间'),
  body('weight')
    .optional()
    .isFloat({ min: 20, max: 300 })
    .withMessage('体重必须在20-300kg之间'),
  body('emergency_phone')
    .optional()
    .matches(/^1[3-9]\d{9}$/)
    .withMessage('请输入正确的紧急联系电话'),
  validate
];

// 用药提醒验证
const medicationValidation = [
  body('medicine_name')
    .isLength({ min: 1, max: 100 })
    .withMessage('药品名称长度1-100位'),
  body('dosage')
    .isLength({ min: 1, max: 50 })
    .withMessage('剂量长度1-50位'),
  body('frequency')
    .isLength({ min: 1, max: 50 })
    .withMessage('频率长度1-50位'),
  body('take_time')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('请输入正确的时间格式(HH:mm)'),
  validate
];

// 健康记录验证
const healthRecordValidation = [
  body('type')
    .isIn(['blood_pressure', 'blood_sugar', 'heart_rate', 'weight'])
    .withMessage('记录类型不正确'),
  body('value1')
    .isFloat()
    .withMessage('值1必须是数字'),
  body('value2')
    .optional()
    .isFloat()
    .withMessage('值2必须是数字'),
  body('record_time')
    .isISO8601()
    .withMessage('请输入正确的时间格式'),
  validate
];

// 管理员登录验证
const adminLoginValidation = [
  body('account')
    .isLength({ min: 3, max: 50 })
    .withMessage('账号长度3-50位'),
  body('password')
    .isLength({ min: 6, max: 20 })
    .withMessage('密码长度6-20位'),
  validate
];

module.exports = {
  loginValidation,
  registerValidation,
  elderProfileValidation,
  medicationValidation,
  healthRecordValidation,
  adminLoginValidation
};