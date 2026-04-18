<template>
  <AdminLayout>
    <div class="admin-logs">
      <div class="page-header">
        <h1 class="page-title">操作日志</h1>
        <div class="filter-bar">
          <el-date-picker v-model="dateRange" type="daterange" size="large"
            start-placeholder="开始日期" end-placeholder="结束日期" style="width:240px"
            value-format="YYYY-MM-DD" @change="handleDateChange" />
          <el-button type="primary" size="large" @click="loadLogs">
            <el-icon><Search /></el-icon> 查询
          </el-button>
          <el-button size="large" @click="resetFilter">重置</el-button>
        </div>
      </div>

      <div class="section-card">
        <!-- 统计条 -->
        <div class="stats-bar" v-if="!loading">
          共 <b>{{ total }}</b> 条日志
          <span v-if="dateRange && dateRange[0]">（{{ dateRange[0] }} 至 {{ dateRange[1] }}）</span>
        </div>

        <el-table :data="logs" stripe size="large" style="width:100%" v-loading="loading">
          <el-table-column label="ID" prop="id" width="65" align="center" />
          <el-table-column label="操作人" width="120">
            <template #default="{ row }">
              <span>{{ row.user_name || '–' }}</span>
              <div class="sub-text" v-if="row.phone">{{ row.phone }}</div>
            </template>
          </el-table-column>
          <el-table-column label="操作内容" prop="action" min-width="200" />
          <el-table-column label="IP地址" width="140">
            <template #default="{ row }">
              {{ row.ip_address || '–' }}
            </template>
          </el-table-column>
          <el-table-column label="操作时间" min-width="170">
            <template #default="{ row }">
              {{ formatTime(row.create_time) }}
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next, jumper"
            background
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import AdminLayout from './AdminLayout.vue'
import { api } from '@/utils/request'

const loading = ref(false)
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const logs = ref([])

const formatTime = (t) => {
  if (!t) return '–'
  return t.replace('T', ' ').substring(0, 19)
}

const loadLogs = async () => {
  loading.value = true
  try {
    const params = { page: currentPage.value, pageSize: pageSize.value }
    if (dateRange.value && dateRange.value[0]) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    const res = await api.admin.getLogs(params)
    if (res.code === 200) {
      logs.value = res.data.list || []
      total.value = res.data.pagination?.total || 0
    }
  } catch (e) {
    ElMessage.error('加载操作日志失败')
  } finally {
    loading.value = false
  }
}

const handleDateChange = () => {
  currentPage.value = 1
  loadLogs()
}

const handlePageChange = (page) => {
  currentPage.value = page
  loadLogs()
}

const resetFilter = () => {
  dateRange.value = []
  currentPage.value = 1
  loadLogs()
}

onMounted(loadLogs)
</script>

<style scoped>
.admin-logs { max-width: 1200px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 22px; font-weight: 700; margin: 0; }
.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.section-card { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.07); }
.stats-bar { font-size: 14px; color: #666; margin-bottom: 12px; }
.stats-bar b { color: #1677ff; }
.sub-text { font-size: 12px; color: #999; margin-top: 2px; }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
