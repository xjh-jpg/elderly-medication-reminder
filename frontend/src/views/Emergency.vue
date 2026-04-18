<template>
  <Layout>
    <div class="emergency-page">
      <div class="emergency-banner">
        <el-icon class="banner-icon"><WarningFilled /></el-icon>
        <div>
          <h1>紧急救助</h1>
          <p>遇到紧急情况，请立即拨打以下电话</p>
        </div>
      </div>

      <!-- 一键急救 -->
      <div class="emergency-grid">
        <div
          v-for="btn in emergencyButtons"
          :key="btn.phone"
          class="emergency-card"
          :class="btn.type"
          @click="callPhone(btn)"
        >
          <div class="e-icon"><el-icon><component :is="btn.icon" /></el-icon></div>
          <div class="e-info">
            <h2>{{ btn.name }}</h2>
            <p class="e-phone">{{ btn.phone }}</p>
            <p class="e-desc">{{ btn.desc }}</p>
          </div>
          <div class="e-call-btn">
            <el-icon><PhoneFilled /></el-icon>
            <span>立即拨打</span>
          </div>
        </div>
      </div>

      <!-- 家庭联系人 -->
      <div class="section-card" v-loading="loadingContacts">
        <h2 class="section-title"><el-icon><User /></el-icon> 家庭联系人</h2>
        <div class="family-list">
          <div
            v-for="(contact, idx) in familyContacts"
            :key="idx"
            class="family-card"
            @click="callPhone(contact)"
          >
            <div class="fc-avatar">{{ contact.name.slice(-1) }}</div>
            <div class="fc-info">
              <h3>{{ contact.name }}</h3>
              <p>{{ contact.relation || '联系人' }} · {{ contact.phone }}</p>
            </div>
            <div class="fc-call">
              <el-icon><PhoneFilled /></el-icon>
            </div>
          </div>
          <div class="add-contact-btn" @click="showAddContact = true">
            <el-icon><Plus /></el-icon>
            <span>添加联系人</span>
          </div>
        </div>
      </div>

      <!-- 居家安全打卡 -->
      <div class="section-card">
        <h2 class="section-title"><el-icon><House /></el-icon> 居家安全检查</h2>
        <p class="section-desc">每日出门前检查以下项目，保障居家安全</p>
        <div class="checklist">
          <div
            v-for="item in safetyChecklist"
            :key="item.id"
            class="check-item"
            :class="{ checked: item.checked }"
            @click="toggleCheck(item)"
          >
            <div class="check-box">
              <el-icon v-if="item.checked"><Check /></el-icon>
            </div>
            <div class="check-content">
              <span class="check-icon">{{ item.emoji }}</span>
              <span class="check-label">{{ item.label }}</span>
            </div>
          </div>
        </div>
        <div class="check-summary">
          已完成 {{ checkedCount }}/{{ safetyChecklist.length }} 项
          <el-tag :type="checkedCount === safetyChecklist.length ? 'success' : 'warning'" size="large">
            {{ checkedCount === safetyChecklist.length ? '全部完成 ✓' : '还有未检查项' }}
          </el-tag>
          <el-button
            v-if="checkedCount === safetyChecklist.length"
            type="success"
            size="large"
            @click="submitSafetyCheck"
            class="submit-btn"
          >
            提交检查结果
          </el-button>
        </div>
      </div>

      <!-- 健康打卡 -->
      <div class="section-card">
        <h2 class="section-title"><el-icon><Calendar /></el-icon> 每日健康打卡</h2>
        <div class="daily-checkin">
          <div class="checkin-status">
            <div class="checkin-days">
              <span class="days-num">{{ checkInStreak }}</span>
              <span class="days-label">连续打卡天数</span>
            </div>
            <el-button
              :type="todayCheckedIn ? 'success' : 'primary'"
              size="large"
              :disabled="todayCheckedIn"
              @click="doCheckIn"
              class="checkin-btn"
            >
              <el-icon><Check /></el-icon>
              {{ todayCheckedIn ? '今日已打卡 ✓' : '立即打卡' }}
            </el-button>
          </div>
          <div class="checkin-calendar">
            <div
              v-for="day in recentDays"
              :key="day.date"
              class="day-dot"
              :class="{ done: day.done, today: day.isToday }"
              :title="day.date"
            >
              <span>{{ day.label }}</span>
              <el-icon v-if="day.done"><Check /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <!-- SOS求助说明 -->
      <div class="section-card">
        <h2 class="section-title"><el-icon><InfoFilled /></el-icon> SOS求助说明</h2>
        <div class="sos-tips">
          <div class="sos-tip-item">
            <div class="sos-num">1</div>
            <div class="sos-text">
              <h4>保持冷静</h4>
              <p>深呼吸，不要惊慌，快速判断情况</p>
            </div>
          </div>
          <div class="sos-tip-item">
            <div class="sos-num">2</div>
            <div class="sos-text">
              <h4>拨打急救电话</h4>
              <p>如生命垂危请立即拨打120急救电话</p>
            </div>
          </div>
          <div class="sos-tip-item">
            <div class="sos-num">3</div>
            <div class="sos-text">
              <h4>联系家人</h4>
              <p>及时通知紧急联系人您的位置和情况</p>
            </div>
          </div>
          <div class="sos-tip-item">
            <div class="sos-num">4</div>
            <div class="sos-text">
              <h4>等待救援</h4>
              <p>保持通讯畅通，不要随意移动</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 防跌倒指南 -->
      <div class="section-card">
        <h2 class="section-title"><el-icon><WarningFilled /></el-icon> 老年人防跌倒指南</h2>
        <p class="section-desc">跌倒是老年人因伤害就诊的首位原因，每年约4000万老年人经历跌倒。预防比治疗更重要！</p>
        <div class="fall-grid">
          <div class="fall-item" v-for="(item, idx) in fallPrevention" :key="idx">
            <div class="fall-emoji">{{ item.emoji }}</div>
            <div class="fall-text">
              <h4>{{ item.title }}</h4>
              <p>{{ item.content }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 常见急救知识 -->
      <div class="section-card">
        <h2 class="section-title"><el-icon><FirstAidKit /></el-icon> 常见突发情况应对</h2>
        <div class="emergency-knowledge">
          <div class="ek-item" v-for="(item, idx) in emergencyKnowledge" :key="idx">
            <div class="ek-header" :style="{background: item.bgColor}">
              <span class="ek-emoji">{{ item.emoji }}</span>
              <h4>{{ item.title }}</h4>
            </div>
            <div class="ek-body">
              <p><strong>症状：</strong>{{ item.symptom }}</p>
              <p><strong>应对：</strong>{{ item.response }}</p>
              <p class="ek-warning" v-if="item.warning"><strong>⚠️ 注意：</strong>{{ item.warning }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 拨号确认弹窗 -->
      <el-dialog v-model="callDialogVisible" title="确认拨打电话" width="360px" center>
        <div class="call-confirm">
          <div class="call-icon-big">📞</div>
          <h2>{{ callingContact?.name }}</h2>
          <p class="call-phone-big">{{ callingContact?.phone }}</p>
        </div>
        <template #footer>
          <el-button size="large" @click="callDialogVisible = false">取消</el-button>
          <el-button type="primary" size="large" @click="confirmCall">确认拨打</el-button>
        </template>
      </el-dialog>

      <!-- 添加联系人弹窗 -->
      <el-dialog v-model="showAddContact" title="添加家庭联系人" width="420px">
        <el-form :model="contactForm" label-width="80px" size="large">
          <el-form-item label="姓名">
            <el-input v-model="contactForm.name" placeholder="联系人姓名" />
          </el-form-item>
          <el-form-item label="关系">
            <el-select v-model="contactForm.relation" style="width:100%">
              <el-option label="子女" value="子女" />
              <el-option label="配偶" value="配偶" />
              <el-option label="兄弟姐妹" value="兄弟姐妹" />
              <el-option label="其他" value="其他" />
            </el-select>
          </el-form-item>
          <el-form-item label="电话">
            <el-input v-model="contactForm.phone" placeholder="手机号码" maxlength="11" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showAddContact = false">取消</el-button>
          <el-button type="primary" @click="addContact">添加</el-button>
        </template>
      </el-dialog>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { WarningFilled, PhoneFilled, User, Plus, House, Check, Calendar, InfoFilled, FirstAidKit } from '@element-plus/icons-vue'
import Layout from '@/components/Layout.vue'
import { api } from '@/utils/request'
import dayjs from 'dayjs'

const emergencyButtons = ref([
  { name: '120 急救中心', phone: '120', desc: '生命垂危、急性病发作', type: 'danger', icon: 'FirstAidKit' },
  { name: '110 报警电话', phone: '110', desc: '遭遇危险、人身安全', type: 'warning', icon: 'AlarmClock' },
  { name: '119 消防救援', phone: '119', desc: '火灾、煤气泄漏', type: 'fire', icon: 'Promotion' },
  { name: '社区服务', phone: '400-123-4567', desc: '社区养老服务中心', type: 'info', icon: 'OfficeBuilding' },
])

const loadingContacts = ref(false)
const familyContacts = ref([
  { name: '张大大', relation: '子女', phone: '138-0000-0001' },
  { name: '李小小', relation: '子女', phone: '138-0000-0002' },
])

// 安全检查（数据持久化到localStorage）
const defaultChecklist = [
  { id: 1, emoji: '🔥', label: '关闭燃气灶', checked: false },
  { id: 2, emoji: '💡', label: '关闭不必要的电灯', checked: false },
  { id: 3, emoji: '🚰', label: '关闭水龙头', checked: false },
  { id: 4, emoji: '🔌', label: '拔掉充电器插头', checked: false },
  { id: 5, emoji: '🔒', label: '锁好门窗', checked: false },
  { id: 6, emoji: '💊', label: '携带必要药物', checked: false },
]

const safetyChecklist = ref([...defaultChecklist])

const checkedCount = computed(() => safetyChecklist.value.filter(i => i.checked).length)
const toggleCheck = (item) => { 
  item.checked = !item.checked
  saveSafetyCheck()
}

// 保存安全检查结果到本地
const saveSafetyCheck = () => {
  const today = dayjs().format('YYYY-MM-DD')
  const data = {
    date: today,
    items: safetyChecklist.value.map(i => ({ id: i.id, checked: i.checked }))
  }
  localStorage.setItem('safetyCheck_' + today, JSON.stringify(data))
}

// 加载安全检查结果
const loadSafetyCheck = () => {
  const today = dayjs().format('YYYY-MM-DD')
  const saved = localStorage.getItem('safetyCheck_' + today)
  if (saved) {
    try {
      const data = JSON.parse(saved)
      if (data.date === today) {
        data.items.forEach(savedItem => {
          const item = safetyChecklist.value.find(i => i.id === savedItem.id)
          if (item) item.checked = savedItem.checked
        })
      }
    } catch (e) {}
  }
}

const submitSafetyCheck = () => {
  if (checkedCount.value === safetyChecklist.value.length) {
    saveSafetyCheck()
    ElMessage.success('安全检查结果已保存！')
  }
}

// 打卡（持久化到localStorage）
const checkInStreak = ref(15)
const todayCheckedIn = ref(false)

const recentDays = computed(() => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = dayjs().subtract(6 - i, 'day')
    const dateKey = d.format('YYYY-MM-DD')
    const isDone = localStorage.getItem('checkIn_' + dateKey)
    return {
      date: d.format('MM/DD'),
      label: i === 6 ? '今' : d.format('DD'),
      isToday: i === 6,
      done: !!isDone
    }
  })
})

