<template>
  <AdminLayout>
    <div class="admin-users">
      <div class="page-header">
        <h1 class="page-title">用户管理</h1>
        <div class="filter-bar">
          <el-input v-model="search" placeholder="搜索姓名/手机号" clearable size="large" style="width:200px" @keyup.enter="loadUsers">
            <template #prefix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-select v-model="roleFilter" placeholder="全部角色" clearable size="large" style="width:130px" @change="loadUsers">
            <el-option label="老人账号" value="elder" />
            <el-option label="子女账号" value="child" />
          </el-select>
          <el-button type="primary" size="large" @click="loadUsers">
            <el-icon><Search /></el-icon> 搜索
          </el-button>
        </div>
      </div>

      <div class="section-card">
        <el-table :data="users" stripe size="large" style="width:100%" v-loading="loading">
          <el-table-column label="ID" prop="id" width="60" />
          <el-table-column label="姓名" prop="name" />
          <el-table-column label="手机号" prop="phone" />
          <el-table-column label="角色" width="100">
            <template #default="{ row }">
              <el-tag :type="row.role === 'elder' ? 'success' : 'primary'" size="small">
                {{ row.role === 'elder' ? '老人' : '子女' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
                {{ row.status === 'active' ? '正常' : '已禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="注册时间" prop="create_time" min-width="150" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button
                size="small"
                :type="row.status === 'active' ? 'warning' : 'success'"
                :loading="togglingId === row.id"
                @click="toggleStatus(row)"
              >
                {{ row.status === 'active' ? '禁用' : '启用' }}
              </el-button>
              <el-button size="small" type="info" plain @click="viewUser(row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination">
          <el-pagination
            v-model:current-page="currentPage"
            :page-size="pageSize"
            :total="total"
            layout="total, prev, pager, next"
            background
            @current-change="loadUsers"
          />
        </div>
      </div>

      <!-- 用户详情弹窗 -->
      <el-dialog v-model="detailVisible" title="用户详情" width="480px">
        <el-descriptions :column="2" border size="large" v-if="currentUser">
          <el-descriptions-item label="姓名">{{ currentUser.name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
          <el-descriptions-item label="角色">{{ currentUser.role === 'elder' ? '老人' : '子女' }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ currentUser.status === 'active' ? '正常' : '已禁用' }}</el-descriptions-item>
          <el-descriptions-item label="注册时间" :span="2">{{ currentUser.create_time }}</el-descriptions-item>
          <template v-if="currentUser.profile">
            <el-descriptions-item label="年龄">{{ currentUser.profile.age || '-' }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ currentUser.profile.gender === 'male' ? '男' : '女' }}</el-descriptions-item>
            <el-descriptions-item label="既往病史" :span="2">{{ currentUser.profile.history_disease || '无' }}</el-descriptions-item>
            <el-descriptions-item label="紧急联系人">{{ currentUser.profile.emergency_contact || '-' }}</el-descriptions-item>
            <el-descriptions-item label="联系电话">{{ currentUser.profile.emergency_phone || '-' }}</el-descriptions-item>
          </template>
        </el-descriptions>
        <template #footer>
          <el-button @click="detailVisible = false">关闭</el-button>
        </template>
      </el-dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import AdminLayout from './AdminLayout.vue'
import { api } from '@/utils/request'

const search = ref('')
const roleFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const togglingId = ref(null)
const detailVisible = ref(false)
const currentUser = ref(null)
const users = ref([])

const loadUsers = async () => {
  loading.value = true
  try {
    const params = { page: currentPage.value, pageSize: pageSize.value }
    if (search.value) params.name = search.value
    if (roleFilter.value) params.role = roleFilter.value
    const res = await api.admin.getUserList(params)
    if (res.code === 200) {
      users.value = res.data.list || []
      total.value = res.data.pagination?.total || 0
    }
  } catch (e) {
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const toggleStatus = (row) => {
  const action = row.status === 'active' ? '禁用' : '启用'
  ElMessageBox.confirm(`确定要${action}用户 ${row.name} 吗？`, `${action}用户`, {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(async () => {
    togglingId.value = row.id
    try {
      const apiAction = row.status === 'active' ? 'disable' : 'enable'
      const res = await api.admin.toggleUserStatus({ user_id: row.id, action: apiAction })
      if (res.code === 200) {
        row.status = row.status === 'active' ? 'disabled' : 'active'
        ElMessage.success(`已${action}`)
      }
    } catch (e) {
      ElMessage.error(`${action}失败`)
    } finally {
      togglingId.value = null
    }
  }).catch(() => {})
}

const viewUser = (row) => {
  currentUser.value = row
  detailVisible.value = true
}

onMounted(loadUsers)
</script>

<style scoped>
.admin-users { max-width: 1200px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 22px; font-weight: 700; margin: 0; }
.filter-bar { display: flex; gap: 10px; flex-wrap: wrap; }
.section-card { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.07); }
.pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
