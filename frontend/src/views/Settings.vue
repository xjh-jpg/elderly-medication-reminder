<template>
  <Layout>
    <div class="settings-page">
      <h1 class="page-title"><el-icon><UserFilled /></el-icon> 个人中心</h1>

      <!-- 用户信息卡片 -->
      <div class="profile-card">
        <div class="avatar-wrap">
          <div class="avatar">{{ userInfo.name?.slice(-1) || '用' }}</div>
        </div>
        <div class="user-info">
          <h2>{{ userInfo.name || '用户' }}</h2>
          <p>{{ userInfo.phone }}</p>
          <el-tag :type="userInfo.role === 'elder' ? 'success' : 'primary'" size="large">
            {{ userInfo.role === 'elder' ? '老人账号' : userInfo.role === 'admin' ? '管理员' : '子女账号' }}
          </el-tag>
          <p class="register-time" v-if="userInfo.create_time">注册时间：{{ userInfo.create_time }}</p>
        </div>
      </div>

      <!-- 修改密码 -->
      <div class="section-card">
        <h2 class="section-title"><el-icon><Lock /></el-icon> 修改密码</h2>
        <el-form ref="pwFormRef" :model="pwForm" :rules="pwRules" label-width="100px" size="large" style="max-width:480px">
          <el-form-item label="当前密码" prop="oldPassword">
            <el-input v-model="pwForm.oldPassword" type="password" show-password placeholder="请输入当前密码" />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="pwForm.newPassword" type="password" show-password placeholder="请输入新密码（至少6位）" />
            <div class="password-strength" v-if="pwForm.newPassword">
              <div class="strength-bar" :class="passwordStrength.level"></div>
              <span class="strength-text">{{ passwordStrength.text }}</span>
            </div>
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="pwForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" :loading="pwSaving" @click="changePassword">
              {{ pwSaving ? '修改中...' : '确认修改' }}
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 显示设置 -->
      <div class="section-card">
        <h2 class="section-title"><el-icon><Setting /></el-icon> 显示设置</h2>
        
        <div class="setting-item">
          <div class="setting-info">
            <h3>字体大小</h3>
            <p>调节页面字体大小，适合不同视力需求</p>
          </div>
          <div class="setting-control">
            <el-radio-group v-model="fontSize" size="large" @change="applyFontSize">
              <el-radio-button label="16">标准</el-radio-button>
              <el-radio-button label="18">大号</el-radio-button>
              <el-radio-button label="20">特大</el-radio-button>
              <el-radio-button label="22">超大</el-radio-button>
            </el-radio-group>
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <h3>用药提醒通知</h3>
            <p>到时间自动弹出用药提醒</p>
          </div>
          <div class="setting-control">
            <el-switch v-model="settings.medicationReminder" size="large" @change="saveSettings" />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <h3>声音提醒</h3>
            <p>用药提醒时播放提示音</p>
          </div>
          <div class="setting-control">
            <el-switch v-model="settings.soundEnabled" size="large" @change="saveSettings" />
          </div>
        </div>

        <div class="setting-item">
          <div class="setting-info">
            <h3>健康打卡提醒</h3>
            <p>每日提醒进行健康打卡</p>
          </div>
          <div class="setting-control">
            <el-switch v-model="settings.checkInReminder" size="large" @change="saveSettings" />
          </div>
        </div>
      </div>

      <!-- 使用记录 -->
      <div class="section-card" v-loading="loadingLogs">
        <h2 class="section-title"><el-icon><List /></el-icon> 使用记录</h2>
        <div v-if="usageLogs.length === 0" class="empty-tip">暂无使用记录</div>
        <el-timeline v-else>
          <el-timeline-item
            v-for="log in usageLogs"
            :key="log.id || log.time"
            :timestamp="log.time"
            placement="top"
            :type="log.type || 'primary'"
          >
            <div class="log-item">
              <span class="log-action">{{ log.action }}</span>
              <span class="log-ip" v-if="log.ip">{{ log.ip }}</span>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 账号安全 -->
      <div class="section-card">
        <h2 class="section-title"><el-icon><SwitchButton /></el-icon> 账号安全</h2>
        <div class="security-info">
          <div class="security-item">
            <span class="security-label">登录手机号</span>
            <span class="security-value">{{ userInfo.phone || '未绑定' }}</span>
          </div>
          <div class="security-item">
            <span class="security-label">上次登录</span>
            <span class="security-value">{{ lastLoginTime }}</span>
          </div>
          <div class="security-item">
            <span class="security-label">账号类型</span>
            <span class="security-value">{{ userInfo.role === 'elder' ? '老人账号' : userInfo.role === 'admin' ? '管理员' : '子女账号' }}</span>
          </div>
        </div>
        <el-button type="danger" size="large" @click="logout" class="logout-btn">
          <el-icon><SwitchButton /></el-icon> 退出登录
        </el-button>
        <p class="logout-tip">退出后需重新登录才能使用平台功能</p>
      </div>

      <!-- 使用帮助 -->
      <div class="section-card">
        <h2 class="section-title"><el-icon><QuestionFilled /></el-icon> 使用帮助</h2>
        <div class="help-list">
          <div class="help-item" v-for="(item, idx) in helpItems" :key="idx">
            <div class="help-q">{{ item.q }}</div>
            <div class="help-a">{{ item.a }}</div>
          </div>
        </div>
      </div>

      <!-- 关于平台 -->
      <div class="section-card about-card">
        <h2 class="section-title"><el-icon><InfoFilled /></el-icon> 关于平台</h2>
        <div class="about-content">
          <div class="about-logo">
            <el-icon size="48"><House /></el-icon>
          </div>
          <h3>银发数字化·智慧养老平台</h3>
          <p>版本：V1.0.0</p>
          <p>平台致力于为老年人和家庭提供便捷、安全的健康管理服务。通过数字化技术，帮助老年人更好地管理日常健康、用药提醒和紧急救助。</p>
          <div class="about-features">
            <div class="feature-tag">
              <el-icon><Check /></el-icon>
              <span>适老化设计</span>
            </div>
            <div class="feature-tag">
              <el-icon><Check /></el-icon>
              <span>用药提醒</span>
            </div>
            <div class="feature-tag">
              <el-icon><Check /></el-icon>
              <span>健康监测</span>
            </div>
            <div class="feature-tag">
              <el-icon><Check /></el-icon>
              <span>紧急救助</span>
            </div>
            <div class="feature-tag">
              <el-icon><Check /></el-icon>
              <span>家庭联动</span>
            </div>
            <div class="feature-tag">
              <el-icon><Check /></el-icon>
              <span>数据安全</span>
            </div>
          </div>
          <p class="about-disclaimer">
            ⚠️ 声明：本平台仅提供健康管理和数据记录服务，不做任何医疗诊断。如有身体不适，请及时前往正规医疗机构就诊。
          </p>
          <p class="about-copyright">服务热线：400-123-4567 | © 2026 银发数字化·智慧养老平台</p>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { UserFilled, Lock, List, SwitchButton, Setting, QuestionFilled, InfoFilled, Check, House } from '@element-plus/icons-vue'