const checkLocalCheckIn = () => {
  const today = dayjs().format('YYYY-MM-DD')
  todayCheckedIn.value = !!localStorage.getItem('checkIn_' + today)
  checkInStreak.value = parseInt(localStorage.getItem('checkInStreak') || '15')
}

const doCheckIn = () => {
  if (!todayCheckedIn.value) {
    todayCheckedIn.value = true
    checkInStreak.value += 1
    const today = dayjs().format('YYYY-MM-DD')
    localStorage.setItem('checkIn_' + today, 'done')
    localStorage.setItem('checkInStreak', String(checkInStreak.value))
    ElMessage.success('打卡成功！今日健康打卡完成 🎉')
  }
}

// 从后端加载紧急联系人
const loadContacts = async () => {
  loadingContacts.value = true
  try {
    const res = await api.elder.getEmergencyContacts()
    if (res.code === 200 && res.data && res.data.contacts) {
      const allContacts = res.data.contacts
      // 过滤掉紧急服务类，只保留家庭联系人
      familyContacts.value = allContacts
        .filter(c => c.type === 'family' || c.type === 'child')
        .map(c => ({
          name: c.name,
          relation: c.type === 'child' ? '子女' : '家人',
          phone: c.phone
        }))
    }
  } catch (e) {
    console.log('加载联系人失败，使用默认数据')
  } finally {
    loadingContacts.value = false
  }
}

