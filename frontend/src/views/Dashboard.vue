<template>
  <Layout>
    <div class="dashboard">
      <!-- 欢迎横幅 -->
      <div class="welcome-banner">
        <div class="welcome-content">
          <h1 class="welcome-title">{{ greeting }}，{{ userInfo.name || '用户' }}</h1>
          <p class="welcome-subtitle">{{ currentDateTime }}</p>
          <p class="welcome-message">今天也要关注健康哦！</p>
        </div>
        <div class="welcome-actions">
          <el-button type="primary" size="large" @click="router.push('/medication')">
            <el-icon><Bell /></el-icon>
            <span>查看用药提醒</span>
          </el-button>
          <el-button size="large" @click="router.push('/health')">
            <el-icon><Monitor /></el-icon>
            <span>记录健康数据</span>
          </el-button>
        </div>
      </div>
      
      <!-- 数据概览 -->
      <div class="stats-overview">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :lg="6">
            <div class="stat-card" @click="router.push('/medication')">
              <div class="stat-icon today-medication">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-content">
                <h3 class="stat-value">{{ medStats.total }}</h3>
                <p class="stat-label">今日用药</p>
                <p class="stat-desc">
                  {{ medStats.pending }} 待服用 · {{ medStats.taken }} 已服用
                </p>
              </div>
            </div>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="6">
            <div class="stat-card" @click="router.push('/health')">
              <div class="stat-icon health-records">
                <el-icon><Histogram /></el-icon>
              </div>
              <div class="stat-content">
                <h3 class="stat-value">{{ latestHealthCount }}</h3>
                <p class="stat-label">健康指标</p>
                <p class="stat-desc">
                  {{ latestHealthTypes }}
                </p>
              </div>
            </div>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="6">
            <div class="stat-card">
              <div class="stat-icon medication-adherence">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stat-content">
                <h3 class="stat-value">{{ adherenceRate }}%</h3>
                <p class="stat-label">用药依从率</p>
                <p class="stat-desc">
                  过去7天
                </p>
              </div>
            </div>
          </el-col>
          
          <el-col :xs="24" :sm="12" :lg="6">
            <div class="stat-card" @click="doCheckIn">
              <div class="stat-icon check-in">
                <el-icon><Check /></el-icon>
              </div>
              <div class="stat-content">
                <h3 class="stat-value">{{ checkInDays }}</h3>
                <p class="stat-label">连续打卡</p>
                <p class="stat-desc">
                  {{ todayChecked ? '今日已打卡' : '点击打卡' }}
                </p>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <!-- 主要内容区 -->
      <div class="main-content">
        <el-row :gutter="20">
          <!-- 左侧：今日用药提醒 -->
          <el-col :xs="24" :lg="16">
            <div class="card today-medication-card">
              <div class="card-header">
                <h2 class="card-title">
                  <el-icon><Bell /></el-icon>
                  <span>今日用药提醒</span>
                  <span class="time-info">当前 {{ currentTime }}</span>
                </h2>
                <el-button 
                  type="primary" 
                  size="large" 
                  @click="router.push('/medication')"
                  plain
                >
                  全部用药
                </el-button>
              </div>
              
              <div class="medication-list" v-loading="loadingMedication">
                <div 
                  v-for="med in todayMedications" 
                  :key="med.id" 
                  class="medication-item"
                  :class="{ 'urgent': isUrgent(med.take_time) }"
                >
                  <div class="medication-info">
                    <h3 class="medication-name">{{ med.medicine_name }}</h3>
                    <p class="medication-details">
                      <span class="dosage">{{ med.dosage }}</span>
                      <span class="frequency">{{ med.frequency }}</span>
                    </p>
                    <p class="medication-remark" v-if="med.remark">
                      📝 {{ med.remark }}
                    </p>
                  </div>
                  
                  <div class="medication-actions">
                    <div class="time-info">
                      <el-icon><Clock /></el-icon>
                      <span class="take-time">{{ med.take_time }}</span>
                    </div>
                    
                    <div class="status-tags">
                      <el-tag 
                        :type="getStatusType(med.status)"
                        size="large"
                      >
                        {{ getStatusText(med.status) }}
                      </el-tag>
                    </div>
                    
                    <div class="action-buttons">
                      <el-button
                        v-if="med.status === 'pending'"
                        type="success"
                        size="large"
                        @click="markAsTaken(med)"
                        :loading="markLoading === med.id"
                      >
                        标记已服
                      </el-button>
                      
                      <el-button
                        v-if="med.status === 'pending'"
                        type="warning"
                        size="large"
                        @click="markAsSkipped(med)"
                        :loading="markLoading === med.id"
                      >
                        跳过
                      </el-button>
                      
                      <el-button
                        v-if="med.status !== 'pending'"
                        type="info"
                        size="large"
                        @click="resetStatus(med)"
                        :loading="markLoading === med.id"
                      >
                        重置
                      </el-button>
                    </div>
                  </div>
                </div>
                
                <!-- 空状态 -->
                <div v-if="!loadingMedication && todayMedications.length === 0" class="empty-state">
                  <el-icon size="60"><Bell /></el-icon>
                  <p>今日暂无用药提醒</p>
                  <el-button 
                    type="primary" 
                    size="large"
                    @click="router.push('/medication')"
                  >
                    去添加用药提醒
                  </el-button>
                </div>
              </div>
              
              <!-- 快速添加 -->
              <div class="quick-add">
                <el-input
                  v-model="newMedication.name"
                  placeholder="输入药品名称..."
                  size="large"
                  @keyup.enter="addQuickMedication"
                >
                  <template #prepend>
                    <el-icon><FirstAidKit /></el-icon>
                  </template>
                </el-input>
                <el-button 
                  type="primary" 
                  size="large" 
                  @click="addQuickMedication"
                  :loading="addingMedication"
                >
                  快速添加
                </el-button>
              </div>
            </div>
            
            <!-- 健康趋势 -->
            <div class="card health-trends-card">
              <div class="card-header">
                <h2 class="card-title">
                  <el-icon><TrendCharts /></el-icon>
                  <span>健康趋势</span>
                </h2>
                <el-select 
                  v-model="trendType" 
                  size="large"
                  @change="loadHealthTrends"
                >
                  <el-option label="血压" value="blood_pressure" />
                  <el-option label="血糖" value="blood_sugar" />
                  <el-option label="心率" value="heart_rate" />
                  <el-option label="体重" value="weight" />
                </el-select>
              </div>
              
              <div class="trend-chart" v-loading="loadingTrend">
                <div v-if="trendData.length > 0" class="chart-bars">
                  <div
                    v-for="(point, idx) in trendData"
                    :key="idx"
                    class="chart-col"
                  >
                    <div class="bar-value">{{ point.value }}</div>
                    <div class="bar-wrap">
                      <div
                        class="bar"
                        :style="{ height: getBarHeight(point.value) + 'px' }"
                        :class="point.level"
                      ></div>
                    </div>
                    <div class="bar-date">{{ point.date }}</div>
                  </div>
                </div>
                <div v-else class="chart-placeholder">
                  <el-icon size="40"><Histogram /></el-icon>
                  <p>暂无{{ getTrendLabel() }}数据</p>
                  <p class="placeholder-desc">记录健康数据后可查看趋势图</p>
                  <el-button type="primary" size="large" @click="router.push('/health')">
                    去记录
                  </el-button>
                </div>
              </div>
              <div class="chart-hint" v-if="trendData.length > 0">
                {{ getTrendLabel() }} · 单位：{{ trendUnit }} · 近7天数据
              </div>
            </div>
          </el-col>
          
          <!-- 右侧：快捷功能 -->
          <el-col :xs="24" :lg="8">
            <!-- 快捷操作 -->
            <div class="card quick-actions-card">
              <h2 class="card-title">
                <el-icon><Operation /></el-icon>
                <span>快捷操作</span>
              </h2>
              
              <div class="quick-actions">
                <el-button 
                  type="primary" 
                  size="large"
                  @click="handleEmergencyCall"
                  class="emergency-btn"
                >
                  <el-icon><PhoneFilled /></el-icon>
                  <span>紧急呼叫</span>
                </el-button>
                
                <el-button 
                  size="large"
                  @click="router.push('/health')"
                  class="action-btn"
                >
                  <el-icon><Monitor /></el-icon>
                  <span>记录血压</span>
                </el-button>
                
                <el-button 
                  size="large"
                  @click="router.push('/health')"
                  class="action-btn"
                >
                  <el-icon><Sugar /></el-icon>
                  <span>记录血糖</span>
                </el-button>
                
                <el-button 
                  size="large"
                  @click="doCheckIn"
                  class="action-btn"
                  :type="todayChecked ? 'success' : 'default'"
                >
                  <el-icon><Check /></el-icon>
                  <span>{{ todayChecked ? '已打卡' : '健康打卡' }}</span>
                </el-button>
              </div>
            </div>
            
            <!-- 健康小贴士 -->
            <div class="card health-tips-card">
              <h2 class="card-title">
                <el-icon><Lightning /></el-icon>
                <span>今日健康小贴士</span>
              </h2>
              
              <div class="tips-content">
                <div class="tip-item" v-for="(tip, index) in healthTips" :key="index">
                  <el-icon class="tip-icon"><Promotion /></el-icon>
                  <div class="tip-text">{{ tip }}</div>
                </div>
              </div>
            </div>
            
            <!-- 紧急联系人 -->
            <div class="card emergency-contacts-card">
              <h2 class="card-title">
                <el-icon><PhoneFilled /></el-icon>
                <span>紧急联系人</span>
              </h2>
              
              <div class="contacts-list" v-loading="loadingContacts">
                <div 
                  v-for="contact in emergencyContacts" 
                  :key="contact.name"
                  class="contact-item"
                  @click="handleContactClick(contact)"
                >
                  <div class="contact-info">
                    <div class="contact-name">{{ contact.name }}</div>
                    <div class="contact-phone">{{ contact.phone }}</div>
                  </div>
                  <el-icon class="call-icon"><Phone /></el-icon>
                </div>
              </div>
              
              <div class="contacts-notice">
                <p>💡 点击联系人可直接拨打电话</p>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <!-- 适老化提示 -->
      <div class="elderly-reminders">
        <h3><el-icon><InfoFilled /></el-icon> 每日健康提醒：</h3>
        <p>1. 请按时服药，勿擅自停药或更改药量</p>
        <p>2. 定期测量血压血糖，记录健康状况</p>
        <p>3. 紧急情况请立即拨打120</p>
        <p>4. 如有不适，请及时就医</p>
        <p>5. 起床时先坐2分钟再站起，防止头晕</p>
        <p>6. 饮食少盐少油，每天吃够5种蔬菜水果</p>
      </div>

      <!-- 健康知识卡片 -->
      <div class="card knowledge-card">
        <h2 class="card-title">
          <el-icon><Reading /></el-icon>
          <span>健康知识科普</span>
        </h2>
        <div class="knowledge-content">
          <div class="knowledge-item" v-for="(item, idx) in knowledgeItems" :key="idx">
            <div class="knowledge-icon">{{ item.emoji }}</div>
            <div class="knowledge-text">
              <h4>{{ item.title }}</h4>
              <p>{{ item.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/utils/request'
import Layout from '@/components/Layout.vue'
import { 
  Bell, Clock, Histogram, TrendCharts, Check,
  Operation, PhoneFilled, Monitor, Sugar,
  Promotion, Phone, InfoFilled, FirstAidKit, Reading
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.locale('zh-cn')
dayjs.extend(relativeTime)

const router = useRouter()
const authStore = useAuthStore()

// 用户信息
const userInfo = computed(() => authStore.userInfo || {})

// 当前日期时间
const currentDateTime = ref('')
const currentTime = ref('')

// 问候语
const greeting = computed(() => {
  const hour = dayjs().hour()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

// 加载状态
const loadingMedication = ref(false)
const loadingTrend = ref(false)
const loadingContacts = ref(false)
const markLoading = ref(null)

// 今日用药提醒数据（从后端获取）
const todayMedications = ref([])
const medStats = ref({ total: 0, pending: 0, taken: 0, skipped: 0 })

// 最新健康记录
const latestHealthRecords = ref([])
const latestHealthCount = computed(() => latestHealthRecords.value.length)
const latestHealthTypes = computed(() => {
  if (latestHealthRecords.value.length === 0) return '暂无记录'
  const types = latestHealthRecords.value.map(r => {
    const map = { blood_pressure: '血压', blood_sugar: '血糖', heart_rate: '心率', weight: '体重' }
    return map[r.type] || r.type
  })
  return [...new Set(types)].join('、')
})

// 紧急联系人（从后端获取，有丰富的默认数据）
const emergencyContacts = ref([
  { name: '120急救中心', phone: '120', type: 'emergency' },
  { name: '子女：张小三', phone: '13800000001', type: 'family' },
  { name: '社区养老服务中心', phone: '400-123-4567', type: 'community' },
  { name: '家庭医生', phone: '010-12345678', type: 'doctor' },
  { name: '物业服务中心', phone: '010-87654321', type: 'community' },
])

// 健康小贴士（丰富的健康知识库，每次随机展示5条）
const allTips = [
  '每天保证7-8小时充足睡眠，有助于身体恢复',
  '饮食清淡，每日食盐摄入不超过5克（约一啤酒瓶盖）',
  '适量运动，每天散步30分钟，可做太极拳',
  '保持心情愉快，避免情绪激动和大喜大悲',
  '定期测量血压血糖，做好健康记录',
  '每日饮水1500-1700毫升，少量多次饮用温水',
  '多吃深色蔬菜和水果，每天至少5种蔬菜水果',
  '起床时先在床上坐2-3分钟再起身，防止体位性低血压',
  '每晚睡前温水泡脚15-20分钟，有助于改善睡眠',
  '按时服药，不要擅自加减药量或停药',
  '每天晒太阳20-30分钟，促进钙吸收',
  '饭后散步15分钟，帮助消化控制血糖',
  '注意保暖，室内温度保持在18-24度',
  '减少久坐，每坐1小时起身活动5分钟',
  '保持社交活动，与家人朋友多沟通交流',
  '午休时间不宜过长，20-30分钟最佳',
  '睡前2小时避免进食，减轻肠胃负担',
  '定期体检，65岁以上老人建议每年全面体检',
  '外出注意安全，穿防滑鞋，避免恶劣天气出行',
  '学会使用手机紧急呼叫功能，随身携带',
]

// 根据日期种子随机选取5条，同一天看到的内容一致
const healthTips = computed(() => {
  const daySeed = dayjs().format('YYYY-MM-DD').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const shuffled = [...allTips]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = (daySeed + i * 7) % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.slice(0, 5)
})

// 健康趋势数据
const trendType = ref('blood_pressure')
const trendData = ref([])

const typeConfig = {
  blood_pressure: { label: '血压', unit: 'mmHg' },
  blood_sugar:    { label: '血糖', unit: 'mmol/L' },
  heart_rate:     { label: '心率', unit: 'bpm' },
  weight:         { label: '体重', unit: 'kg' },
}

const trendUnit = computed(() => typeConfig[trendType.value]?.unit || '')

// 用药依从率
const adherenceRate = computed(() => {
  const taken = medStats.value.taken
  const total = medStats.value.total
  return total > 0 ? Math.round((taken / total) * 100) : 100
})

// 快速添加用药
const newMedication = ref({ name: '' })
const addingMedication = ref(false)

// 打卡状态
const todayChecked = ref(false)
const checkInDays = ref(15)

// 检查本地存储的打卡状态
const checkLocalCheckIn = () => {
  const today = dayjs().format('YYYY-MM-DD')
  const saved = localStorage.getItem('checkIn_' + today)
  if (saved) {
    todayChecked.value = true
  }
  const streak = parseInt(localStorage.getItem('checkInStreak') || '15')
  checkInDays.value = streak
}

// 健康知识科普数据
const knowledgeItems = ref([
  {
    emoji: '🩺',
    title: '血压正常范围',
    content: '收缩压90-140mmHg，舒张压60-90mmHg。建议每天固定时间测量，测量前静坐5分钟。'
  },
  {
    emoji: '🩸',
    title: '血糖参考值',
    content: '空腹血糖3.9-6.1mmol/L，餐后2小时血糖应低于7.8mmol/L。定期监测有助于糖尿病管理。'
  },
  {
    emoji: '❤️',
    title: '心率健康指标',
    content: '正常静息心率60-100次/分。长期运动的人可能低至50次/分，也是正常的。心率异常时请及时就医。'
  },
  {
    emoji: '⚖️',
    title: 'BMI体重指数',
    content: 'BMI = 体重(kg) / 身高(m)的平方。18.5-24为正常，≥24为超重。老年人适当微胖更健康。'
  },
])

// 页面加载时间
const pageLoadTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))

// 方法
const updateDateTime = () => {
  const now = dayjs()
  currentDateTime.value = now.format('YYYY年MM月DD日 dddd HH:mm')
  currentTime.value = now.format('HH:mm')
}

const isUrgent = (takeTime) => {
  const now = dayjs()
  const take = dayjs(now.format('YYYY-MM-DD') + ' ' + takeTime)
  const diffMinutes = take.diff(now, 'minute')
  return diffMinutes >= -30 && diffMinutes <= 30
}

const getStatusType = (status) => {
  return { pending: 'warning', taken: 'success', skipped: 'info' }[status] || 'info'
}

const getStatusText = (status) => {
  return { pending: '待服用', taken: '已服用', skipped: '已跳过' }[status] || status
}

// 从后端加载今日用药
const loadTodayMedications = async () => {
  loadingMedication.value = true
  try {
    const res = await api.medication.getToday()
    if (res.code === 200) {
      const data = res.data
      todayMedications.value = data.all || []
      medStats.value = data.stats || { total: 0, pending: 0, taken: 0, skipped: 0 }
    }
  } catch (e) {
    console.log('加载用药数据失败，使用空数据')
    todayMedications.value = []
    medStats.value = { total: 0, pending: 0, taken: 0, skipped: 0 }
  } finally {
    loadingMedication.value = false
  }
}

// 标记服药状态（调用后端API）
const markAsTaken = async (med) => {
  markLoading.value = med.id
  try {
    await api.medication.markStatus(med.id, 'taken')
    med.status = 'taken'
    // 更新统计
    medStats.value.taken += 1
    medStats.value.pending -= 1
    ElMessage.success('已标记为已服用')
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    markLoading.value = null
  }
}

const markAsSkipped = async (med) => {
  markLoading.value = med.id
  try {
    await api.medication.markStatus(med.id, 'skipped')
    med.status = 'skipped'
    medStats.value.skipped += 1
    medStats.value.pending -= 1
    ElMessage.info('已标记为已跳过')
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    markLoading.value = null
  }
}

const resetStatus = async (med) => {
  markLoading.value = med.id
  try {
    await api.medication.markStatus(med.id, 'pending')
    const prevStatus = med.status
    med.status = 'pending'
    if (prevStatus === 'taken') { medStats.value.taken -= 1; medStats.value.pending += 1 }
    if (prevStatus === 'skipped') { medStats.value.skipped -= 1; medStats.value.pending += 1 }
    ElMessage.info('已重置为待服用')
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    markLoading.value = null
  }
}

// 快速添加用药（调用后端API）
const addQuickMedication = async () => {
  if (!newMedication.value.name.trim()) {
    ElMessage.warning('请输入药品名称')
    return
  }
  addingMedication.value = true
  try {
    const res = await api.medication.create({
      medicine_name: newMedication.value.name,
      dosage: '1片',
      frequency: '每日1次',
      take_time: dayjs().add(1, 'hour').format('HH:mm'),
      remark: '请按医嘱服用'
    })
    if (res.code === 200) {
      todayMedications.value.push(res.data)
      medStats.value.total += 1
      medStats.value.pending += 1
      newMedication.value.name = ''
      ElMessage.success('用药提醒已添加')
    }
  } catch (e) {
    ElMessage.error('添加失败')
  } finally {
    addingMedication.value = false
  }
}

// 加载健康趋势（从后端获取）
const loadHealthTrends = async () => {
  loadingTrend.value = true
  try {
    const res = await api.health.getLatest()
    if (res.code === 200 && res.data) {
      // 获取最新健康记录
      latestHealthRecords.value = res.data.latest || []

      // 获取趋势数据
      const trends = res.data.trends || {}
      const typeData = trends[trendType.value] || []
      
      if (typeData.length > 0) {
        trendData.value = typeData.map(item => {
          const d = dayjs(item.time)
          let level = 'normal'
          const v = item.value
          
          if (trendType.value === 'blood_pressure') {
            if (v >= 140) level = 'high'
            else if (v < 90) level = 'low'
          } else if (trendType.value === 'blood_sugar') {
            if (v > 7.0) level = 'high'
            else if (v < 3.9) level = 'low'
          } else if (trendType.value === 'heart_rate') {
            if (v > 100) level = 'high'
            else if (v < 60) level = 'low'
          }
          
          return {
            date: d.format('MM/DD'),
            value: typeof v === 'number' ? (Number.isInteger(v) ? v : v.toFixed(1)) : v,
            rawValue: v,
            level,
            remark: item.remark
          }
        })
      } else {
        trendData.value = []
      }
    }
  } catch (e) {
    console.log('加载健康趋势失败')
    trendData.value = []
  } finally {
    loadingTrend.value = false
  }
}

// 柱状图高度计算
const getBarHeight = (val) => {
  const nums = trendData.value.map(d => d.rawValue).filter(v => typeof v === 'number')
  if (nums.length === 0) return 20
  const max = Math.max(...nums)
  const min = Math.min(...nums)
  if (max === min) return 60
  const numVal = typeof val === 'number' ? val : parseFloat(val)
  return 20 + ((numVal - min) / (max - min)) * 120
}

const getTrendLabel = () => {
  return typeConfig[trendType.value]?.label || trendType.value
}

// 加载紧急联系人
const loadEmergencyContacts = async () => {
  loadingContacts.value = true
  try {
    const res = await api.elder.getEmergencyContacts()
    if (res.code === 200 && res.data && res.data.contacts) {
      emergencyContacts.value = res.data.contacts
    }
  } catch (e) {
    console.log('加载联系人失败，使用默认数据')
  } finally {
    loadingContacts.value = false
  }
}

const handleEmergencyCall = () => {
  ElMessageBox.confirm(
    '即将拨打120急救电话，是否继续？',
    '紧急呼叫',
    {
      confirmButtonText: '确认拨打',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    window.location.href = 'tel:120'
  }).catch(() => {})
}

const doCheckIn = () => {
  if (!todayChecked.value) {
    todayChecked.value = true
    checkInDays.value += 1
    const today = dayjs().format('YYYY-MM-DD')
    localStorage.setItem('checkIn_' + today, 'done')
    localStorage.setItem('checkInStreak', String(checkInDays.value))
    ElMessage.success('健康打卡成功！今日已打卡 🎉')
  } else {
    ElMessage.info('今日已完成打卡')
  }
}

const handleContactClick = (contact) => {
  ElMessageBox.confirm(
    `是否拨打 ${contact.name}（${contact.phone}）？`,
    '拨打电话',
    {
      confirmButtonText: '拨打',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(() => {
    window.location.href = `tel:${contact.phone.replace(/-/g, '')}`
  }).catch(() => {})
}

// 生命周期
let timer = null
onMounted(() => {
  updateDateTime()
  timer = setInterval(updateDateTime, 60000)
  checkLocalCheckIn()
  
  // 并行加载数据
  loadTodayMedications()
  loadHealthTrends()
  loadEmergencyContacts()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

/* 欢迎横幅 */
.welcome-banner {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: var(--border-radius);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
  box-shadow: var(--box-shadow);
}

.welcome-content {
  flex: 1;
  min-width: 300px;
}

.welcome-title {
  font-size: var(--font-size-xxl);
  margin-bottom: var(--spacing-xs);
  color: white;
}

.welcome-subtitle {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-sm);
  opacity: 0.9;
}

.welcome-message {
  font-size: var(--font-size-base);
  opacity: 0.8;
}

.welcome-actions {
  display: flex;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

/* 数据概览 */
.stats-overview {
  margin-bottom: var(--spacing-lg);
}

.stat-card {
  background: white;
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  box-shadow: var(--box-shadow);
  transition: transform 0.3s, box-shadow 0.3s;
  cursor: pointer;
  height: 100%;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--box-shadow-lg);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.today-medication .stat-icon { background: #e6f7ff; color: #1890ff; }
.health-records .stat-icon { background: #f6ffed; color: #52c41a; }
.medication-adherence .stat-icon { background: #fff7e6; color: #fa8c16; }
.check-in .stat-icon { background: #f9f0ff; color: #722ed1; }

.stat-content { flex: 1; }

.stat-value {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
  color: var(--text-primary);
}

.stat-label {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.stat-desc {
  font-size: var(--font-size-sm);
  color: var(--text-disabled);
}

/* 卡片样式 */
.card {
  background: white;
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--box-shadow);
}

/* 主要内容区：列不拉伸等高 */
.main-content .el-row {
  align-items: flex-start;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
  gap: var(--spacing-md);
}

.card-title {
  font-size: var(--font-size-lg);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0;
}

.time-info {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-left: var(--spacing-sm);
}

/* 今日用药提醒 */
.today-medication-card {
  height: auto;
}

.medication-list {
  margin-bottom: var(--spacing-lg);
}

.medication-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  margin-bottom: var(--spacing-md);
  background: #f8f9fa;
  transition: all 0.3s;
}

.medication-item.urgent {
  background: #fff2f0;
  border-left: 4px solid #ff4d4f;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.medication-info { flex: 1; }

.medication-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-bottom: var(--spacing-xs);
  color: var(--text-primary);
}

.medication-details {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.medication-details .dosage { margin-right: var(--spacing-md); }

.medication-remark {
  font-size: var(--font-size-sm);
  color: var(--text-disabled);
  margin: 0;
}

.medication-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-sm);
  min-width: 200px;
}

.take-time { font-weight: 600; }
.status-tags { margin-bottom: var(--spacing-xs); }
.action-buttons { display: flex; gap: var(--spacing-xs); }

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--text-secondary);
}

.empty-state p {
  margin: var(--spacing-md) 0;
  font-size: var(--font-size-base);
}

.quick-add {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.quick-add .el-input { flex: 1; }

/* 健康趋势 */
.health-trends-card {
  height: auto;
}

.trend-chart {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 0 8px;
  overflow: visible;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 240px;
  gap: 8px;
  width: 100%;
  padding-bottom: 4px;
  overflow: visible;
}

.chart-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.bar-value {
  font-size: 13px;
  color: #444;
  margin-bottom: 6px;
  font-weight: 600;
  line-height: 1;
  flex-shrink: 0;
}

.bar-wrap {
  display: flex;
  align-items: flex-end;
  height: 170px;
  flex-shrink: 0;
}

.bar {
  width: 32px;
  border-radius: 6px 6px 0 0;
  background: #91d5ff;
  transition: height 0.5s;
  min-height: 6px;
}

.bar.high { background: #ff7875; }
.bar.low  { background: #ffc53d; }
.bar.normal { background: #73d13d; }

.bar-date {
  font-size: 12px;
  color: #aaa;
  margin-top: 8px;
  line-height: 1;
  flex-shrink: 0;
}

.chart-hint {
  text-align: center;
  font-size: 13px;
  color: #aaa;
  margin-top: 12px;
}

.chart-placeholder {
  text-align: center;
  color: var(--text-secondary);
}

.placeholder-desc { font-size: var(--font-size-sm); margin-top: var(--spacing-xs); }

/* 快捷操作 */
.quick-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.emergency-btn {
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  border: none;
  color: white;
  font-weight: 600;
  height: 60px;
}

.emergency-btn:hover { opacity: 0.9; }
.action-btn { height: 60px; font-size: var(--font-size-base); }

/* 健康小贴士 */
.tips-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: #f6ffed;
  border-radius: var(--border-radius-sm);
  border-left: 4px solid #52c41a;
}

.tip-icon { color: #52c41a; margin-top: 2px; }
.tip-text { flex: 1; font-size: var(--font-size-sm); color: var(--text-primary); line-height: 1.5; }

/* 紧急联系人 */
.contacts-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.contact-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: #f8f9fa;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  transition: all 0.3s;
}

.contact-item:hover { background: #e6f7ff; transform: translateX(5px); }

.contact-info { flex: 1; }

.contact-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.contact-phone { font-size: var(--font-size-sm); color: var(--text-secondary); }
.call-icon { color: var(--primary-color); font-size: 20px; }

.contacts-notice {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm);
  background: #fffbe6;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  color: #ad6800;
  text-align: center;
}

/* 适老化提示 */
.elderly-reminders {
  background: linear-gradient(135deg, #fff7e6 0%, #fff2cc 100%);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  margin-top: var(--spacing-lg);
  border-left: 6px solid #faad14;
}

.elderly-reminders h3 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: #ad6800;
  margin-bottom: var(--spacing-md);
}

.elderly-reminders p {
  font-size: var(--font-size-base);
  color: #874d00;
  margin-bottom: var(--spacing-xs);
  line-height: 1.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .welcome-banner { flex-direction: column; align-items: stretch; text-align: center; }
  .welcome-actions { justify-content: center; }
  .card-header { flex-direction: column; align-items: stretch; text-align: center; }
  .medication-item { flex-direction: column; align-items: stretch; gap: var(--spacing-md); }
  .medication-actions { min-width: auto; width: 100%; align-items: stretch; }
  .action-buttons { justify-content: center; }
  .quick-add { flex-direction: column; }
}

@media (max-width: 480px) {
  .welcome-banner { padding: var(--spacing-lg); }
  .welcome-title { font-size: var(--font-size-xl); }
  .stat-card { flex-direction: column; text-align: center; padding: var(--spacing-md); }
  .medication-item { padding: var(--spacing-sm); }
}

/* 健康知识卡片 */
.knowledge-card { margin-top: var(--spacing-lg); }

.knowledge-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--spacing-md);
}

.knowledge-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%);
  border-radius: var(--border-radius-sm);
  border-left: 4px solid #1890ff;
  transition: transform 0.2s;
}

.knowledge-item:hover {
  transform: translateX(5px);
}

.knowledge-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.knowledge-text {
  flex: 1;
}

.knowledge-text h4 {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.knowledge-text p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}
</style>
