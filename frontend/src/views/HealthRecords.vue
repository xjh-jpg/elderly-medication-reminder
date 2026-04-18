<template>
  <Layout>
    <div class="health-page">
      <div class="page-header">
        <div>
          <h1 class="page-title"><el-icon><Histogram /></el-icon> 健康记录</h1>
          <p class="page-subtitle">记录血压、血糖、心率、体重，掌握健康变化</p>
        </div>
        <el-button type="primary" size="large" @click="openAddDialog()">
          <el-icon><Plus /></el-icon> 添加记录
        </el-button>
      </div>

      <!-- 最新指标卡片 -->
      <el-row :gutter="16" class="indicator-row">
        <el-col :xs="12" :sm="6" v-for="ind in latestIndicators" :key="ind.type">
          <div class="indicator-card" :class="ind.level">
            <div class="ind-icon"><el-icon><component :is="ind.icon" /></el-icon></div>
            <div class="ind-body">
              <div class="ind-value">{{ ind.display }}</div>
              <div class="ind-name">{{ ind.label }}</div>
              <div class="ind-level-text">{{ ind.levelText }}</div>
            </div>
            <el-button size="small" class="ind-add-btn" @click="openAddDialog(ind.type)">+记录</el-button>
          </div>
        </el-col>
      </el-row>

      <!-- 健康分析统计 -->
      <div class="section-card" v-if="healthStats.length > 0">
        <h2 class="section-title"><el-icon><DataAnalysis /></el-icon> 健康数据分析（近30天）</h2>
        <el-row :gutter="16">
          <el-col :xs="24" :sm="12" :md="6" v-for="stat in healthStats" :key="stat.type">
            <div class="analysis-card" :class="stat.color">
              <h3>{{ typeTagMap[stat.type]?.label || stat.type }}</h3>
              <div class="analysis-row">
                <span>记录次数</span><strong>{{ stat.record_count }}</strong>
              </div>
              <div class="analysis-row">
                <span>平均值</span><strong>{{ stat.avg_value != null ? Number(stat.avg_value).toFixed(1) : '--' }}</strong>
              </div>
              <div class="analysis-row">
                <span>范围</span><strong>{{ stat.min_value || '--' }} ~ {{ stat.max_value || '--' }}</strong>
              </div>
              <div class="analysis-row">
                <span>评估</span><strong>{{ stat.assessment || '正常' }}</strong>
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 趋势折线图 -->
      <div class="section-card">
        <div class="section-header">
          <h2 class="section-title"><el-icon><TrendCharts /></el-icon> 近7天趋势</h2>
          <el-radio-group v-model="chartType" size="large">
            <el-radio-button label="blood_pressure">血压</el-radio-button>
            <el-radio-button label="blood_sugar">血糖</el-radio-button>
            <el-radio-button label="heart_rate">心率</el-radio-button>
            <el-radio-button label="weight">体重</el-radio-button>
          </el-radio-group>
        </div>
        <div class="simple-chart" v-loading="loadingChart">
          <div class="chart-bars" v-if="chartData.length > 0 && chartData.some(d => d.value !== '-')">
            <div
              v-for="(point, idx) in chartData"
              :key="idx"
              class="chart-col"
            >
              <div class="bar-label">{{ point.value }}</div>
              <div class="bar-wrap">
                <div
                  class="bar"
                  :style="{ height: barHeight(point.value) + 'px' }"
                  :class="point.level"
                ></div>
              </div>
              <div class="bar-date">{{ point.date }}</div>
            </div>
          </div>
          <div v-else class="chart-empty">
            <el-icon size="40"><Histogram /></el-icon>
            <p>暂无{{ chartTypeLabel }}趋势数据</p>
            <el-button type="primary" size="large" @click="openAddDialog(chartType)">去记录</el-button>
          </div>
        </div>
        <div class="chart-hint" v-if="chartData.some(d => d.value !== '-')">
          {{ chartTypeLabel }} · 单位：{{ chartUnit }} · 近7天数据
        </div>
      </div>

      <!-- 历史记录列表 -->
      <div class="section-card">
        <div class="section-header">
          <h2 class="section-title"><el-icon><List /></el-icon> 历史记录（{{ filteredRecords.length }} 条）</h2>
          <div class="filter-bar">
            <el-select v-model="filterType" size="large" placeholder="全部类型" clearable style="width:140px" @change="loadRecords">
              <el-option label="血压" value="blood_pressure" />
              <el-option label="血糖" value="blood_sugar" />
              <el-option label="心率" value="heart_rate" />
              <el-option label="体重" value="weight" />
            </el-select>
          </div>
        </div>

        <!-- 历史记录列表 -->
        <el-table
          :data="paginatedRecords"
          stripe
          v-loading="loadingRecords"
          style="width: 100%"
          :header-cell-style="{ fontSize: '15px', background: '#f0f7ff', color: '#333' }"
          :cell-style="{ fontSize: '14px' }"
          empty-text="暂无记录，点击上方按钮添加"
        >
          <el-table-column prop="type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="typeTagMap[row.type]?.tagType" size="large">
                {{ typeTagMap[row.type]?.label || row.type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="数值" min-width="120">
            <template #default="{ row }">
              <span class="record-value">{{ row.value1 }}</span>
              <span v-if="row.value2" class="record-value">/{{ row.value2 }}</span>
              <span class="record-unit">{{ typeTagMap[row.type]?.unit }}</span>
            </template>
          </el-table-column>
          <el-table-column label="评估" width="100">
            <template #default="{ row }">
              <el-tag :type="evalLevel(row).tagType" size="large" effect="light">
                {{ evalLevel(row).text }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="record_time" label="记录时间" width="170" />
          <el-table-column prop="remark" label="备注" min-width="120">
            <template #default="{ row }">
              {{ row.remark || '--' }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="large" @click="editRecord(row)">编辑</el-button>
              <el-button type="danger" link size="large" @click="deleteRecord(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrap" v-if="filteredRecords.length > pageSize">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="filteredRecords.length"
            layout="prev, pager, next"
            size="large"
          />
        </div>
      </div>

      <!-- 添加/编辑记录弹窗 -->
      <el-dialog
        v-model="dialogVisible"
        :title="editingId ? '编辑健康记录' : '添加健康记录'"
        width="440px"
        :close-on-click-modal="false"
      >
        <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" size="large">
          <el-form-item label="记录类型" prop="type">
            <el-select v-model="form.type" placeholder="请选择" style="width:100%" @change="onTypeChange" :disabled="!!editingId">
              <el-option label="血压" value="blood_pressure" />
              <el-option label="血糖" value="blood_sugar" />
              <el-option label="心率" value="heart_rate" />
              <el-option label="体重" value="weight" />
            </el-select>
          </el-form-item>

          <el-form-item v-if="form.type === 'blood_pressure'" label="收缩压" prop="value1">
            <el-input-number v-model="form.value1" :min="50" :max="250" controls-position="right" style="width:100%" />
            <span class="form-hint">正常范围：90-140 mmHg</span>
          </el-form-item>
          <el-form-item v-if="form.type === 'blood_pressure'" label="舒张压" prop="value2">
            <el-input-number v-model="form.value2" :min="30" :max="150" controls-position="right" style="width:100%" />
            <span class="form-hint">正常范围：60-90 mmHg</span>
          </el-form-item>
          <el-form-item v-if="form.type === 'blood_sugar' && form.type !== 'blood_pressure' && form.type" label="血糖值" prop="value1">
            <el-input-number v-model="form.value1" :min="1" :max="30" :step="0.1" controls-position="right" style="width:100%" />
            <span class="form-hint">正常范围：3.9-7.0 mmol/L</span>
          </el-form-item>
          <el-form-item v-if="form.type === 'heart_rate'" label="心率" prop="value1">
            <el-input-number v-model="form.value1" :min="30" :max="200" controls-position="right" style="width:100%" />
            <span class="form-hint">正常范围：60-100 bpm</span>
          </el-form-item>
          <el-form-item v-if="form.type === 'weight'" label="体重" prop="value1">
            <el-input-number v-model="form.value1" :min="20" :max="300" :step="0.1" controls-position="right" style="width:100%" />
            <span class="form-hint">单位：kg</span>
          </el-form-item>

          <el-form-item label="记录时间" prop="record_time">
            <el-date-picker
              v-model="form.record_time"
              type="datetime"
              format="YYYY-MM-DD HH:mm"
              value-format="YYYY-MM-DD HH:mm"
              placeholder="选择时间"
              style="width:100%"
            />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="form.remark" placeholder="如：空腹测量、运动后" maxlength="50" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button size="large" @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" size="large" :loading="saving" @click="submitForm">保存</el-button>
        </template>
      </el-dialog>

      <!-- 健康测量指南 -->
      <div class="section-card guide-card">
        <h2 class="section-title"><el-icon><Document /></el-icon> 健康指标测量指南</h2>
        <div class="guide-grid">
          <div class="guide-item" v-for="(guide, idx) in measureGuide" :key="idx">
            <div class="guide-emoji">{{ guide.emoji }}</div>
            <div class="guide-content">
              <h4>{{ guide.title }}</h4>
              <p v-for="(step, si) in guide.steps" :key="si">{{ step }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 健康知识 -->
      <div class="section-card tips-card">
        <h2 class="section-title"><el-icon><ChatDotRound /></el-icon> 健康管理小贴士</h2>
        <div class="health-tips-list">
          <div class="health-tip" v-for="(tip, idx) in healthTips" :key="idx">
            <span class="tip-num">{{ idx + 1 }}</span>
            <div class="tip-content">
              <strong>{{ tip.title }}</strong>
              <p>{{ tip.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Histogram, Plus, TrendCharts, List, DataAnalysis, Document, ChatDotRound } from '@element-plus/icons-vue'
import Layout from '@/components/Layout.vue'
import { api } from '@/utils/request'
import dayjs from 'dayjs'

// 加载状态
const loadingRecords = ref(false)
const loadingChart = ref(false)

// 类型配置
const typeTagMap = {
  blood_pressure: { label: '血压', unit: 'mmHg', tagType: 'danger', icon: 'Monitor' },
  blood_sugar:    { label: '血糖', unit: 'mmol/L', tagType: 'warning', icon: 'Odometer' },
  heart_rate:     { label: '心率', unit: 'bpm', tagType: 'success', icon: 'Timer' },
  weight:         { label: '体重', unit: 'kg', tagType: 'info', icon: 'Scale' },
}

// 健康记录数据（从后端获取）
const records = ref([])
const healthStats = ref([])

// 从后端加载记录
const loadRecords = async () => {
  loadingRecords.value = true
  try {
    const params = {}
    if (filterType.value) params.type = filterType.value
    const res = await api.health.getList(params)
    if (res.code === 200) {
      records.value = res.data || []
    }
  } catch (e) {
    console.log('加载健康记录失败', e)
  } finally {
    loadingRecords.value = false
  }
}

// 从后端加载统计
const loadHealthStats = async () => {
  try {
    const res = await api.health.getStats({ days: 30 })
    if (res.code === 200 && res.data) {
      healthStats.value = res.data.stats || []
    }
  } catch (e) {
    console.log('加载健康统计失败')
  }
}

// 最新指标
const latestIndicators = computed(() => {
  return ['blood_pressure','blood_sugar','heart_rate','weight'].map(type => {
    const latest = records.value.filter(r => r.type === type).sort((a,b) => b.record_time.localeCompare(a.record_time))[0]
    const cfg = typeTagMap[type]
    let display = latest ? (latest.value1 + (latest.value2 ? '/' + latest.value2 : '')) : '--'
    let level = 'normal'
    let levelText = '未记录'
    if (latest) {
      if (type === 'blood_pressure') {
        if (latest.value1 >= 140 || latest.value2 >= 90) { level = 'high'; levelText = '偏高' }
        else if (latest.value1 < 90 || latest.value2 < 60) { level = 'low'; levelText = '偏低' }
        else { levelText = '正常' }
      } else if (type === 'blood_sugar') {
        if (latest.value1 > 7.0) { level = 'high'; levelText = '偏高' }
        else if (latest.value1 < 3.9) { level = 'low'; levelText = '偏低' }
        else { levelText = '正常' }
      } else if (type === 'heart_rate') {
        if (latest.value1 > 100) { level = 'high'; levelText = '偏快' }
        else if (latest.value1 < 60) { level = 'low'; levelText = '偏慢' }
        else { levelText = '正常' }
      } else if (type === 'weight') {
        levelText = '已记录'
      }
    }
    return { type, label: cfg.label, icon: cfg.icon, display, level, levelText }
  })
})

// 趋势图
const chartType = ref('blood_pressure')
const chartTypeLabel = computed(() => typeTagMap[chartType.value]?.label)
const chartUnit = computed(() => typeTagMap[chartType.value]?.unit)

const chartData = computed(() => {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const date = dayjs().subtract(i, 'day').format('MM/DD')
    const dateStr = dayjs().subtract(i, 'day').format('YYYY-MM-DD')
    const rec = records.value
      .filter(r => r.type === chartType.value && r.record_time && r.record_time.startsWith(dateStr))
      .sort((a,b) => b.record_time.localeCompare(a.record_time))[0]
    let value = rec ? rec.value1 : null
    let level = 'normal'
    if (value !== null) {
      if (chartType.value === 'blood_pressure' && value >= 140) level = 'high'
      else if (chartType.value === 'blood_pressure' && value < 90) level = 'low'
      if (chartType.value === 'blood_sugar' && value > 7.0) level = 'high'
      else if (chartType.value === 'blood_sugar' && value < 3.9) level = 'low'
      if (chartType.value === 'heart_rate' && value > 100) level = 'high'
      else if (chartType.value === 'heart_rate' && value < 60) level = 'low'
    }
    days.push({ date, value: value !== null ? (Number.isInteger(Number(value)) ? Number(value) : Number(value).toFixed(1)) : '-', rawValue: value, level })
  }
  return days
})

const barHeight = (val) => {
  if (val === '-' || val === null) return 6
  const nums = chartData.value.map(d => d.rawValue).filter(v => v !== null)
  if (nums.length === 0) return 20
  const max = Math.max(...nums)
  const min = Math.min(...nums)
  if (max === min) return 60
  const numVal = typeof val === 'number' ? val : parseFloat(val)
  return 20 + ((numVal - min) / (max - min)) * 100
}

// 筛选与分页
const filterType = ref('')
const filteredRecords = computed(() =>
  records.value
    .filter(r => !filterType.value || r.type === filterType.value)
    .sort((a,b) => b.record_time.localeCompare(a.record_time))
)

const currentPage = ref(1)
const pageSize = 10
const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredRecords.value.slice(start, start + pageSize)
})

watch(filterType, () => { currentPage.value = 1 })

// 评估
const evalLevel = (row) => {
  const t = row.type
  const v = row.value1
  if (t === 'blood_pressure') {
    if (v >= 140 || row.value2 >= 90) return { tagType: 'danger', text: '偏高' }
    if (v < 90) return { tagType: 'warning', text: '偏低' }
  }
  if (t === 'blood_sugar') {
    if (v > 7.0) return { tagType: 'danger', text: '偏高' }
    if (v < 3.9) return { tagType: 'warning', text: '偏低' }
  }
  if (t === 'heart_rate') {
    if (v > 100) return { tagType: 'warning', text: '偏快' }
    if (v < 60) return { tagType: 'warning', text: '偏慢' }
  }
  return { tagType: 'success', text: '正常' }
}

// 编辑记录
const editRecord = (row) => {
  editingId.value = row.id
  Object.assign(form, {
    type: row.type,
    value1: row.value1,
    value2: row.value2,
    record_time: row.record_time,
    remark: row.remark || ''
  })
  dialogVisible.value = true
}

// 删除记录（调用后端API）
const deleteRecord = (id) => {
  ElMessageBox.confirm('确定删除这条记录吗？', '删除确认', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning'
  }).then(async () => {
    try {
      await api.health.delete(id)
      const idx = records.value.findIndex(r => r.id === id)
      if (idx !== -1) records.value.splice(idx, 1)
      loadHealthStats()
      ElMessage.success('已删除')
    } catch (e) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {})
}

// 弹窗
const dialogVisible = ref(false)
const saving = ref(false)
const formRef = ref(null)
const editingId = ref(null)
const form = reactive({ type: '', value1: null, value2: null, record_time: '', remark: '' })
const rules = {
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  value1: [{ required: true, message: '请输入数值', trigger: 'blur' }],
  record_time: [{ required: true, message: '请选择时间', trigger: 'change' }],
}

const openAddDialog = (type = '') => {
  editingId.value = null
  Object.assign(form, { type, value1: null, value2: null, record_time: dayjs().format('YYYY-MM-DD HH:mm'), remark: '' })
  dialogVisible.value = true
}

const onTypeChange = () => { form.value1 = null; form.value2 = null }

// 提交表单（调用后端API）
const submitForm = async () => {
  if (!formRef.value) return
  await formRef.value.validate()
  saving.value = true
  try {
    if (editingId.value) {
      const res = await api.health.update(editingId.value, { ...form })
      if (res.code === 200) {
        const idx = records.value.findIndex(r => r.id === editingId.value)
        if (idx !== -1) Object.assign(records.value[idx], res.data)
        ElMessage.success('修改成功')
      }
    } else {
      const res = await api.health.create({ ...form })
      if (res.code === 200) {
        records.value.unshift(res.data)
        ElMessage.success('记录添加成功')
      }
    }
    loadHealthStats()
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    saving.value = false
    dialogVisible.value = false
  }
}

// 健康测量指南
const measureGuide = ref([
  { emoji: '🩺', title: '血压测量方法', steps: [
    '测量前静坐5分钟，避免剧烈运动',
    '袖带绑在上臂，松紧适中（能放入1-2根手指）',
    '手臂与心脏保持同一水平',
    '每次测量2-3次，取平均值记录',
    '建议每天早晨起床后和傍晚各测一次'
  ]},
  { emoji: '🩸', title: '血糖测量方法', steps: [
    '用温水清洗双手或用酒精消毒',
    '采血针刺手指侧面（痛感更小）',
    '弃去第一滴血，用第二滴血测量',
    '空腹血糖：至少8小时不进食后测量',
    '餐后血糖：从进食第一口开始计时2小时'
  ]},
  { emoji: '❤️', title: '心率测量方法', steps: [
    '安静休息5分钟后测量',
    '食指和中指轻按手腕桡动脉',
    '计数30秒内脉搏数，乘以2即为每分钟心率',
    '也可使用电子血压计自动测量',
    '运动后心率偏高属正常现象'
  ]},
  { emoji: '⚖️', title: '体重测量方法', steps: [
    '每天固定时间测量（建议早晨）',
    '排空大小便，穿着轻便衣物',
    '站在体重计中央，身体保持平衡',
    '不要频繁称重，每周1-2次即可',
    '注意体重突然变化（短期内增减5%以上应就医）'
  ]},
])

// 健康管理小贴士
const healthTips = ref([
  { title: '坚持规律测量', desc: '每天固定时间测量血压血糖，数据才有可比性。建议建立测量习惯，如每天早餐前测血压和空腹血糖。' },
  { title: '做好记录管理', desc: '每次测量后及时记录到平台。长期的健康数据可以帮助医生更准确地评估健康状况和调整治疗方案。' },
  { title: '关注数值变化趋势', desc: '单次测量数据仅供参考，重要的是长期趋势。如果连续多次出现异常值，请及时就医检查。' },
  { title: '季节性注意事项', desc: '冬季血压通常偏高，夏季偏低；冬季血糖波动较大。换季时应增加测量频率，必要时调整药物。' },
  { title: '运动与监测', desc: '运动前测血压，运动中注意心率不超过（220-年龄）的70%。运动后休息10分钟再测量恢复情况。' },
  { title: '情绪与健康', desc: '紧张、焦虑会导致血压升高、心率加快。测量前保持放松心态，如果心情不好可以稍后再测。' },
])

// 生命周期
onMounted(() => {
  loadRecords()
  loadHealthStats()
})
</script>

<style scoped>
.health-page { max-width: 1000px; margin: 0 auto; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 22px; font-weight: 700; color: var(--primary-color); display: flex; align-items: center; gap: 8px; margin: 0; }
.page-subtitle { font-size: 15px; color: #888; margin: 4px 0 0; }

/* 指标卡片 */
.indicator-row { margin-bottom: 20px; }
.indicator-card {
  background: #fff; border-radius: 12px; padding: 16px 12px;
  display: flex; align-items: center; gap: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,.07); position: relative;
  border-left: 5px solid #91d5ff; margin-bottom: 16px;
}
.indicator-card.high { border-left-color: #ff4d4f; background: #fff2f0; }
.indicator-card.low  { border-left-color: #faad14; background: #fffbe6; }
.indicator-card.normal { border-left-color: #52c41a; background: #f6ffed; }
.ind-icon { font-size: 28px; color: var(--primary-color); }
.ind-body { flex: 1; }
.ind-value { font-size: 22px; font-weight: 700; color: #222; }
.ind-name { font-size: 13px; color: #888; }
.ind-level-text { font-size: 12px; font-weight: 600; color: #52c41a; }
.indicator-card.high .ind-level-text { color: #ff4d4f; }
.indicator-card.low  .ind-level-text { color: #faad14; }
.indicator-card.normal .ind-level-text { color: #52c41a; }
.ind-add-btn { position: absolute; top: 8px; right: 8px; }

/* 分析卡片 */
.analysis-card {
  background: #f8f9fa; border-radius: 10px; padding: 16px;
  border-left: 4px solid #91d5ff; margin-bottom: 16px;
}
.analysis-card.danger  { border-left-color: #ff4d4f; }
.analysis-card.warning { border-left-color: #faad14; }
.analysis-card.success { border-left-color: #52c41a; }
.analysis-card h3 { margin: 0 0 12px; font-size: 16px; color: #333; }
.analysis-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 4px 0; font-size: 13px; color: #666;
}
.analysis-row strong { color: #333; }

/* 通用卡片 */
.section-card { background: #fff; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 2px 12px rgba(0,0,0,.07); }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px; }
.section-title { font-size: 18px; font-weight: 600; color: #333; display: flex; align-items: center; gap: 8px; margin: 0 0 16px; }
.section-header .section-title { margin-bottom: 0; }
.filter-bar { display: flex; gap: 8px; }

/* 简易柱状图 */
.simple-chart { padding: 10px 0; }
.chart-bars { display: flex; justify-content: space-around; align-items: flex-end; height: 160px; gap: 4px; }
.chart-col { display: flex; flex-direction: column; align-items: center; flex: 1; }
.bar-label { font-size: 13px; color: #444; margin-bottom: 4px; font-weight: 600; }
.bar-wrap { display: flex; align-items: flex-end; height: 120px; }
.bar { width: 28px; border-radius: 6px 6px 0 0; background: #91d5ff; transition: height .4s; min-height: 6px; }
.bar.high { background: #ff7875; }
.bar.low  { background: #ffc53d; }
.bar.normal { background: #73d13d; }
.bar-date { font-size: 11px; color: #aaa; margin-top: 4px; }
.chart-hint { text-align: center; font-size: 13px; color: #aaa; margin-top: 12px; }
.chart-empty { text-align: center; padding: 40px; color: #aaa; }
.chart-empty p { margin: 10px 0; }
.chart-empty .el-button { margin-top: 10px; }

/* 表格数值 */
.record-value { font-size: 16px; font-weight: 600; }
.record-unit { font-size: 12px; color: #888; margin-left: 2px; }
.form-hint { font-size: 12px; color: #aaa; margin-top: 4px; display: block; }
.pagination-wrap { display: flex; justify-content: center; margin-top: 16px; }

@media (max-width: 600px) {
  .indicator-card { flex-direction: column; text-align: center; }
  .ind-add-btn { position: static; margin-top: 8px; }
  .guide-grid { grid-template-columns: 1fr; }
  .health-tip { flex-direction: column; }
}

/* 测量指南 */
.guide-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}
.guide-item {
  padding: var(--spacing-md);
  background: #f6ffed;
  border-radius: 10px;
  border-left: 4px solid #52c41a;
}
.guide-emoji { font-size: 28px; margin-bottom: 8px; }
.guide-content h4 { font-size: 16px; color: #333; margin-bottom: 8px; }
.guide-content p { font-size: 13px; color: #555; line-height: 1.6; margin: 3px 0; padding-left: 12px; position: relative; }
.guide-content p::before { content: '•'; position: absolute; left: 0; color: #52c41a; }

/* 健康贴士 */
.health-tips-list { display: flex; flex-direction: column; gap: 12px; margin-top: var(--spacing-lg); }
.health-tip {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px;
  background: #f8f9fa;
  border-radius: 10px;
  border-left: 4px solid #1890ff;
}
.tip-num {
  width: 28px; height: 28px; border-radius: 50%; background: #1890ff; color: white;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 600; flex-shrink: 0;
}
.tip-content strong { font-size: 15px; color: #333; display: block; margin-bottom: 4px; }
.tip-content p { font-size: 13px; color: #666; line-height: 1.6; margin: 0; }
</style>
