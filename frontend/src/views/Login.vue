<template>
  <div class="login-page">
    <!-- 背景装饰 -->
    <div class="login-bg"></div>
    
    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- 标题 -->
      <div class="login-header">
        <h1 class="login-title">智慧养老平台</h1>
        <p class="login-subtitle">关爱健康，守护幸福晚年</p>
      </div>
      
      <!-- 登录表单 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        @keyup.enter="handleLogin"
      >
        <!-- 手机号 / 管理员账号 -->
        <el-form-item prop="phone">
          <el-input
            v-model="loginForm.phone"
            :placeholder="loginForm.role === 'admin' ? '请输入管理员账号' : '请输入手机号'"
            size="large"
            :maxlength="loginForm.role === 'admin' ? 50 : 11"
            @input="validatePhone"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 密码 -->
        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            :show-password="true"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>
        
        <!-- 验证码登录切换（管理员不显示） -->
        <div class="login-type" v-if="loginForm.role !== 'admin'">
          <el-radio-group v-model="loginType" @change="handleLoginTypeChange">
            <el-radio label="password">密码登录</el-radio>
            <el-radio label="code">验证码登录</el-radio>
          </el-radio-group>
        </div>
        
        <!-- 验证码输入（验证码登录时显示） -->
        <el-form-item v-if="loginType === 'code'" prop="code">
          <div class="code-input-group">
            <el-input
              v-model="loginForm.code"
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
        
        <!-- 角色选择 -->
        <div class="role-selection">
          <span class="role-label">身份：</span>
          <el-radio-group v-model="loginForm.role" @change="handleRoleChange">
            <el-radio label="elder">老人</el-radio>
            <el-radio label="child">子女</el-radio>
            <el-radio label="admin">管理员</el-radio>
          </el-radio-group>
        </div>
        
        <!-- 登录按钮 -->
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="loading"
            @click="handleLogin"
            class="login-button"
          >
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
        
        <!-- 注册链接 -->
        <div class="register-link">
          还没有账号？
          <router-link to="/register" class="link">立即注册</router-link>
        </div>
      </el-form>
      
      <!-- 适老化提示 -->
      <div class="elderly-tips">
        <p>📱 操作提示：</p>
        <ul>
          <li>点击屏幕任何地方都可放大字体</li>
          <li>忘记密码请联系客服重置</li>
          <li>紧急情况请拨打120或家人电话</li>
        </ul>
      </div>
    </div>
    
    <!-- 页脚 -->
    <footer class="login-footer">
      <p>© 2026 银发数字化·智慧养老平台 | 咨询热线：400-123-4567</p>
      <p>声明：本平台不做医疗诊断，仅为健康管理辅助工具</p>
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Message } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const loginFormRef = ref(null)

// 登录类型
const loginType = ref('password')

// 验证码倒计时
const codeCountdown = ref(0)
let countdownTimer = null

// 登录表单
const loginForm = reactive({
  phone: '',
  password: '',
  code: '',
  role: 'elder'
})

// 验证规则（根据登录类型和角色动态切换）
const loginRules = computed(() => {
  const isAdmin = loginForm.role === 'admin'
  const rules = {
    phone: [
      { required: true, message: isAdmin ? '请输入管理员账号' : '请输入手机号', trigger: 'blur' }
    ]
  }

  // 非管理员角色才校验手机号格式
  if (!isAdmin) {
    rules.phone.push({ 
      pattern: /^1[3-9]\d{9}$/,
      message: '请输入正确的手机号',
      trigger: 'blur'
    })
  }
  
  if (loginType.value === 'password') {
    rules.password = [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { 
        min: 6, 
        max: 20, 
        message: '密码长度在 6 到 20 个字符',
        trigger: 'blur'
      }
    ]
  } else {
    rules.code = [
      { required: true, message: '请输入验证码', trigger: 'blur' },
      { 
        min: 6, 
        max: 6, 
        message: '验证码为6位数字',
        trigger: 'blur'
      }
    ]
  }
  
  return rules
})

// 加载状态
const loading = ref(false)

// 验证手机号格式（管理员角色不限制）
const validatePhone = () => {
  if (loginForm.role !== 'admin') {
    loginForm.phone = loginForm.phone.replace(/\D/g, '')
  }
}