// 拨号
const callDialogVisible = ref(false)
const callingContact = ref(null)
const callPhone = (contact) => {
  callingContact.value = contact
  callDialogVisible.value = true
}
const confirmCall = () => {
  const phone = callingContact.value?.phone?.replace(/-/g, '') || ''
  window.location.href = `tel:${phone}`
  callDialogVisible.value = false
  ElMessage.success(`正在拨打 ${callingContact.value.name}`)
}

// 添加联系人
const showAddContact = ref(false)
const contactForm = reactive({ name: '', relation: '子女', phone: '' })
const addContact = () => {
  if (!contactForm.name || !contactForm.phone) {
    ElMessage.warning('请填写完整信息')
    return
  }
  familyContacts.value.push({ ...contactForm })
  Object.assign(contactForm, { name: '', relation: '子女', phone: '' })
  showAddContact.value = false
  ElMessage.success('联系人已添加')
}

// 防跌倒指南数据
const fallPrevention = ref([
  { emoji: '🏠', title: '居家环境改造', content: '卫生间安装扶手和防滑垫，地面保持干燥，清除过道障碍物，确保照明充足，楼梯安装扶手。' },
  { emoji: '👟', title: '穿合适的鞋子', content: '选择鞋底防滑、鞋面柔软、大小合适的鞋子。避免穿拖鞋、高跟鞋和鞋底磨损严重的鞋子。' },
  { emoji: '🚶', title: '行动注意安全', content: '起身要慢，先坐后站。走路时不要着急，避免在湿滑地面行走。上下楼梯抓好扶手，一步一步来。' },
  { emoji: '💪', title: '增强体能锻炼', content: '坚持做平衡训练（如靠墙静蹲、单腿站立），每周3-5次。太极拳是公认预防跌倒的有效运动。' },
  { emoji: '👀', title: '注意视力健康', content: '定期检查视力，及时更换老花镜。白内障患者尽早手术。避免在光线不足的环境下活动。' },
  { emoji: '💊', title: '关注药物影响', content: '某些降压药、安眠药可能导致头晕。服用这类药物后注意缓慢起身，避免立即走路。' },
])

