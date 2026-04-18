<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <div class="admin-sidebar">
      <div class="sidebar-logo">
        <el-icon><House /></el-icon>
        <span>管理后台</span>
      </div>
      <el-menu
        :default-active="currentPath"
        background-color="#001529"
        text-color="#ffffffa0"
        active-text-color="#ffffff"
        router
      >
        <el-menu-item index="/admin/dashboard"><el-icon><Odometer /></el-icon><span>概览</span></el-menu-item>
        <el-menu-item index="/admin/users"><el-icon><User /></el-icon><span>用户管理</span></el-menu-item>
        <el-menu-item index="/admin/data"><el-icon><Histogram /></el-icon><span>数据管理</span></el-menu-item>
        <el-menu-item index="/admin/logs"><el-icon><List /></el-icon><span>操作日志</span></el-menu-item>
        <el-menu-item index="/admin/settings"><el-icon><Setting /></el-icon><span>系统设置</span></el-menu-item>
      </el-menu>
      <div class="sidebar-bottom">
        <el-button type="danger" text @click="logout">
          <el-icon><SwitchButton /></el-icon> 退出
        </el-button>
      </div>
    </div>
    <!-- 主内容区 -->
    <div class="admin-main">
      <div class="admin-topbar">
        <span class="topbar-title">银发数字化·智慧养老平台 管理系统</span>
        <span class="topbar-admin">管理员</span>
      </div>
      <div class="admin-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { House, Odometer, User, Histogram, List, Setting, SwitchButton } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const currentPath = computed(() => route.path)

const logout = () => {
  authStore.logout()
  ElMessage.success('已退出')
  router.push('/login')
}
</script>

<style scoped>
.admin-layout { display: flex; min-height: 100vh; background: #f0f2f5; }
.admin-sidebar {
  width: 220px; background: #001529; flex-shrink: 0;
  display: flex; flex-direction: column;
  position: fixed; left: 0; top: 0; bottom: 0; z-index: 100;
}
.sidebar-logo {
  display: flex; align-items: center; gap: 10px;
  color: white; font-size: 18px; font-weight: 700;
  padding: 20px 20px 14px;
  border-bottom: 1px solid rgba(255,255,255,.1);
}
.sidebar-logo .el-icon { font-size: 24px; color: #1890ff; }
.el-menu { border: none; flex: 1; }
.sidebar-bottom { padding: 16px; border-top: 1px solid rgba(255,255,255,.1); }
.admin-main { margin-left: 220px; flex: 1; display: flex; flex-direction: column; min-height: 100vh; }
.admin-topbar {
  background: #fff; height: 56px; display: flex; align-items: center;
  justify-content: space-between; padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,.1); position: sticky; top: 0; z-index: 99;
}
.topbar-title { font-size: 15px; color: #333; font-weight: 600; }
.topbar-admin { font-size: 14px; color: #888; }
.admin-content { padding: 24px; flex: 1; }

@media (max-width: 768px) {
  .admin-sidebar { width: 56px; }
  .sidebar-logo span, .el-menu-item span { display: none; }
  .admin-main { margin-left: 56px; }
}
</style>
