<template>
  <Layout>
    <div class="medication-page">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title"><el-icon><Bell /></el-icon> 用药提醒</h1>
          <p class="page-subtitle">共 {{ medications.length }} 条用药记录，今日待服 {{ todayPendingCount }} 次</p>
        </div>
        <el-button type="primary" size="large" @click="openAddDialog">
          <el-icon><Plus /></el-icon> 添加用药
        </el-button>
      </div>

      <!-- 用药统计卡片 -->
      <div class="stats-row">
        <div class="stat-card blue">
          <div class="stat-num">{{ overallStats.total || 0 }}</div>
          <div class="stat-label">总用药次数</div>
        </div>
        <div class="stat-card green">
          <div class="stat-num">{{ overallStats.taken || 0 }}</div>
          <div class="stat-label">已服用</div>
        </div>
        <div class="stat-card orange">
          <div class="stat-num">{{ overallStats.skipped || 0 }}</div>
          <div class="stat-label">已跳过</div>
        </div>
        <div class="stat-card purple">
          <div class="stat-num">{{ overallStats.medicine_count || 0 }}</div>
          <div class="stat-label">药品种类</div>
        </div>
      </div>

      <!-- 今日服药时间轴 -->
      <div class="section-card" v-loading="loadingMedications">
        <h2 class="section-title"><el-icon><Clock /></el-icon> 今日服药时间轴</h2>
        <div class="timeline-wrapper">
          <div v-if="todayTimeline.length === 0" class="empty-tip">今日暂无用药提醒</div>
          <div v-else class="timeline">
            <div
              v-for="item in todayTimeline"
              :key="item.id"
              class="timeline-item"
              :class="item.status"
            >
              <div class="tl-dot"></div>
              <div class="tl-time">{{ item.take_time }}</div>
              <div class="tl-content">
                <span class="tl-name">{{ item.medicine_name }}</span>
                <span class="tl-dosage">{{ item.dosage }}</span>
                <el-tag size="small" :type="statusTagType(item.status)">
                  {{ statusLabel(item.status) }}
                </el-tag>
              </div>
              <div class="tl-actions">
                <el-button
                  v-if="item.status === 'pending'"
                  type="success" size="small"
                  @click="markTaken(item)"
                  :loading="markLoadingId === item.id"
                >已服用</el-button>
                <el-button
                  v-if="item.status === 'pending'"
                  type="warning" size="small"
                  @click="markSkipped(item)"
                  :loading="markLoadingId === item.id"
                >跳过</el-button>
                <el-button
                  v-if="item.status !== 'pending'"
                  size="small"
                  @click="resetMedStatus(item)"
                  :loading="markLoadingId === item.id"
                >重置</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 全部用药列表 -->
      <div class="section-card" v-loading="loadingMedications">
        <div class="section-header">
          <h2 class="section-title"><el-icon><List /></el-icon> 全部用药记录</h2>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索药品名称..."
            size="large"
            clearable
            style="width:220px"
          >
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
        </div>

        <div class="med-list">
          <div v-if="filteredMedications.length === 0" class="empty-tip">暂无用药记录</div>
          <div
            v-for="med in filteredMedications"
            :key="med.id"
            class="med-card"
          >
            <div class="med-main">
              <div class="med-icon"><el-icon><FirstAidKit /></el-icon></div>
              <div class="med-info">
                <h3 class="med-name">{{ med.medicine_name }}</h3>
                <p class="med-meta">
                  <el-tag size="small" type="info">{{ med.dosage }}</el-tag>
                  <el-tag size="small" type="">{{ med.frequency }}</el-tag>
                  <el-tag size="small" type="warning">{{ med.take_time }}</el-tag>
                  <el-tag size="small" :type="statusTagType(med.status)">{{ statusLabel(med.status) }}</el-tag>
                </p>
                <p class="med-remark" v-if="med.remark">备注：{{ med.remark }}</p>
              </div>
            </div>
            <div class="med-actions">
              <el-button size="large" @click="editMed(med)"><el-icon><Edit /></el-icon> 编辑</el-button>
              <el-button size="large" type="danger" plain @click="deleteMed(med.id)">
                <el-icon><Delete /></el-icon> 删除
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 添加/编辑弹窗 -->
      <el-dialog
        v-model="dialogVisible"
        :title="editingId ? '编辑用药提醒' : '添加用药提醒'"
        width="500px"
        :close-on-click-modal="false"
      >
        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-width="100px"
          size="large"
        >
          <el-form-item label="药品名称" prop="medicine_name">
            <el-input v-model="form.medicine_name" placeholder="请输入药品名称" maxlength="50" />
          </el-form-item>
          <el-form-item label="剂量" prop="dosage">
            <el-input v-model="form.dosage" placeholder="如：1片、5ml" maxlength="20" />
          </el-form-item>
          <el-form-item label="服用频率" prop="frequency">
            <el-select v-model="form.frequency" placeholder="请选择频率" style="width:100%">
              <el-option label="每日1次" value="每日1次" />
              <el-option label="每日2次" value="每日2次" />
              <el-option label="每日3次" value="每日3次" />
              <el-option label="隔日1次" value="隔日1次" />
              <el-option label="每周1次" value="每周1次" />
              <el-option label="需要时服用" value="需要时服用" />
            </el-select>
          </el-form-item>
          <el-form-item label="服用时间" prop="take_time">
            <el-time-picker
              v-model="form.take_time"
              format="HH:mm"
              value-format="HH:mm"
              placeholder="选择服用时间"
              style="width:100%"
            />
          </el-form-item>
          <el-form-item label="备注">
            <el-input
              v-model="form.remark"
              type="textarea"
              :rows="2"
              placeholder="如：饭前服用、饭后服用"
              maxlength="100"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button size="large" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" size="large" :loading="saving" @click="submitForm">
            {{ saving ? '保存中...' : '保存' }}
          </el-button>
        </template>
      </el-dialog>

      <!-- 用药安全提示 -->
      <div class="section-card safety-card">
        <h2 class="section-title"><el-icon><Warning /></el-icon> 用药安全须知</h2>
        <div class="safety-grid">
          <div class="safety-item" v-for="(item, idx) in safetyTips" :key="idx">
            <div class="safety-icon">{{ item.emoji }}</div>
            <div class="safety-text">
              <h4>{{ item.title }}</h4>
              <p>{{ item.content }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 常见药物知识 -->
      <div class="section-card drug-card">
        <h2 class="section-title"><el-icon><InfoFilled /></el-icon> 常见药物小知识</h2>
        <div class="drug-grid">
          <div class="drug-item" v-for="(drug, idx) in drugKnowledge" :key="idx">
            <h4>{{ drug.name }}</h4>
            <p><strong>用途：</strong>{{ drug.usage }}</p>
            <p><strong>注意：</strong>{{ drug.warning }}</p>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Bell, Plus, Clock, List, Search, FirstAidKit, Edit, Delete, Warning, InfoFilled } from '@element-plus/icons-vue'