// 常见突发情况应对知识
const emergencyKnowledge = ref([
  {
    emoji: '🫀', title: '心绞痛发作',
    symptom: '胸闷、胸痛、呼吸困难、出冷汗',
    response: '立即停止活动，就地坐下或半卧位休息。舌下含服硝酸甘油1片，5分钟后未缓解再含1片。如15分钟内仍未缓解，立即拨打120。',
    warning: '硝酸甘油需避光保存，开封后有效期约6个月',
    bgColor: '#fff2f0'
  },
  {
    emoji: '🩸', title: '低血糖反应',
    symptom: '心慌、手抖、出冷汗、头晕、饥饿感',
    response: '立即进食含糖食物（糖果、饼干、果汁），15分钟后复测血糖。如仍偏低，再次进食。严重低血糖（意识模糊）立即拨打120。',
    warning: '糖尿病患者外出时随身携带糖果或巧克力',
    bgColor: '#fffbe6'
  },
  {
    emoji: '😵', title: '头晕目眩',
    symptom: '头晕、视物模糊、站立不稳',
    response: '立即坐下或蹲下，避免摔倒。低头深呼吸几次。缓慢喝水。如果是体位性低血压，平卧抬高双腿。',
    warning: '频繁头晕需就医检查，可能是心血管或神经系统问题',
    bgColor: '#f0f5ff'
  },
  {
    emoji: '🤕', title: '意外跌倒',
    symptom: '摔倒后疼痛、肿胀、无法活动',
    response: '不要急于起身，先确认有无剧痛或出血。如有骨折可能，保持原位不动，拨打120等待救援。如能活动，缓慢起身。',
    warning: '头部受伤后出现呕吐、意识模糊需立即就医',
    bgColor: '#f6ffed'
  },
])

