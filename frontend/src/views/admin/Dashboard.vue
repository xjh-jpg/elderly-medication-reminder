<template>
  <AdminLayout>
    <div class="admin-dashboard">
      <h1 class="page-title">管理员概览</h1>
      <el-row :gutter="16" class="stat-row">
        <el-col :xs="12" :sm="6" v-for="s in stats" :key="s.label">
          <div class="stat-card" :style="{ borderTopColor: s.color }">
            <div class="stat-num" :style="{ color: s.color }">{{ s.value }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :xs="24" :md="12">
          <div class="section-card">
            <h2 class="section-title">最新注册用户</h2>
            <el-table :data="recentUsers" size="large" stripe v-loading="loading">
              <el-table-column label="姓名" prop="name" />
              <el-table-column label="手机号" prop="phone" />
              <el-table-column label="角色">
                <template #default="{ row }">
                  <el-tag :type="row.role === 'elder' ? 'success' : 'primary'" size="small">
                    {{ row.role === 'elder' ? '老人' : '子女' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="注册时间" prop="create_time" min-width="140" />
            </el-table>
          </div>
        </el-col>
        <el-col :xs="24" :md="12">
          <div class="section-card">
            <h2 class="section-title">近7天活跃用户</h2>
            <div class="active-list" v-loading="loading">
              <div v-for="user in activeUsers" :key="user.id" class="active-item">
                <el-avatar size="small" :style="{ background: user.role === 'elder' ? '#52c41a' : '#1890ff' }">
                  {{ user.name?.[0] }}
                </el-avatar>
                <div class="active-info">
                  <span class="active-name">{{ user.name }}</span>
                  <span class="active-sub">{{ user.role === 'elder' ? '老人' : '子女' }}</span>
                </div>
                <span class="active-time">{{ user.last_health_record || user.last_medication || '-' }}</span>
              </div>
              <div v-if="!activeUsers.length && !loading" class="empty-tip">暂无近期活跃用户</div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from './AdminLayout.vue'
import { ref, onMounted } from 'vue'
import { api } from '@/utils/request'

const loading = ref(false)

const stats = ref([
  { label: '总用户数', value: '-', color: '#1890ff' },
  { label: '老人账号', value: '-', color: '#52c41a' },
  { label: '子女账号', value: '-', color: '#faad14' },
  { label: '健康记录', value: '-', color: '#722ed1' },
])

const recentUsers = ref([])
const activeUsers = ref([])

const loadStats = async () => {
  loading.value = true
  try {
    const res = await api.admin.getStats()
    if (res.code === 200) {
      const d = res.data
      stats.value[0].value = d.user_stats?.total_users ?? 0
      stats.value[1].value = d.user_stats?.elder_count ?? 0
      stats.value[2].value = d.user_stats?.child_count ?? 0
      const healthTotal = (d.health_stats || []).reduce((sum, i) => sum + (i.record_count || 0), 0)
      stats.value[3].value = healthTotal
      activeUsers.value = d.active_users || []
    }
  } catch (e) {
    console.log('加载统计数据失败')
  } finally {
    loading.value = false
  }
}

const loadRecentUsers = async () => {
  try {
    const res = await api.admin.getUserList({ page: 1, pageSize: 5 })
    if (res.code === 200) {
      recentUsers.value = res.data.list || []
    }
  } catch (e) {
    console.log('加载用户列表失败')
  }
}

onMounted(() => {
  loadStats()
  loadRecentUsers()
})
</script>

<style scoped>
.admin-dashboard { max-width: 1200px; }
.page-title { font-size: 22px; font-weight: 700; color: #222; margin: 0 0 20px; }
.stat-row { margin-bottom: 20px; }
.stat-card {
  background: #fff; border-radius: 10px; padding: 20px 16px;
  border-top: 4px solid #1890ff; box-shadow: 0 2px 8px rgba(0,0,0,.07);
  margin-bottom: 16px; text-align: center;
}
.stat-num { font-size: 36px; font-weight: 700; }
.stat-label { font-size: 14px; color: #888; margin-top: 4px; }
.section-card { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.07); margin-bottom: 16px; }
.section-title { font-size: 16px; font-weight: 600; margin: 0 0 14px; }
.active-list { display: flex; flex-direction: column; gap: 10px; min-height: 60px; }
.active-item { display: flex; align-items: center; gap: 10px; font-size: 14px; }
.active-info { flex: 1; display: flex; flex-direction: column; }
.active-name { font-weight: 500; }
.active-sub { font-size: 12px; color: #888; }
.active-time { color: #aaa; font-size: 12px; white-space: nowrap; }
.empty-tip { color: #ccc; text-align: center; padding: 20px 0; font-size: 14px; }
</style>