import Layout from '@/components/Layout.vue'
import { api } from '@/utils/request'
import { startMedicationReminder, stopMedicationReminder } from '@/utils/medicationReminder'

// 加载状态
const loadingMedications = ref(false)
const markLoadingId = ref(null)

// 用药数据（从后端获取）
const medications = ref([])

// 用药统计
const overallStats = ref({ total: 0, taken: 0, skipped: 0, pending: 0, medicine_count: 0 })

// 今日时间轴
const todayTimeline = computed(() => {
  // 所有用药提醒都在今日时间轴展示（按 take_time 排序），
  // 频率决定是否"每日"需要，一次性用药按是否已完成过滤
  return medications.value
    .slice()
    .sort((a, b) => (a.take_time || '').localeCompare(b.take_time || ''))
})

const todayPendingCount = computed(() =>
  todayTimeline.value.filter(i => i.status === 'pending').length
)

const statusLabel = (s) => ({ pending: '待服用', taken: '已服用', skipped: '已跳过' }[s] || '待服用')
const statusTagType = (s) => ({ pending: 'warning', taken: 'success', skipped: 'info' }[s] || '')

// 从后端加载用药列表
const loadMedications = async () => {
  loadingMedications.value = true
  try {
    const res = await api.medication.getList()
    if (res.code === 200) {
      medications.value = res.data || []
    }
  } catch (e) {
    console.log('加载用药数据失败')
    medications.value = []
  } finally {
    loadingMedications.value = false
  }
}

// 从后端加载用药统计
const loadMedStats = async () => {
  try {
    const res = await api.medication.getStats()
    if (res.code === 200 && res.data) {
      overallStats.value = res.data.overall_stats || {}
    }
  } catch (e) {
    console.log('加载用药统计失败')
  }
}

// 标记服药状态（调用后端API）
const markTaken = async (item) => {
  markLoadingId.value = item.id
  try {
    await api.medication.markStatus(item.id, 'taken')
    item.status = 'taken'
    ElMessage.success('已标记为已服用')
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    markLoadingId.value = null
  }
}

const markSkipped = async (item) => {
  markLoadingId.value = item.id
  try {
    await api.medication.markStatus(item.id, 'skipped')
    item.status = 'skipped'
    ElMessage.info('已跳过')
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    markLoadingId.value = null
  }
}

const resetMedStatus = async (item) => {
  markLoadingId.value = item.id
  try {
    await api.medication.markStatus(item.id, 'pending')
    item.status = 'pending'
    ElMessage.info('已重置')
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    markLoadingId.value = null
  }
}