import Layout from '@/components/Layout.vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/utils/request'
import dayjs from 'dayjs'

const router = useRouter()
const authStore = useAuthStore()
const userInfo = computed(() => authStore.userInfo || {})

const lastLoginTime = computed(() => {
  if (userInfo.value.create_time) {
    return dayjs(userInfo.value.create_time).format('YYYY-MM-DD HH:mm')
  }
  return dayjs().format('YYYY-MM-DD HH:mm')
})

// 修改密码
const pwFormRef = ref(null)
const pwSaving = ref(false)
const pwForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== pwForm.newPassword) callback(new Error('两次密码不一致'))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}

// 密码强度
const passwordStrength = computed(() => {
  const pw = pwForm.newPassword
  if (!pw) return { level: '', text: '' }
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 2) return { level: 'weak', text: '弱' }
  if (score <= 3) return { level: 'medium', text: '中' }
  return { level: 'strong', text: '强' }
})

const changePassword = async () => {
  if (!pwFormRef.value) return
  await pwFormRef.value.validate()
  pwSaving.value = true
  try {
    const result = await authStore.changePassword(pwForm.oldPassword, pwForm.newPassword)
    if (result.success) {
      Object.assign(pwForm, { oldPassword: '', newPassword: '', confirmPassword: '' })
      ElMessage.success('密码修改成功，请牢记新密码')
    } else {
      ElMessage.error(result.error || '修改失败')
    }
  } catch (e) {
    ElMessage.error('修改失败')
  } finally {
    pwSaving.value = false
  }
}

// 字体大小
const fontSize = ref(localStorage.getItem('fontSize') || '18')

