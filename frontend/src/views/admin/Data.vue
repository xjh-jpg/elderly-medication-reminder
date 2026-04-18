<template>
  <AdminLayout>
    <div class="admin-data">
      <div class="page-header">
        <h1 class="page-title">数据管理</h1>
        <div class="header-actions">
          <el-select v-model="dataType" size="large" style="width:140px" @change="loadData">
            <el-option label="健康记录" value="health" />
            <el-option label="老人档案" value="elder" />
            <el-option label="用药记录" value="medication" />
          </el-select>
          <el-button type="primary" size="large" @click="exportCSV" :loading="exporting">
            <el-icon><Download /></el-icon> 导出CSV
          </el-button>
        </div>
      </div>

      <!-- 健康记录 -->
      <div class="section-card" v-if="dataType === 'health'">
        <h2 class="section-title">健康记录数据</h2>
        <el-table :data="tableData" stripe size="large" style="width:100%" v-loading="loading">
          <el-table-column label="老人姓名" prop="老人姓名" width="100" />
          <el-table-column label="类型" width="90">
            <template #default="{ row }">
              <el-tag size="small">{{ typeLabel(row.记录类型) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="数值">
            <template #default="{ row }">
              {{ row.值1 }}{{ row.值2 ? '/' + row.值2 : '' }} {{ typeUnit(row.记录类型) }}
            </template>
          </el-table-column>
          <el-table-column label="记录时间" prop="记录时间" min-width="150" />
          <el-table-column label="备注" prop="备注" min-width="120" />
        </el-table>
      </div>

      <!-- 老人档案 -->
      <div class="section-card" v-if="dataType === 'elder'">
        <h2 class="section-title">老人档案数据</h2>
        <el-table :data="tableData" stripe size="large" style="width:100%" v-loading="loading">
          <el-table-column label="姓名" prop="姓名" />
          <el-table-column label="年龄" prop="年龄" width="70" />
          <el-table-column label="性别" width="70">
            <template #default="{ row }">{{ row.性别 === 'male' ? '男' : (row.性别 === 'female' ? '女' : row.性别) }}</template>
          </el-table-column>
          <el-table-column label="身高(cm)" prop="身高" width="100" />
          <el-table-column label="体重(kg)" prop="体重" width="100" />
          <el-table-column label="既往病史" prop="既往病史" min-width="160" />
          <el-table-column label="紧急联系人" prop="紧急联系人" width="100" />
          <el-table-column label="联系电话" prop="紧急电话" min-width="130" />
        </el-table>
      </div>

      <!-- 用药记录 -->
      <div class="section-card" v-if="dataType === 'medication'">
        <h2 class="section-title">用药记录数据</h2>
        <el-table :data="tableData" stripe size="large" style="width:100%" v-loading="loading">
          <el-table-column label="老人姓名" prop="老人姓名" width="100" />
          <el-table-column label="药品名称" prop="药品名称" />
          <el-table-column label="剂量" prop="剂量" width="90" />
          <el-table-column label="频率" prop="频率" width="110" />
          <el-table-column label="服用时间" prop="服用时间" width="100" />
          <el-table-column label="备注" prop="备注" min-width="120" />
        </el-table>
      </div>

      <div class="empty-tip" v-if="!loading && tableData.length === 0">
        <el-empty description="暂无数据" />
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import AdminLayout from './AdminLayout.vue'
import { api } from '@/utils/request'

const dataType = ref('health')
const loading = ref(false)
const exporting = ref(false)
const tableData = ref([])

const typeLabel = (t) => ({ blood_pressure: '血压', blood_sugar: '血糖', heart_rate: '心率', weight: '体重' }[t] || t)
const typeUnit  = (t) => ({ blood_pressure: 'mmHg', blood_sugar: 'mmol/L', heart_rate: 'bpm', weight: 'kg' }[t] || '')

const loadData = async () => {
  loading.value = true
  tableData.value = []
  try {
    const res = await api.admin.exportData({ data_type: dataType.value })
    if (res.code === 200) {
      tableData.value = res.data.data || []
    }
  } catch (e) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 将数据导出为 CSV 文件（前端生成，无需后端额外接口）
const exportCSV = async () => {
  exporting.value = true
  try {
    // 先确保数据已加载
    if (!tableData.value.length) {
      await loadData()
    }
    if (!tableData.value.length) {
      ElMessage.warning('暂无数据可导出')
      return
    }
    const rows = tableData.value
    const headers = Object.keys(rows[0])
    const csvContent = [
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${(r[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const typeNames = { health: '健康记录', elder: '老人档案', medication: '用药记录' }
    link.download = `${typeNames[dataType.value]}_${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
    ElMessage.success('CSV文件已下载')
  } catch (e) {
    ElMessage.error('导出失败，请重试')
  } finally {
    exporting.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.admin-data { max-width: 1200px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 22px; font-weight: 700; margin: 0; }
.header-actions { display: flex; gap: 10px; }
.section-card { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.07); }
.section-title { font-size: 16px; font-weight: 600; margin: 0 0 16px; }
.empty-tip { margin-top: 20px; }
</style>