// 搜索
const searchKeyword = ref('')
const filteredMedications = computed(() =>
  medications.value.filter(m =>
    m.medicine_name.includes(searchKeyword.value)
  )
)

// 弹窗
const dialogVisible = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formRef = ref(null)
const form = reactive({ medicine_name: '', dosage: '', frequency: '', take_time: '', remark: '' })
const rules = {
  medicine_name: [{ required: true, message: '请输入药品名称', trigger: 'blur' }],
  dosage: [{ required: true, message: '请输入剂量', trigger: 'blur' }],
  frequency: [{ required: true, message: '请选择频率', trigger: 'change' }],
  take_time: [{ required: true, message: '请选择服用时间', trigger: 'change' }],
}

const openAddDialog = () => {
  editingId.value = null
  Object.assign(form, { medicine_name: '', dosage: '', frequency: '', take_time: '', remark: '' })
  dialogVisible.value = true
}

const editMed = (med) => {
  editingId.value = med.id
  Object.assign(form, {
    medicine_name: med.medicine_name,
    dosage: med.dosage,
    frequency: med.frequency,
    take_time: med.take_time,
    remark: med.remark || ''
  })
  dialogVisible.value = true
}

// 删除用药（调用后端API）
const deleteMed = (id) => {
  ElMessageBox.confirm('确定要删除这条用药提醒吗？', '删除确认', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await api.medication.delete(id)
      const idx = medications.value.findIndex(m => m.id === id)
      if (idx !== -1) medications.value.splice(idx, 1)
      loadMedStats()
      ElMessage.success('已删除')
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 提交表单（调用后端API）
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  saving.value = true
  try {
    if (editingId.value) {
      const res = await api.medication.update(editingId.value, { ...form })
      if (res.code === 200) {
        const idx = medications.value.findIndex(m => m.id === editingId.value)
        if (idx !== -1) Object.assign(medications.value[idx], { ...form })
        ElMessage.success('修改成功')
      }
    } else {
      const res = await api.medication.create({ ...form })
      if (res.code === 200) {
        medications.value.push(res.data)
        ElMessage.success('添加成功')
      }
    }
    loadMedStats()
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    saving.value = false
    dialogVisible.value = false
  }
}

// 用药安全须知
const safetyTips = ref([
  { emoji: '⏰', title: '按时服药', content: '严格按照医嘱规定的剂量和时间服药，不要自行增加或减少用药量。建议使用分药盒，按早中晚分好每天要吃的药。' },
  { emoji: '📋', title: '定期复查', content: '服用降压药、降糖药等慢性病药物，应定期到医院复查，根据检查结果调整用药方案。建议每3个月复查一次。' },
  { emoji: '⚠️', title: '注意副作用', content: '服药期间如出现头晕、恶心、皮疹、腹泻等不适症状，应立即停药并咨询医生。不要同时服用多种同类药物。' },
  { emoji: '🍷', title: '药物与饮食', content: '服用降压药期间避免高盐饮食；服降糖药时注意按时进餐；服用抗生素期间避免饮酒；钙片不宜与牛奶同服。' },
  { emoji: '💊', title: '妥善存放', content: '药品应存放在阴凉干燥处，避免阳光直射。注意查看有效期，过期药品切勿服用。定期整理家庭药箱。' },
  { emoji: '👨‍⚕️', title: '遵医嘱用药', content: '不可听信偏方、广告自行买药。就诊时带齐目前服用的所有药物清单（包括保健品），让医生全面评估。' },
])

// 常见药物知识
const drugKnowledge = ref([
  { name: '降压药（如氨氯地平）', usage: '用于治疗高血压，每日1次，通常早晨服用', warning: '不可突然停药，可能导致血压反弹。注意监测血压变化。' },
  { name: '二甲双胍', usage: '治疗2型糖尿病的一线用药，随餐服用', warning: '可能引起胃肠不适，建议从小剂量开始。肾功能不全者慎用。' },
  { name: '阿司匹林', usage: '用于预防心脑血管疾病，每日1片', warning: '饭后服用减少胃肠刺激。注意观察有无出血倾向。' },
  { name: '钙片 + 维生素D', usage: '补充钙质预防骨质疏松', warning: '与牛奶间隔2小时服用。多晒太阳促进吸收。' },
  { name: '他汀类药物', usage: '降低胆固醇，预防心脑血管疾病', warning: '通常晚上服用效果更好。定期检查肝功能。' },
])

// 生命周期
onMounted(() => {
  loadMedications()
  loadMedStats()
  // 启动用药提醒定时器（返回当前用药列表供服务检查）
  startMedicationReminder(() => medications.value)
})

onUnmounted(() => {
  stopMedicationReminder()
})
</script>

<style scoped>
.medication-page { max-width: 1000px; margin: 0 auto; }
.page-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
}
.page-title { font-size: 22px; font-weight: 700; color: var(--primary-color); display: flex; align-items: center; gap: 8px; margin: 0; }
.page-subtitle { font-size: 15px; color: #888; margin: 4px 0 0; }

/* 统计卡片 */
.stats-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  background: #fff; border-radius: 12px; padding: 20px; text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,.07); border-top: 4px solid #91d5ff;
}
.stat-card.blue { border-top-color: #1890ff; }
.stat-card.green { border-top-color: #52c41a; }
.stat-card.orange { border-top-color: #fa8c16; }
.stat-card.purple { border-top-color: #722ed1; }
.stat-num { font-size: 28px; font-weight: 700; color: #333; }
.stat-card.blue .stat-num { color: #1890ff; }
.stat-card.green .stat-num { color: #52c41a; }
.stat-card.orange .stat-num { color: #fa8c16; }
.stat-card.purple .stat-num { color: #722ed1; }
.stat-label { font-size: 14px; color: #888; margin-top: 4px; }

.section-card {
  background: #fff; border-radius: 12px; padding: 24px;
  margin-bottom: 24px; box-shadow: 0 2px 12px rgba(0,0,0,.07);
}
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px; flex-wrap: wrap; gap: 10px; }
.section-title { font-size: 18px; font-weight: 600; color: #333; display: flex; align-items: center; gap: 8px; margin: 0 0 18px; }
.section-header .section-title { margin-bottom: 0; }

/* 时间轴 */
.timeline { display: flex; flex-direction: column; gap: 0; }
.timeline-item {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 16px; border-radius: 10px; margin-bottom: 10px;
  background: #f8f9fa; border-left: 5px solid #d9d9d9; transition: all .2s;
}
.timeline-item.taken { background: #f6ffed; border-left-color: #52c41a; }
.timeline-item.skipped { background: #f5f5f5; border-left-color: #bfbfbf; opacity: .7; }
.timeline-item.pending { background: #fffbe6; border-left-color: #faad14; }
.tl-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; background: currentColor; }
.timeline-item.taken .tl-dot { background: #52c41a; }
.timeline-item.skipped .tl-dot { background: #bfbfbf; }
.timeline-item.pending .tl-dot { background: #faad14; }
.tl-time { font-size: 20px; font-weight: 700; color: #333; min-width: 56px; }
.tl-content { flex: 1; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.tl-name { font-size: 17px; font-weight: 600; }
.tl-dosage { font-size: 14px; color: #888; }
.tl-actions { display: flex; gap: 8px; flex-shrink: 0; }

/* 药品卡片 */
.med-list { display: flex; flex-direction: column; gap: 12px; }
.med-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; background: #f8f9fa; border-radius: 10px;
  border-left: 5px solid var(--primary-color); gap: 16px; flex-wrap: wrap;
}
.med-main { display: flex; align-items: center; gap: 14px; flex: 1; }
.med-icon { font-size: 28px; color: var(--primary-color); }
.med-name { font-size: 17px; font-weight: 700; margin: 0 0 6px; }
.med-meta { display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 4px; }
.med-remark { font-size: 13px; color: #888; margin: 0; }
.med-actions { display: flex; gap: 8px; flex-shrink: 0; }
.empty-tip { text-align: center; padding: 40px; color: #aaa; font-size: 16px; }

/* 用药安全须知 */
.safety-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}
.safety-item {
  display: flex; align-items: flex-start; gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: #fffbe6;
  border-radius: var(--border-radius-sm);
  border-left: 4px solid #faad14;
}
.safety-icon { font-size: 28px; flex-shrink: 0; }
.safety-text h4 { font-size: 16px; color: #333; margin-bottom: 6px; }
.safety-text p { font-size: 13px; color: #666; line-height: 1.6; margin: 0; }

/* 常见药物知识 */
.drug-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}
.drug-item {
  padding: var(--spacing-md);
  background: #f0f5ff;
  border-radius: var(--border-radius-sm);
  border-left: 4px solid #1890ff;
}
.drug-item h4 { font-size: 16px; color: #1890ff; margin-bottom: 8px; }
.drug-item p { font-size: 13px; color: #555; line-height: 1.5; margin: 4px 0; }

@media (max-width: 768px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
  .safety-grid { grid-template-columns: 1fr; }
  .drug-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .stats-row { grid-template-columns: 1fr 1fr; }
  .timeline-item { flex-wrap: wrap; }
  .tl-actions { width: 100%; justify-content: flex-end; }
  .med-card { flex-direction: column; align-items: flex-start; }
  .med-actions { width: 100%; justify-content: flex-end; }
}
</style>