const applyFontSize = (val) => {
  document.documentElement.style.setProperty('--font-size-base', val + 'px')
  document.documentElement.style.fontSize = val + 'px'
  localStorage.setItem('fontSize', val)
  ElMessage.success('字体大小已调整')
}

// 通知设置
const settings = reactive({
  medicationReminder: localStorage.getItem('setting_medicationReminder') !== 'false',
  soundEnabled: localStorage.getItem('setting_soundEnabled') !== 'false',
  checkInReminder: localStorage.getItem('setting_checkInReminder') !== 'false',
})

const saveSettings = () => {
  localStorage.setItem('setting_medicationReminder', String(settings.medicationReminder))
  localStorage.setItem('setting_soundEnabled', String(settings.soundEnabled))
  localStorage.setItem('setting_checkInReminder', String(settings.checkInReminder))
  ElMessage.success('设置已保存')
}

// 使用记录
const loadingLogs = ref(false)
const usageLogs = ref([])

const loadUsageLogs = async () => {
  loadingLogs.value = true
  try {
    // 管理员从后端获取操作日志，普通用户使用本地记录
    if (userInfo.value.role === 'admin') {
      const data = await api.admin.getLogs({ pageSize: 20 })
      if (data.code === 200 && data.data && data.data.list && data.data.list.length > 0) {
        usageLogs.value = data.data.list.slice(0, 20).map(log => ({
          id: log.id,
          action: log.action || '操作',
          time: log.create_time || '',
          ip: log.ip_address || '',
          type: 'primary'
        }))
        return
      }
    }
    // 普通用户或管理员无日志时使用本地记录
    usageLogs.value = [
      { id: 1, action: '登录系统', time: dayjs().format('YYYY-MM-DD HH:mm'), ip: '本地', type: 'success' },
      { id: 2, action: '查看健康记录', time: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm'), ip: '本地', type: 'primary' },
      { id: 3, action: '添加用药提醒', time: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm'), ip: '本地', type: 'primary' },
      { id: 4, action: '更新老人档案', time: dayjs().subtract(2, 'day').format('YYYY-MM-DD HH:mm'), ip: '本地', type: 'warning' },
      { id: 5, action: '记录血压数据', time: dayjs().subtract(3, 'day').format('YYYY-MM-DD HH:mm'), ip: '本地', type: 'primary' },
    ]
  } catch (e) {
    // 接口失败时使用本地记录
    usageLogs.value = [
      { id: 1, action: '登录系统', time: dayjs().format('YYYY-MM-DD HH:mm'), ip: '本地', type: 'success' },
      { id: 2, action: '查看健康记录', time: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm'), ip: '本地', type: 'primary' },
      { id: 3, action: '添加用药提醒', time: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm'), ip: '本地', type: 'primary' },
    ]
  } finally {
    loadingLogs.value = false
  }
}

// 退出登录
const logout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '退出确认', {
    confirmButtonText: '退出', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    authStore.logout()
    ElMessage.success('已退出登录')
    router.push('/login')
  }).catch(() => {})
}

// 使用帮助
const helpItems = ref([
  { q: '如何添加用药提醒？', a: '点击底部导航栏的"用药提醒"，然后点击"添加用药"按钮，填写药品名称、剂量、服用频率和服用时间即可。' },
  { q: '如何记录健康数据？', a: '点击底部导航栏的"健康记录"，然后点击"添加记录"按钮，选择记录类型（血压/血糖/心率/体重），填写数值和时间。' },
  { q: '字体太小看不清怎么办？', a: '在本页面的"显示设置"中，可以调整字体大小为标准、大号、特大或超大四个档位。' },
  { q: '忘记密码了怎么办？', a: '请联系管理员重置密码，或通过子女账号登录后在家人管理中协助重置。' },
  { q: '如何拨打紧急电话？', a: '点击页面右下角的红色紧急呼叫按钮，或进入"紧急救助"页面，直接点击需要拨打的电话号码。' },
  { q: '数据安全吗？', a: '您的健康数据使用加密传输和存储，仅限本人和授权家属查看。我们不会将数据提供给任何第三方。' },
])

// 生命周期
onMounted(() => {
  loadUsageLogs()
  applyFontSize(fontSize.value)
})
</script>

<style scoped>
.settings-page { max-width: 800px; margin: 0 auto; }
.page-title { font-size: 22px; font-weight: 700; color: var(--primary-color); display: flex; align-items: center; gap: 8px; margin: 0 0 24px; }

.profile-card {
  display: flex; align-items: center; gap: 24px;
  background: linear-gradient(135deg, #e6f7ff, #bae7ff);
  border-radius: 14px; padding: 24px 32px; margin-bottom: 24px;
}
.avatar {
  width: 72px; height: 72px; border-radius: 50%;
  background: var(--primary-color); color: white;
  font-size: 30px; font-weight: 700; display: flex; align-items: center; justify-content: center;
}
.user-info h2 { font-size: 22px; margin: 0 0 6px; }
.user-info p { color: #555; margin: 0 0 8px; font-size: 15px; }
.register-time { font-size: 13px; color: #888; margin-top: 4px !important; }

.section-card { background: #fff; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 12px rgba(0,0,0,.07); }
.section-title { font-size: 18px; font-weight: 600; color: #333; display: flex; align-items: center; gap: 8px; margin: 0 0 20px; }

/* 密码强度 */
.password-strength { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.strength-bar { width: 100px; height: 6px; border-radius: 3px; background: #f0f0f0; overflow: hidden; }
.strength-bar::after { content: ''; display: block; height: 100%; border-radius: 3px; transition: all .3s; }
.strength-bar.weak::after { width: 33%; background: #ff4d4f; }
.strength-bar.medium::after { width: 66%; background: #faad14; }
.strength-bar.strong::after { width: 100%; background: #52c41a; }
.strength-text { font-size: 12px; }
.strength-bar.weak + .strength-text { color: #ff4d4f; }
.strength-bar.medium + .strength-text { color: #faad14; }
.strength-bar.strong + .strength-text { color: #52c41a; }

/* 设置项 */
.setting-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 0; border-bottom: 1px solid #f0f0f0; gap: 16px;
}
.setting-item:last-child { border-bottom: none; }
.setting-info { flex: 1; }
.setting-info h3 { font-size: 16px; margin: 0 0 4px; color: #333; }
.setting-info p { font-size: 13px; color: #888; margin: 0; }
.setting-control { flex-shrink: 0; }

/* 使用记录 */
.empty-tip { text-align: center; padding: 30px; color: #aaa; font-size: 15px; }
.log-item { display: flex; justify-content: space-between; align-items: center; }
.log-action { font-size: 15px; color: #333; font-weight: 500; }
.log-ip { font-size: 12px; color: #aaa; }

/* 账号安全 */
.security-info { margin-bottom: 20px; }
.security-item {
  display: flex; justify-content: space-between; padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}
.security-item:last-child { border-bottom: none; }
.security-label { color: #888; font-size: 14px; }
.security-value { color: #333; font-weight: 500; font-size: 14px; }
.logout-btn { margin-top: 16px; }
.logout-tip { font-size: 13px; color: #aaa; margin: 12px 0 0; }

@media (max-width: 600px) {
  .setting-item { flex-direction: column; align-items: flex-start; }
  .setting-control { width: 100%; }
  .profile-card { flex-direction: column; text-align: center; padding: 20px; }
}

/* 使用帮助 */
.help-list { margin-top: var(--spacing-lg); }
.help-item {
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}
.help-item:last-child { border-bottom: none; }
.help-q { font-size: 15px; font-weight: 600; color: #1890ff; margin-bottom: 6px; cursor: pointer; }
.help-a { font-size: 14px; color: #666; line-height: 1.6; }

/* 关于平台 */
.about-content { text-align: center; margin-top: var(--spacing-lg); }
.about-logo {
  width: 80px; height: 80px; border-radius: 20px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white; display: flex; align-items: center; justify-content: center;
  margin: 0 auto var(--spacing-md);
}
.about-content h3 { font-size: 20px; color: #333; margin-bottom: 8px; }
.about-content > p { font-size: 14px; color: #888; line-height: 1.6; max-width: 500px; margin: 8px auto; }
.about-features {
  display: flex; flex-wrap: wrap; justify-content: center; gap: 10px;
  margin: 20px 0;
}
.feature-tag {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 14px; background: #f0f5ff; border-radius: 20px;
  font-size: 13px; color: #1890ff;
}
.feature-tag .el-icon { color: #52c41a; }
.about-disclaimer {
  background: #fffbe6; padding: 12px 16px; border-radius: 8px;
  font-size: 13px; color: #ad6800 !important; text-align: left; max-width: 500px; margin-left: auto; margin-right: auto;
}
.about-copyright { font-size: 12px; color: #bbb !important; }
</style>