// 生命周期
onMounted(() => {
  loadContacts()
  loadSafetyCheck()
  checkLocalCheckIn()
})
</script>

<style scoped>
.emergency-page { max-width: 900px; margin: 0 auto; }
.emergency-banner {
  background: linear-gradient(135deg, #ff4d4f, #ff7875);
  color: white; border-radius: 14px; padding: 24px 32px;
  display: flex; align-items: center; gap: 20px; margin-bottom: 24px;
}
.banner-icon { font-size: 48px; }
.emergency-banner h1 { font-size: 26px; margin: 0 0 4px; }
.emergency-banner p  { margin: 0; opacity: .88; font-size: 15px; }

.emergency-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
.emergency-card {
  background: #fff; border-radius: 14px; padding: 20px 16px;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  box-shadow: 0 2px 12px rgba(0,0,0,.09); cursor: pointer;
  transition: transform .2s, box-shadow .2s; border-top: 5px solid #91d5ff;
  text-align: center;
}
.emergency-card:hover { transform: translateY(-4px); box-shadow: 0 6px 20px rgba(0,0,0,.14); }
.emergency-card.danger { border-top-color: #ff4d4f; }
.emergency-card.warning { border-top-color: #faad14; }
.emergency-card.fire { border-top-color: #ff7a45; }
.emergency-card.info { border-top-color: #1890ff; }
.e-icon { font-size: 36px; color: #1890ff; }
.emergency-card.danger .e-icon { color: #ff4d4f; }
.emergency-card.warning .e-icon { color: #faad14; }
.emergency-card.fire .e-icon { color: #ff7a45; }
.e-info h2 { font-size: 17px; margin: 0 0 4px; }
.e-phone { font-size: 22px; font-weight: 700; color: #333; margin: 0 0 4px; }
.e-desc { font-size: 13px; color: #888; margin: 0; }
.e-call-btn {
  display: flex; align-items: center; gap: 6px;
  background: #1890ff; color: white;
  padding: 10px 20px; border-radius: 8px; font-size: 16px; font-weight: 600;
  margin-top: 4px;
}
.emergency-card.danger .e-call-btn { background: #ff4d4f; }
.emergency-card.warning .e-call-btn { background: #faad14; }
.emergency-card.fire .e-call-btn { background: #ff7a45; }

.section-card { background: #fff; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 12px rgba(0,0,0,.07); }
.section-title { font-size: 18px; font-weight: 600; color: #333; display: flex; align-items: center; gap: 8px; margin: 0 0 16px; }
.section-desc { font-size: 14px; color: #888; margin: -8px 0 14px; }

.family-list { display: flex; flex-direction: column; gap: 10px; }
.family-card {
  display: flex; align-items: center; gap: 14px;
  background: #f8f9fa; border-radius: 10px; padding: 14px 16px; cursor: pointer;
  transition: background .2s;
}
.family-card:hover { background: #e6f7ff; }
.fc-avatar {
  width: 46px; height: 46px; border-radius: 50%; background: var(--primary-color);
  color: white; font-size: 20px; font-weight: 700; display: flex; align-items: center; justify-content: center;
}
.fc-info { flex: 1; }
.fc-info h3 { margin: 0 0 4px; font-size: 16px; }
.fc-info p { margin: 0; color: #888; font-size: 13px; }
.fc-call { font-size: 24px; color: var(--primary-color); }
.add-contact-btn {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 14px; border: 2px dashed #d9d9d9; border-radius: 10px;
  color: #aaa; cursor: pointer; font-size: 15px; transition: all .2s;
}
.add-contact-btn:hover { border-color: var(--primary-color); color: var(--primary-color); }

.checklist { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 10px; margin-bottom: 16px; }
.check-item {
  display: flex; align-items: center; gap: 10px;
  background: #f8f9fa; border-radius: 10px; padding: 12px 14px; cursor: pointer;
  border: 2px solid transparent; transition: all .2s;
}
.check-item.checked { background: #f6ffed; border-color: #52c41a; }
.check-box {
  width: 24px; height: 24px; border-radius: 6px; border: 2px solid #d9d9d9;
  display: flex; align-items: center; justify-content: center; color: #52c41a; font-size: 16px;
  flex-shrink: 0;
}
.check-item.checked .check-box { border-color: #52c41a; background: #52c41a; color: white; }
.check-content { display: flex; align-items: center; gap: 6px; }
.check-icon { font-size: 20px; }
.check-label { font-size: 14px; }
.check-summary { display: flex; align-items: center; gap: 12px; font-size: 15px; color: #555; flex-wrap: wrap; }
.submit-btn { margin-left: auto; }

.daily-checkin { display: flex; flex-direction: column; gap: 16px; }
.checkin-status { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
.checkin-days { display: flex; flex-direction: column; align-items: center; }
.days-num { font-size: 42px; font-weight: 700; color: var(--primary-color); line-height: 1; }
.days-label { font-size: 13px; color: #888; }
.checkin-btn { height: 56px; font-size: 17px; padding: 0 32px; }
.checkin-calendar { display: flex; gap: 10px; flex-wrap: wrap; }
.day-dot {
  width: 44px; height: 44px; border-radius: 50%; border: 2px solid #f0f0f0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  font-size: 11px; color: #aaa; gap: 1px;
}
.day-dot.done { background: #52c41a; border-color: #52c41a; color: white; }
.day-dot.today { border-color: var(--primary-color); font-weight: 700; }
.day-dot.today:not(.done) { color: var(--primary-color); }

/* SOS求助说明 */
.sos-tips { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
.sos-tip-item { display: flex; gap: 12px; align-items: flex-start; padding: 12px; background: #f8f9fa; border-radius: 10px; }
.sos-num {
  width: 32px; height: 32px; border-radius: 50%; background: #ff4d4f; color: white;
  display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; flex-shrink: 0;
}
.sos-text h4 { margin: 0 0 4px; font-size: 15px; }
.sos-text p { margin: 0; font-size: 13px; color: #888; }

.call-confirm { text-align: center; padding: 20px 0; }
.call-icon-big { font-size: 56px; margin-bottom: 12px; }
.call-confirm h2 { font-size: 22px; margin: 0 0 8px; }
.call-phone-big { font-size: 28px; font-weight: 700; color: var(--primary-color); }

/* 防跌倒指南 */
.fall-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
  margin-top: var(--spacing-lg);
}
.fall-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 14px;
  background: #fff7e6;
  border-radius: 10px;
  border-left: 4px solid #fa8c16;
}
.fall-emoji { font-size: 24px; flex-shrink: 0; margin-top: 2px; }
.fall-text h4 { font-size: 15px; color: #333; margin-bottom: 4px; }
.fall-text p { font-size: 13px; color: #666; line-height: 1.5; margin: 0; }

/* 急救知识 */
.emergency-knowledge {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
  margin-top: var(--spacing-lg);
}
.ek-item {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
}
.ek-header {
  padding: 14px 16px;
  display: flex; align-items: center; gap: 10px;
}
.ek-header .ek-emoji { font-size: 24px; }
.ek-header h4 { margin: 0; font-size: 16px; color: #333; }
.ek-body { padding: 14px 16px; background: #fff; }
.ek-body p { font-size: 13px; color: #555; line-height: 1.6; margin: 6px 0; }
.ek-warning { color: #ff4d4f !important; background: #fff2f0; padding: 8px !important; border-radius: 6px; }

@media (max-width: 600px) {
  .emergency-grid { grid-template-columns: 1fr 1fr; }
  .emergency-banner { flex-direction: column; text-align: center; padding: 20px; }
  .sos-tips { grid-template-columns: 1fr; }
  .fall-grid { grid-template-columns: 1fr; }
  .emergency-knowledge { grid-template-columns: 1fr; }
}
</style>