// 发送验证码
const sendVerificationCode = async () => {
  if (!loginForm.phone.match(/^1[3-9]\d{9}$/)) {
    ElMessage.error('请输入正确的手机号')
    return
  }

  try {
    const result = await authStore.sendVerificationCode(loginForm.phone)
    
    if (result.success) {
      ElMessage.success('验证码已发送')
      
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

// 登录类型切换
const handleLoginTypeChange = (type) => {
  if (type === 'password') {
    loginForm.code = ''
  } else {
    loginForm.password = ''
  }
}

// 角色切换
const handleRoleChange = (role) => {
  let roleText = '老人'
  if (role === 'child') roleText = '子女'
  if (role === 'admin') roleText = '管理员'
  ElMessage.info(`已切换为${roleText}身份`)
  
  // 切换角色时清空并重新预填
  loginForm.phone = ''
  loginForm.password = ''
  loginForm.code = ''
  loginType.value = 'password'
  if (import.meta.env.DEV) {
    if (role === 'admin') {
      loginForm.phone = 'admin'
      loginForm.password = 'admin123'
    } else {
      loginForm.phone = '13500000001'
      loginForm.password = '123456'
    }
  }
}

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    
    loading.value = true
    
    let result
    
    // 管理员走独立登录接口
    if (loginForm.role === 'admin') {
      result = await authStore.adminLogin(loginForm.phone, loginForm.password)
    } else {
      // 普通用户登录
      const loginData = {
        phone: loginForm.phone,
        loginType: loginType.value,
        role: loginForm.role
      }
      
      if (loginType.value === 'password') {
        loginData.password = loginForm.password
      } else {
        loginData.code = loginForm.code
      }
      
      result = await authStore.login(loginData)
    }
    
    if (result.success) {
      ElMessage.success(result.message || '登录成功')
    } else {
      ElMessage.error(result.error || '登录失败')
    }
  } catch (error) {
    console.error('登录失败:', error)
    ElMessage.error('登录失败：' + (error.message || '请检查网络'))
  } finally {
    loading.value = false
  }
}

// 初始化默认账号（便于测试）
const initTestAccount = () => {
  // 只有在开发环境下显示测试账号
  if (import.meta.env.DEV) {
    if (loginForm.role === 'admin') {
      loginForm.phone = 'admin'
      loginForm.password = 'admin123'
      ElMessage.info('已填充管理员测试账号，密码：admin123')
    } else {
      loginForm.phone = '13500000001'
      loginForm.password = '123456'
      ElMessage.info('已填充测试账号（老人），密码：123456')
    }
  }
}

// 组件挂载时初始化
initTestAccount()
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
}

.login-bg {
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

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.login-card {
  background: white;
  border-radius: var(--border-radius);
  padding: var(--spacing-xl) var(--spacing-xxl);
  width: 100%;
  max-width: 480px;
  box-shadow: var(--box-shadow-lg);
  z-index: 1;
  position: relative;
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.login-title {
  font-size: var(--font-size-xxl);
  color: var(--primary-color);
  margin-bottom: var(--spacing-sm);
}

.login-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
}

.login-type {
  margin-bottom: var(--spacing-md);
  font-size: var(--font-size-sm);
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
}

.role-label {
  font-weight: 600;
  margin-right: var(--spacing-sm);
}

.login-button {
  width: 100%;
  font-size: var(--font-size-lg);
  height: 52px;
  margin-top: var(--spacing-md);
}

.register-link {
  text-align: center;
  margin-top: var(--spacing-lg);
  font-size: var(--font-size-base);
}

.register-link .link {
  color: var(--primary-color);
  font-weight: 600;
  margin-left: var(--spacing-xs);
  text-decoration: underline;
}

.elderly-tips {
  margin-top: var(--spacing-xl);
  padding: var(--spacing-md);
  background: #fffbe6;
  border-left: 4px solid #faad14;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
}

.elderly-tips p {
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
  color: #ad6800;
}

.elderly-tips ul {
  margin-left: var(--spacing-md);
  color: var(--text-secondary);
}

.elderly-tips li {
  margin-bottom: var(--spacing-xs);
}

.login-footer {
  margin-top: var(--spacing-xl);
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: var(--font-size-sm);
  z-index: 1;
}

.login-footer p {
  margin: var(--spacing-xs) 0;
}

@media (max-width: 480px) {
  .login-card {
    padding: var(--spacing-lg);
  }
  
  .login-title {
    font-size: var(--font-size-xl);
  }
}
</style>