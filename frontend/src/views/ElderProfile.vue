<template>
  <Layout>
    <div class="elder-profile">
      <!-- 页面标题 -->
      <div class="page-header">
        <h1 class="page-title">
          <el-icon><UserFilled /></el-icon>
          <span>老人档案管理</span>
        </h1>
        <p class="page-subtitle">请完善个人信息，便于健康管理</p>
      </div>
      
      <!-- 主要信息卡片 -->
      <div class="main-profile-card" v-loading="loadingProfile">
        <el-form
          ref="profileFormRef"
          :model="profileForm"
          :rules="profileRules"
          label-width="120px"
          label-position="left"
          size="large"
        >
          <el-row :gutter="30">
            <!-- 基本信息 -->
            <el-col :xs="24" :lg="12">
              <div class="form-section">
                <h3 class="section-title">
                  <el-icon><User /></el-icon>
                  <span>基本信息</span>
                </h3>
                
                <el-form-item label="姓 名" prop="name">
                  <el-input
                    v-model="profileForm.name"
                    placeholder="请输入姓名"
                    :maxlength="20"
                  >
                    <template #prefix>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                
                <el-form-item label="年 龄" prop="age">
                  <el-input-number
                    v-model="profileForm.age"
                    :min="0"
                    :max="150"
                    :step="1"
                    placeholder="请输入年龄"
                    controls-position="right"
                    style="width: 100%"
                  />
                </el-form-item>
                
                <el-form-item label="性 别" prop="gender">
                  <el-radio-group v-model="profileForm.gender">
                    <el-radio label="male">男</el-radio>
                    <el-radio label="female">女</el-radio>
                    <el-radio label="other">其他</el-radio>
                  </el-radio-group>
                </el-form-item>
                
                <el-form-item label="身 高" prop="height">
                  <div class="input-with-unit">
                    <el-input-number
                      v-model="profileForm.height"
                      :min="50"
                      :max="250"
                      :step="0.5"
                      placeholder="请输入身高"
                      controls-position="right"
                      style="width: 100%"
                    />
                    <span class="unit">cm</span>
                  </div>
                </el-form-item>
                
                <el-form-item label="体 重" prop="weight">
                  <div class="input-with-unit">
                    <el-input-number
                      v-model="profileForm.weight"
                      :min="20"
                      :max="300"
                      :step="0.1"
                      placeholder="请输入体重"
                      controls-position="right"
                      style="width: 100%"
                    />
                    <span class="unit">kg</span>
                  </div>
                </el-form-item>
              </div>
            </el-col>
            
            <!-- 紧急联系人 -->
            <el-col :xs="24" :lg="12">
              <div class="form-section">
                <h3 class="section-title">
                  <el-icon><PhoneFilled /></el-icon>
                  <span>紧急联系人</span>
                </h3>
                
                <el-form-item label="联系人姓名" prop="emergency_contact">
                  <el-input
                    v-model="profileForm.emergency_contact"
                    placeholder="请输入紧急联系人姓名"
                    :maxlength="50"
                  >
                    <template #prefix>
                      <el-icon><User /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                
                <el-form-item label="联系电话" prop="emergency_phone">
                  <el-input
                    v-model="profileForm.emergency_phone"
                    placeholder="请输入紧急联系电话"
                    :maxlength="11"
                    @input="validatePhone"
                  >
                    <template #prefix>
                      <el-icon><Phone /></el-icon>
                    </template>
                  </el-input>
                </el-form-item>
                
                <div class="emergency-actions">
                  <el-button
                    type="primary"
                    size="large"
                    @click="testEmergencyCall"
                    :disabled="!profileForm.emergency_phone"
                  >
                    <el-icon><PhoneFilled /></el-icon>
                    <span>测试拨打</span>
                  </el-button>
                  
                  <el-button
                    size="large"
                    @click="showBackupDialog"
                  >
                    <el-icon><Plus /></el-icon>
                    <span>添加备用联系人</span>
                  </el-button>
                </div>

                <!-- 备用联系人列表 -->
                <div v-if="backupContacts.length > 0" class="backup-contacts">
                  <div class="backup-title">备用联系人（{{ backupContacts.length }}）</div>
                  <div v-for="(contact, idx) in backupContacts" :key="idx" class="backup-item">
                    <div class="backup-info">
                      <span class="backup-name">{{ contact.name }}</span>
                      <span class="backup-phone">{{ contact.phone }}</span>
                    </div>
                    <el-button type="danger" size="small" plain @click="removeBackup(idx)">删除</el-button>
                  </div>
                </div>
              </div>
            </el-col>
            
            <!-- 健康病史 -->
            <el-col :xs="24">
              <div class="form-section">
                <h3 class="section-title">
                  <el-icon><FirstAidKit /></el-icon>
                  <span>健康病史</span>
                </h3>
                
                <el-form-item label="既往病史" prop="history_disease">
                  <el-input
                    v-model="profileForm.history_disease"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入既往病史（如：高血压、糖尿病、心脏病等）"
                    :maxlength="500"
                    show-word-limit
                  />
                </el-form-item>
                
                <el-form-item label="过敏药物" prop="allergy_medicine">
                  <el-input
                    v-model="profileForm.allergy_medicine"
                    type="textarea"
                    :rows="2"
                    placeholder="请输入过敏药物（如：青霉素、头孢等）"
                    :maxlength="500"
                    show-word-limit
                  />
                </el-form-item>
              </div>
            </el-col>
          </el-row>
          
          <!-- 表单操作 -->
          <div class="form-actions">
            <el-button
              type="primary"
              size="large"
              :loading="saving"
              @click="saveProfile"
            >
              <el-icon><Check /></el-icon>
              <span>{{ saving ? '保存中...' : '保存信息' }}</span>
            </el-button>
            
            <el-button
              size="large"
              @click="resetForm"
            >
              <el-icon><Refresh /></el-icon>
              <span>重置</span>
            </el-button>
            
            <el-button
              type="info"
              size="large"
              plain
              @click="printProfile"
            >
              <el-icon><Printer /></el-icon>
              <span>打印档案</span>
            </el-button>
          </div>
        </el-form>
      </div>
      
      <!-- 健康指标卡片 -->
      <div class="health-indicators-card" v-loading="loadingHealth">
        <h2 class="card-title">
          <el-icon><Histogram /></el-icon>
          <span>健康指标概览</span>
          <span class="card-subtitle" v-if="latestHealthTime">（最近更新：{{ latestHealthTime }}）</span>
        </h2>
        
        <el-row :gutter="20" class="indicators-grid">
          <el-col :xs="12" :sm="6" v-for="indicator in healthIndicators" :key="indicator.name">
            <div class="indicator-item" :class="indicator.status">
              <div class="indicator-icon">
                <el-icon><component :is="indicator.icon" /></el-icon>
              </div>
              <div class="indicator-content">
                <h3 class="indicator-value">{{ indicator.value }}</h3>
                <p class="indicator-name">{{ indicator.name }}</p>
                <p class="indicator-status">{{ indicator.statusText }}</p>
              </div>
            </div>
          </el-col>
        </el-row>

        <div class="indicator-actions">
          <el-button type="primary" size="large" @click="goToHealth">
            <el-icon><Plus /></el-icon> 去记录健康数据
          </el-button>
        </div>
      </div>
      
      <!-- 健康建议 -->
      <div class="health-advice-card">
        <h2 class="card-title">
          <el-icon><ChatDotRound /></el-icon>
          <span>个性化健康建议</span>
        </h2>
        
        <div class="advice-content">
          <div class="advice-item" v-for="(advice, index) in healthAdvice" :key="index">
            <el-icon class="advice-icon"><Promotion /></el-icon>
            <div class="advice-text">
              <h4>{{ advice.title }}</h4>
              <p>{{ advice.description }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 档案更新记录 -->
      <div class="history-records-card">
        <h2 class="card-title">
          <el-icon><Clock /></el-icon>
          <span>档案更新记录</span>
        </h2>
        
        <el-timeline>
          <el-timeline-item
            v-for="record in updateRecords"
            :key="record.id"
            :timestamp="record.time"
            :type="record.type"
            :hollow="true"
            size="large"
          >
            <div class="record-content">
              <h4>{{ record.title }}</h4>
              <p>{{ record.description }}</p>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
      
      <!-- 档案完成度 -->
      <div class="profile-completion-card">
        <h2 class="card-title">
          <el-icon><CircleCheck /></el-icon>
          <span>档案完成度</span>
        </h2>
        <div class="completion-content">
          <el-progress
            :percentage="completionPercent"
            :color="completionColor"
            :stroke-width="20"
            :text-inside="true"
          />
          <p class="completion-desc">{{ completionDesc }}</p>
          <div class="completion-items">
            <div
              v-for="item in completionItems"
              :key="item.label"
              class="comp-item"
              :class="{ done: item.done }"
            >
              <el-icon><component :is="item.done ? 'CircleCheckFilled' : 'CircleClose'" /></el-icon>
              <span>{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 健康小知识 -->
      <div class="health-knowledge-card">
        <h2 class="card-title">
          <el-icon><Reading /></el-icon>
          <span>老年健康管理知识</span>
        </h2>
        <div class="knowledge-grid">
          <div class="knowledge-item" v-for="(item, idx) in healthKnowledge" :key="idx">
            <div class="k-emoji">{{ item.emoji }}</div>
            <div class="k-content">
              <h4>{{ item.title }}</h4>
              <p>{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 适老化提示 -->
      <div class="elderly-reminders">
        <h3><el-icon><InfoFilled /></el-icon> 重要提示：</h3>
        <ul>
          <li>请确保个人信息准确无误</li>
          <li>紧急联系人电话必须保持畅通</li>
          <li>如有过敏药物，请务必填写</li>
          <li>定期更新健康指标数据</li>
          <li>如有不适，请及时就医</li>
        </ul>
      </div>

      <!-- 添加备用联系人弹窗 -->
      <el-dialog v-model="backupDialogVisible" title="添加备用联系人" width="420px">
        <el-form :model="backupForm" label-width="80px" size="large">
          <el-form-item label="姓名">
            <el-input v-model="backupForm.name" placeholder="联系人姓名" />
          </el-form-item>
          <el-form-item label="电话">
            <el-input v-model="backupForm.phone" placeholder="手机号码" maxlength="11" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button size="large" @click="backupDialogVisible = false">取消</el-button>
          <el-button type="primary" size="large" @click="addBackupContact">添加</el-button>
        </template>
      </el-dialog>
    </div>
  </Layout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  UserFilled, User, PhoneFilled, Phone, Plus,
  FirstAidKit, Check, Refresh, Printer,
  Histogram, ChatDotRound, Clock, InfoFilled,
  Promotion, CircleCheck, CircleCheckFilled, CircleClose, Reading
} from '@element-plus/icons-vue'
import Layout from '@/components/Layout.vue'
import { api } from '@/utils/request'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const router = useRouter()
const goToHealth = () => router.push('/health')

const profileFormRef = ref(null)
const saving = ref(false)
const loadingProfile = ref(false)
const loadingHealth = ref(false)

// 档案表单数据
const profileForm = reactive({
  name: '',
  age: null,
  gender: '',
  height: null,
  weight: null,
  emergency_contact: '',
  emergency_phone: '',
  history_disease: '',
  allergy_medicine: ''
})

// 备用联系人
const backupContacts = ref([])
const backupDialogVisible = ref(false)
const backupForm = reactive({ name: '', phone: '' })

// 验证规则
const profileRules = {
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { min: 2, max: 20, message: '姓名长度在2-20个字符', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  emergency_contact: [
    { required: true, message: '请输入紧急联系人姓名', trigger: 'blur' }
  ],
  emergency_phone: [
    { required: true, message: '请输入紧急联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ]
}

// 健康指标（根据后端数据动态计算）
const healthIndicators = ref([
  { name: '血压', value: '--', status: 'normal', statusText: '未记录', icon: 'Monitor' },
  { name: '血糖', value: '--', status: 'normal', statusText: '未记录', icon: 'Odometer' },
  { name: '心率', value: '--', status: 'normal', statusText: '未记录', icon: 'Timer' },
  { name: 'BMI',  value: '--', status: 'normal', statusText: '未记录', icon: 'Scale' },
])

const latestHealthTime = computed(() => {
  // 从最近的健康记录获取时间
  const records = updateRecords.value.filter(r => r.title.includes('健康'))
  if (records.length > 0) return records[0].time
  return ''
})

// 健康建议（根据档案数据动态生成）
const healthAdvice = computed(() => {
  const advice = []
  
  // 根据病史生成建议
  if (profileForm.history_disease) {
    const diseases = profileForm.history_disease
    if (diseases.includes('高血压')) {
      advice.push({ title: '血压管理', description: '低盐饮食，每日食盐摄入不超过5克，定时服药，定期监测血压变化' })
    }
    if (diseases.includes('糖尿病')) {
      advice.push({ title: '血糖控制', description: '控制碳水化合物摄入，定时定量进餐，遵医嘱使用降糖药物' })
    }
    if (diseases.includes('心脏病') || diseases.includes('冠心病')) {
      advice.push({ title: '心脏保健', description: '避免剧烈运动和情绪激动，随身携带急救药物，定期心电检查' })
    }
    if (diseases.includes('关节炎')) {
      advice.push({ title: '关节保护', description: '注意关节保暖，适量活动关节，避免长时间保持同一姿势' })
    }
  }
  
  // 根据BMI生成建议
  if (profileForm.height && profileForm.weight) {
    const bmi = (profileForm.weight / ((profileForm.height / 100) ** 2)).toFixed(1)
    if (bmi < 18.5) {
      advice.push({ title: '营养补充', description: '体重偏轻，建议增加优质蛋白摄入，如鸡蛋、鱼肉、牛奶等' })
    } else if (bmi > 24) {
      advice.push({ title: '体重管理', description: '体重偏高，建议控制饮食总量，增加散步等轻度运动' })
    }
  }
  
  // 通用建议
  if (profileForm.age && profileForm.age > 65) {
    advice.push({ title: '定期体检', description: '建议每季度检查血压血糖，每年全面体检一次，关注骨密度' })
  }
  advice.push({ title: '运动建议', description: '每天坚持散步30分钟，可做太极拳等轻度运动，注意安全' })
  
  // 保证至少3条
  if (advice.length < 3) {
    advice.push({ title: '饮食建议', description: '均衡饮食，多吃蔬菜水果，适量饮水，少食多餐' })
    advice.push({ title: '作息规律', description: '早睡早起，保证7-8小时睡眠，午休30分钟' })
  }
  
  return advice.slice(0, 6)
})

// 更新记录
const updateRecords = ref([])

// 档案完成度
const completionItems = computed(() => [
  { label: '姓名', done: !!profileForm.name },
  { label: '年龄', done: !!profileForm.age },
  { label: '性别', done: !!profileForm.gender },
  { label: '身高体重', done: !!profileForm.height && !!profileForm.weight },
  { label: '紧急联系人', done: !!profileForm.emergency_contact && !!profileForm.emergency_phone },
  { label: '既往病史', done: !!profileForm.history_disease },
  { label: '过敏药物', done: !!profileForm.allergy_medicine },
])

const completionPercent = computed(() => {
  const done = completionItems.value.filter(i => i.done).length
  return Math.round((done / completionItems.value.length) * 100)
})

const completionColor = computed(() => {
  const p = completionPercent.value
  if (p >= 80) return '#52c41a'
  if (p >= 50) return '#faad14'
  return '#ff4d4f'
})

const completionDesc = computed(() => {
  const p = completionPercent.value
  if (p === 100) return '档案信息已完整填写，非常棒！'
  if (p >= 80) return '档案信息基本完整，建议补充剩余项'
  if (p >= 50) return '还有部分信息未填写，建议尽快完善'
  return '档案信息尚不完整，请填写基本信息以便更好地管理健康'
})

// 老年健康知识
const healthKnowledge = ref([
  { emoji: '🧓', title: '老年人的合理饮食', desc: '食物多样化，谷类为主，粗细搭配。每天12种以上食物，每周25种以上。多吃鱼禽蛋奶和豆制品，适量吃瘦肉。' },
  { emoji: '🚶', title: '适合老年人的运动', desc: '推荐散步、太极拳、八段锦、游泳等。每周至少150分钟中等强度有氧运动，分5次进行，每次30分钟。运动前热身5分钟。' },
  { emoji: '😴', title: '改善睡眠质量', desc: '保持规律作息，每天同一时间睡觉和起床。睡前避免喝茶、咖啡。卧室保持安静、黑暗、凉爽。如有睡眠障碍请就医。' },
  { emoji: '🧠', title: '预防认知功能下降', desc: '多动脑、多社交、多学习新事物。读书、下棋、做手工、学习使用手机都有帮助。保持积极乐观的心态非常重要。' },
  { emoji: '🦴', title: '骨质疏松预防', desc: '65岁以上老人建议每天补充钙1200mg，维生素D 800-1000IU。多晒太阳，适量运动。女性绝经后更应关注骨密度。' },
  { emoji: '👁️', title: '眼部保健', desc: '60岁以上老人每年做一次眼底检查。控制用眼时间，每用眼30分钟休息5分钟。如有视力下降、视物模糊请及时就医。' },
])

// 从后端加载档案
const loadProfile = async () => {
  loadingProfile.value = true
  try {
    const res = await api.elder.getProfile()
    if (res.code === 200 && res.data) {
      const d = res.data
      Object.assign(profileForm, {
        name: d.name || '',
        age: d.age || null,
        gender: d.gender || '',
        height: d.height || null,
        weight: d.weight || null,
        emergency_contact: d.emergency_contact || '',
        emergency_phone: d.emergency_phone || '',
        history_disease: d.history_disease || '',
        allergy_medicine: d.allergy_medicine || ''
      })
    }
  } catch (e) {
    console.log('加载档案失败，使用空表单')
  } finally {
    loadingProfile.value = false
  }
}

// 从后端加载健康数据，计算指标
const loadHealthIndicators = async () => {
  loadingHealth.value = true
  try {
    const res = await api.health.getLatest()
    if (res.code === 200 && res.data) {
      const latest = res.data.latest || []
      
      // 更新血压
      const bp = latest.find(r => r.type === 'blood_pressure')
      if (bp) {
        healthIndicators.value[0].value = `${bp.value1}/${bp.value2}`
        if (bp.value1 >= 140 || bp.value2 >= 90) {
          healthIndicators.value[0].status = 'danger'
          healthIndicators.value[0].statusText = '偏高'
        } else if (bp.value1 < 90 || bp.value2 < 60) {
          healthIndicators.value[0].status = 'warning'
          healthIndicators.value[0].statusText = '偏低'
        } else {
          healthIndicators.value[0].status = 'normal'
          healthIndicators.value[0].statusText = '正常'
        }
      }

      // 更新血糖
      const bs = latest.find(r => r.type === 'blood_sugar')
      if (bs) {
        healthIndicators.value[1].value = bs.value1
        if (bs.value1 > 7.0) {
          healthIndicators.value[1].status = 'danger'
          healthIndicators.value[1].statusText = '偏高'
        } else if (bs.value1 < 3.9) {
          healthIndicators.value[1].status = 'warning'
          healthIndicators.value[1].statusText = '偏低'
        } else {
          healthIndicators.value[1].status = 'normal'
          healthIndicators.value[1].statusText = '正常'
        }
      }

      // 更新心率
      const hr = latest.find(r => r.type === 'heart_rate')
      if (hr) {
        healthIndicators.value[2].value = hr.value1
        if (hr.value1 > 100) {
          healthIndicators.value[2].status = 'warning'
          healthIndicators.value[2].statusText = '偏快'
        } else if (hr.value1 < 60) {
          healthIndicators.value[2].status = 'warning'
          healthIndicators.value[2].statusText = '偏慢'
        } else {
          healthIndicators.value[2].status = 'normal'
          healthIndicators.value[2].statusText = '正常'
        }
      }

      // 更新BMI（从档案身高体重计算）
      if (profileForm.height && profileForm.weight) {
        const bmi = (profileForm.weight / ((profileForm.height / 100) ** 2)).toFixed(1)
        healthIndicators.value[3].value = bmi
        if (bmi < 18.5) {
          healthIndicators.value[3].status = 'warning'
          healthIndicators.value[3].statusText = '偏瘦'
        } else if (bmi > 24) {
          healthIndicators.value[3].status = 'warning'
          healthIndicators.value[3].statusText = '偏重'
        } else {
          healthIndicators.value[3].status = 'normal'
          healthIndicators.value[3].statusText = '正常'
        }
      }

      // 添加更新记录
      if (latest.length > 0) {
        latest.forEach(r => {
          const typeMap = { blood_pressure: '血压', blood_sugar: '血糖', heart_rate: '心率', weight: '体重' }
          updateRecords.value.push({
            id: r.id,
            time: r.record_time || dayjs().format('YYYY-MM-DD HH:mm'),
            type: 'primary',
            title: `记录${typeMap[r.type] || r.type}`,
            description: `数值：${r.value1}${r.value2 ? '/' + r.value2 : ''}${r.remark ? '（' + r.remark + '）' : ''}`
          })
        })
      }
    }
  } catch (e) {
    console.log('加载健康数据失败')
  } finally {
    loadingHealth.value = false
  }
}

// 方法
const validatePhone = () => {
  profileForm.emergency_phone = profileForm.emergency_phone.replace(/\D/g, '')
}

const testEmergencyCall = () => {
  ElMessageBox.confirm(
    `是否拨打紧急电话：${profileForm.emergency_phone}？`,
    '测试紧急呼叫',
    {
      confirmButtonText: '拨打',
      cancelButtonText: '取消',
      type: 'warning',
    }
  ).then(() => {
    window.location.href = `tel:${profileForm.emergency_phone}`
  }).catch(() => {})
}

const showBackupDialog = () => {
  backupForm.name = ''
  backupForm.phone = ''
  backupDialogVisible.value = true
}

const addBackupContact = () => {
  if (!backupForm.name.trim() || !backupForm.phone.trim()) {
    ElMessage.warning('请填写完整信息')
    return
  }
  backupContacts.value.push({ name: backupForm.name, phone: backupForm.phone })
  backupDialogVisible.value = false
  ElMessage.success('备用联系人已添加')
}

const removeBackup = (idx) => {
  backupContacts.value.splice(idx, 1)
}

// 保存档案（调用后端API）
const saveProfile = async () => {
  if (!profileFormRef.value) return
  try {
    await profileFormRef.value.validate()
    saving.value = true
    
    const res = await api.elder.updateProfile({
      name: profileForm.name,
      age: profileForm.age,
      gender: profileForm.gender,
      height: profileForm.height,
      weight: profileForm.weight,
      emergency_contact: profileForm.emergency_contact,
      emergency_phone: profileForm.emergency_phone,
      history_disease: profileForm.history_disease,
      allergy_medicine: profileForm.allergy_medicine
    })
    
    if (res.code === 200) {
      // 添加更新记录
      updateRecords.value.unshift({
        id: Date.now(),
        time: dayjs().format('YYYY-MM-DD HH:mm'),
        type: 'success',
        title: '更新个人信息',
        description: '保存档案信息修改'
      })
      
      // 重新加载健康指标
      loadHealthIndicators()
      
      ElMessage.success(res.message || '档案信息已保存')
    }
  } catch (error) {
    if (error !== false) {
      console.error('保存失败:', error)
    }
  } finally {
    saving.value = false
  }
}

// 重置表单（重新从后端加载）
const resetForm = () => {
  ElMessageBox.confirm(
    '确定要重置表单吗？将恢复为服务器上的数据。',
    '重置确认',
    {
      confirmButtonText: '确定重置',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    loadProfile()
    ElMessage.success('已重置为最新数据')
  }).catch(() => {})
}

const printProfile = () => {
  window.print()
}

// 生命周期
onMounted(() => {
  loadProfile()
  loadHealthIndicators()
})
</script>

<style scoped>
.elder-profile {
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面标题 */
.page-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 100%);
  border-radius: var(--border-radius);
}

.page-title {
  font-size: var(--font-size-xxl);
  color: var(--primary-color);
  margin-bottom: var(--spacing-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.page-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
}

/* 主要信息卡片 */
.main-profile-card {
  background: white;
  border-radius: var(--border-radius);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--box-shadow);
}

.form-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: var(--font-size-lg);
  color: var(--primary-color);
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: var(--spacing-sm);
}

.input-with-unit {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.input-with-unit .el-input-number { flex: 1; }

.unit {
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  min-width: 40px;
  text-align: center;
}

.emergency-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  flex-wrap: wrap;
}

/* 备用联系人 */
.backup-contacts {
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background: #f8f9fa;
  border-radius: var(--border-radius-sm);
}

.backup-title {
  font-size: 14px;
  color: #888;
  margin-bottom: 10px;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}

.backup-item:last-child { border-bottom: none; }

.backup-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.backup-name { font-weight: 600; }
.backup-phone { color: #888; }

.form-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--border-light);
  flex-wrap: wrap;
}

/* 健康指标卡片 */
.health-indicators-card,
.health-advice-card,
.history-records-card,
.profile-completion-card,
.health-knowledge-card {
  background: white;
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  box-shadow: var(--box-shadow);
}

.card-title {
  font-size: var(--font-size-lg);
  color: var(--primary-color);
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: var(--spacing-sm);
}

.card-subtitle {
  font-size: 13px;
  color: #aaa;
  font-weight: 400;
}

.indicators-grid { margin-top: var(--spacing-lg); }

.indicator-item {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  transition: all 0.3s;
  cursor: pointer;
}

.indicator-item:hover {
  transform: translateY(-3px);
  box-shadow: var(--box-shadow);
}

.indicator-item.normal { background: linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%); border-left: 4px solid #52c41a; }
.indicator-item.warning { background: linear-gradient(135deg, #fff7e6 0%, #ffd591 100%); border-left: 4px solid #fa8c16; }
.indicator-item.danger  { background: linear-gradient(135deg, #fff2f0 0%, #ffccc7 100%); border-left: 4px solid #ff4d4f; }

.indicator-icon {
  width: 50px; height: 50px; border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
  display: flex; align-items: center; justify-content: center; font-size: 24px;
}

.indicator-item.normal .indicator-icon { color: #52c41a; }
.indicator-item.warning .indicator-icon { color: #fa8c16; }
.indicator-item.danger .indicator-icon { color: #ff4d4f; }

.indicator-content { flex: 1; }
.indicator-value { font-size: var(--font-size-lg); font-weight: 600; margin-bottom: var(--spacing-xs); color: var(--text-primary); }
.indicator-name { font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--spacing-xs); }
.indicator-status { font-size: var(--font-size-xs); font-weight: 500; }

.indicator-item.normal .indicator-status { color: #52c41a; }
.indicator-item.warning .indicator-status { color: #fa8c16; }
.indicator-item.danger .indicator-status { color: #ff4d4f; }

.indicator-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--spacing-md);
}

/* 健康建议 */
.advice-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.advice-item {
  padding: var(--spacing-md);
  background: #f8f9fa;
  border-radius: var(--border-radius-sm);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  border-left: 4px solid var(--primary-color);
}

.advice-icon { color: var(--primary-color); font-size: 20px; margin-top: 2px; }
.advice-text h4 { font-size: var(--font-size-base); color: var(--text-primary); margin-bottom: var(--spacing-xs); }
.advice-text p { font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.5; }

/* 历史记录 */
.record-content { padding: var(--spacing-sm) 0; }
.record-content h4 { font-size: var(--font-size-base); color: var(--text-primary); margin-bottom: var(--spacing-xs); }
.record-content p { font-size: var(--font-size-sm); color: var(--text-secondary); }

/* 适老化提示 */
.elderly-reminders {
  background: linear-gradient(135deg, #fff7e6 0%, #fff2cc 100%);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  margin-top: var(--spacing-lg);
  border-left: 6px solid #faad14;
}

.elderly-reminders h3 {
  display: flex; align-items: center; gap: var(--spacing-sm);
  color: #ad6800; margin-bottom: var(--spacing-md);
}

.elderly-reminders ul { list-style: none; padding-left: 0; }

.elderly-reminders li {
  font-size: var(--font-size-base); color: #874d00;
  margin-bottom: var(--spacing-xs); padding-left: var(--spacing-md); position: relative;
}

.elderly-reminders li:before {
  content: "•"; color: #faad14; font-size: 20px; position: absolute; left: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .main-profile-card { padding: var(--spacing-lg); }
  .form-actions { flex-direction: column; align-items: stretch; }
  .form-actions .el-button { width: 100%; margin-bottom: var(--spacing-sm); }
  .emergency-actions { flex-direction: column; }
  .emergency-actions .el-button { width: 100%; }
  .advice-content { grid-template-columns: 1fr; }
  .knowledge-grid { grid-template-columns: 1fr; }
  .completion-items { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
  .page-header { padding: var(--spacing-lg) var(--spacing-md); }
  .page-title { font-size: var(--font-size-xl); flex-direction: column; gap: var(--spacing-xs); }
  .indicators-grid { grid-template-columns: 1fr 1fr; }
}

/* 档案完成度 */
.completion-content { margin-top: var(--spacing-lg); }
.completion-desc { font-size: var(--font-size-sm); color: var(--text-secondary); margin: var(--spacing-md) 0; }
.completion-items {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-sm);
}
.comp-item {
  display: flex; align-items: center; gap: var(--spacing-sm);
  font-size: var(--font-size-sm); color: var(--text-disabled);
  padding: var(--spacing-sm);
  background: #f5f5f5;
  border-radius: var(--border-radius-sm);
}
.comp-item.done { color: #52c41a; background: #f6ffed; }

/* 健康知识 */
.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}
.knowledge-item {
  display: flex; align-items: flex-start; gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: #fafafa;
  border-radius: var(--border-radius-sm);
  border-left: 4px solid #1890ff;
  transition: transform 0.2s;
}
.knowledge-item:hover { transform: translateX(4px); }
.k-emoji { font-size: 28px; flex-shrink: 0; }
.k-content { flex: 1; }
.k-content h4 { font-size: var(--font-size-base); color: var(--text-primary); margin-bottom: var(--spacing-xs); }
.k-content p { font-size: var(--font-size-sm); color: var(--text-secondary); line-height: 1.6; margin: 0; }
</style>

<style>
@media print {
  .layout-header, .layout-footer, .emergency-float, .form-actions,
  .elderly-reminders, .indicator-actions, .el-button { display: none !important; }
  .elder-profile { max-width: 100%; margin: 0; padding: 0; }
  .main-profile-card, .health-indicators-card, .health-advice-card, .history-records-card {
    box-shadow: none; border: 1px solid #333; page-break-inside: avoid;
  }
  body { font-size: 14pt !important; color: #000 !important; background: white !important; }
}
</style>
