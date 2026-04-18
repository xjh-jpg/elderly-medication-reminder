<template>
  <div class="register-page">
    <!-- 背景装饰 -->
    <div class="register-bg"></div>
    
    <!-- 注册卡片 -->
    <div class="register-card">
      <!-- 标题 -->
      <div class="register-header">
        <h1 class="register-title">注册新账号</h1>
        <p class="register-subtitle">加入智慧养老平台，开启健康管理</p>
      </div>
      
      <!-- 注册表单 -->
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        @keyup.enter="handleRegister"
      >
        <!-- 手机号 -->
        <el-form-item prop="phone">
          <el-input
            v-model="registerForm.phone"
            placeholder="请输入手机号"
            size="large"
            :maxlength="11"
            @input="validatePhone"
          >
            <template #prefix>
              <el-icon><Phone /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 验证码 -->
        <el-form-item prop="code">
          <div class="code-input-group">
            <el-input
              v-model="registerForm.code"
              placeholder="请输入验证码"
              size="large"
              :maxlength="6"
            >
              <template #prefix>
                <el-icon><Message /></el-icon>
              </template>
            </el-input>
            <el-button
              :disabled="codeCountdown > 0"
              @click="sendVerificationCode"
              size="large"
            >
              {{ codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        
        <!-- 姓名 -->
        <el-form-item prop="name">
          <el-input
            v-model="registerForm.name"
            placeholder="请输入姓名"
            size="large"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 密码 -->
        <el-form-item prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码（6-20位）"
            size="large"
            :show-password="true"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 确认密码 -->
        <el-form-item prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请确认密码"
            size="large"
            :show-password="true"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 角色选择 -->
        <div class="role-selection">
          <span class="role-label">注册身份：</span>
          <el-radio-group v-model="registerForm.role" @change="handleRoleChange">
            <el-radio label="elder">我是老人</el-radio>
            <el-radio label="child">我是子女</el-radio>
          </el-radio-group>
        </div>
        
        <!-- 角色提示 -->
        <div v-if="registerForm.role === 'elder'" class="role-tips elder-tips">
          <el-icon><InfoFilled /></el-icon>
          <span>老人账号：可管理个人健康档案、用药提醒</span>
        </div>
        <div v-else class="role-tips child-tips">
          <el-icon><InfoFilled /></el-icon>
          <span>子女账号：可查看家人健康数据、设置提醒</span>
        </div>
        
        <!-- 用户协议 -->
        <div class="agreement">
          <el-checkbox v-model="agreementChecked">
            我已阅读并同意
            <a href="javascript:void(0)" @click="showAgreement" class="agreement-link">《用户协议》</a>
            和
            <a href="javascript:void(0)" @click="showPrivacy" class="agreement-link">《隐私政策》</a>
          </el-checkbox>
        </div>
        
        <!-- 注册按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleRegister"
            class="register-button"
            :disabled="!agreementChecked"
          >
            {{ loading ? '注册中...' : '立即注册' }}
          </el-button>
        </el-form-item>
        
        <!-- 登录链接 -->
        <div class="login-link">
          已有账号？
          <router-link to="/login" class="link">立即登录</router-link>
        </div>
      </el-form>
      
      <!-- 安全提示 -->
      <div class="security-tips">
        <h3>🔒 安全提示：</h3>
        <ul>
          <li>请使用常用手机号注册</li>
          <li>密码请勿过于简单，建议包含字母和数字</li>
          <li>请勿向他人透露您的账号信息</li>
          <li>注册后请完善个人资料</li>
        </ul>
      </div>
    </div>
    
    <!-- 页脚 -->
    <footer class="register-footer">
      <p>© 2026 银发数字化·智慧养老平台 | 咨询热线：400-123-4567</p>
      <p>声明：本平台不做医疗诊断，仅为健康管理辅助工具</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Phone, Message, User, Lock, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const registerFormRef = ref(null)

// 验证码倒计时
const codeCountdown = ref(0)
let countdownTimer = null

// 用户协议勾选
const agreementChecked = ref(false)

// 注册表单
const registerForm = reactive({
  phone: '',
  code: '',
  name: '',
  password: '',
  confirmPassword: '',
  role: 'elder'
})

// 验证规则
const registerRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { 
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号',
      trigger: 'blur'
    }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { 
      pattern: /^\d{6}$/,
      message: '验证码为6位数字',
      trigger: 'blur'
    }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { 
      min: 2, 
      max: 20, 
      message: '姓名长度在 2 到 20 个字符',
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { 
      min: 6, 
      max: 20, 
      message: '密码长度在 6 到 20 个字符',
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 加载状态
const loading = ref(false)

// 验证手机号格式
const validatePhone = () => {
  registerForm.phone = registerForm.phone.replace(/\D/g, '')
}

// 发送验证码
const sendVerificationCode = async () => {
  if (!registerForm.phone.match(/^1[3-9]\d{9}$/)) {
    ElMessage.error('请输入正确的手机号')
    return
  }

  try {
    const result = await authStore.sendVerificationCode(registerForm.phone)
    
    if (result.success) {
      ElMessage.success('验证码已发送到您的手机')
      
      // 开始倒计时
      codeCountdown.value = 60
      countdownTimer = setInterval(() => {
        if (codeCountdown.value > 0) {
          codeCountdown.value--
        } else {
          clearInterval(countdownTimer)
        }
      }, 1000)
    } else {
      ElMessage.error(result.error)
    }
  } catch (error) {
    ElMessage.error('发送验证码失败')
  }
}

// 角色切换
const handleRoleChange = (role) => {
  const roleText = role === 'elder' ? '老人' : '子女'
  ElMessage.info(`已选择${roleText}身份`)
}

// 显示用户协议
const showAgreement = () => {
  ElMessageBox.alert(`
    <div style="max-height: 400px; overflow-y: auto; font-size: 16px;">
      <h2>智慧养老平台用户协议</h2>
      <p>欢迎使用智慧养老平台！请您仔细阅读以下条款：</p>
      <h3>一、服务内容</h3>
      <p>1. 本平台提供健康档案管理、用药提醒、健康记录等功能</p>
      <p>2. 平台不提供医疗诊断服务，仅为健康管理辅助工具</p>
      <h3>二、用户责任</h3>
      <p>1. 保证提供的信息真实、准确、完整</p>
      <p>2. 妥善保管账号密码，不得转让或出借</p>
      <h3>三、隐私保护</h3>
      <p>1. 保护用户个人信息安全</p>
      <p>2. 未经用户同意，不向第三方提供个人信息</p>
      <h3>四、免责声明</h3>
      <p>1. 本平台仅为辅助工具，不替代专业医疗建议</p>
      <p>2. 紧急情况请及时拨打120或就医</p>
    </div>
  `, '用户协议', {
    confirmButtonText: '我已阅读并同意',
    dangerouslyUseHTMLString: true,
    customClass: 'agreement-modal'
  })
}

// 显示隐私政策
const showPrivacy = () => {
  ElMessageBox.alert(`
    <div style="max-height: 400px; overflow-y: auto; font-size: 16px;">
      <h2>隐私政策</h2>
      <p>我们高度重视您的隐私保护：</p>
      <h3>一、信息收集</h3>
      <p>1. 手机号、姓名等基本信息</p>
      <p>2. 健康数据（血压、血糖、心率等）</p>
      <p>3. 用药记录和提醒信息</p>
      <h3>二、信息使用</h3>
      <p>1. 为您提供个性化的健康管理服务</p>
      <p>2. 数据分析以改进服务质量</p>
      <p>3. 紧急情况下的联系通知</p>
      <h3>三、信息保护</h3>
      <p>1. 采用加密技术保护数据传输</p>
      <p>2. 严格控制员工访问权限</p>
      <p>3. 定期进行安全审计</p>
      <h3>四、用户权利</h3>
      <p>1. 随时查看、修改个人信息</p>
      <p>2. 申请删除个人数据</p>
      <p>3. 注销账号的权利</p>
    </div>
  `, '隐私政策', {
    confirmButtonText: '我已阅读并理解',
    dangerouslyUseHTMLString: true,
    customClass: 'agreement-modal'
  })
}

// 注册处理
const handleRegister = async () => {
  if (!registerFormRef.value) return
  
  try {
    await registerFormRef.value.validate()
    
    if (!agreementChecked.value) {
      ElMessage.error('请阅读并同意用户协议和隐私政策')
      return
    }
    
    const result = await authStore.register(
      registerForm.phone,
      registerForm.password,
      registerForm.name,
      registerForm.role,
      registerForm.code
    )
    
    if (result.success) {
      ElMessage.success('注册成功！')
      router.push('/dashboard')
    } else {
      ElMessage.error(result.error)
    }
  } catch (error) {
    console.error('注册失败:', error)
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

.register-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
  animation: float 20s ease-in-out infinite;
}

.register-card {
  background: white;
  border-radius: var(--border-radius);
  padding: var(--spacing-xl) var(--spacing-xxl);
  width: 100%;
  max-width: 500px;
  box-shadow: var(--box-shadow-lg);
  z-index: 1;
  position: relative;
}

.register-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.register-title {
  font-size: var(--font-size-xxl);
  color: var(--primary-color);
  margin-bottom: var(--spacing-sm);
}

.register-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
}

.code-input-group {
  display: flex;
  gap: var(--spacing-sm);
}

.code-input-group .el-input {
  flex: 1;
}

.role-selection {
  margin: var(--spacing-md) 0;
  padding: var(--spacing-sm);
  background: #f8f9fa;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-base);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.role-label {
  font-weight: 600;
  color: var(--text-primary);
}

.role-tips {
  margin: var(--spacing-sm) 0;
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.elder-tips {
  background: #e6f7ff;
  color: #1890ff;
  border-left: 4px solid #1890ff;
}

.child-tips {
  background: #f6ffed;
  color: #52c41a;
  border-left: 4px solid #52c41a;
}

.role-tips .el-icon {
  font-size: var(--font-size-base);
}

.agreement {
  margin: var(--spacing-md) 0;
  font-size: var(--font-size-sm);
}

.agreement-link {
  color: var(--primary-color);
  text-decoration: underline;
}

.agreement-link:hover {
  color: var(--primary-dark);
}

.register-button {
  width: 100%;
  font-size: var(--font-size-lg);
  height: 52px;
  margin-top: var(--spacing-md);
}

.login-link {
  text-align: center;
  margin-top: var(--spacing-lg);
  font-size: var(--font-size-base);
}

.login-link .link {
  color: var(--primary-color);
  font-weight: 600;
  margin-left: var(--spacing-xs);
  text-decoration: underline;
}

.security-tips {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-md);
  background: #f6ffed;
  border-left: 4px solid #52c41a;
  border-radius: var(--border-radius-sm);
}

.security-tips h3 {
  color: #389e0d;
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-base);
}

.security-tips ul {
  margin-left: var(--spacing-md);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.security-tips li {
  margin-bottom: var(--spacing-xs);
}

.register-footer {
  margin-top: var(--spacing-xl);
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: var(--font-size-sm);
  z-index: 1;
}

.register-footer p {
  margin: var(--spacing-xs) 0;
}

@media (max-width: 480px) {
  .register-card {
    padding: var(--spacing-lg);
  }
  
  .register-title {
    font-size: var(--font-size-xl);
  }
  
  .role-selection {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

<style>
/* 全局样式 */
.agreement-modal {
  max-width: 600px;
  font-size: 16px !important;
}

.agreement-modal .el-message-box__title {
  font-size: 20px !important;
  font-weight: 600;
  color: var(--primary-color);
}

.agreement-modal .el-message-box__content {
  font-size: 16px !important;
  line-height: 1.6;
}

.agreement-modal .el-message-box__btns {
  padding-top: 20px;
}

.agreement-modal .el-button {
  font-size: 16px !important;
  padding: 12px 24px !important;
}
</style>