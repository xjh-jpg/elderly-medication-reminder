<template>
  <div class="layout">
    <!-- 适老化顶部导航 -->
    <header class="layout-header">
      <div class="header-container">
        <!-- 左侧：品牌标识 -->
        <div class="header-brand">
          <router-link to="/dashboard" class="brand-link">
            <el-icon size="28"><House /></el-icon>
            <span class="brand-text">智慧养老平台</span>
          </router-link>
        </div>
        
        <!-- 中间：主要功能导航 -->
        <nav class="header-nav">
          <ul class="nav-list">
            <li v-for="item in navItems" :key="item.path">
              <router-link
                :to="item.path"
                :class="['nav-link', { active: isActive(item.path) }]"
              >
                <el-icon class="nav-icon">
                  <component :is="item.icon" />
                </el-icon>
                <span class="nav-text">{{ item.title }}</span>
              </router-link>
            </li>
          </ul>
        </nav>
        
        <!-- 右侧：通知铃铛 + 用户信息 -->
        <div class="header-user">
          <NotificationBell />
          <el-dropdown @command="handleCommand" class="user-dropdown">
            <span class="user-info">
              <el-icon size="20" class="user-icon"><Avatar /></el-icon>
              <span class="user-name">{{ userInfo.name }}</span>
              <el-icon class="arrow-icon"><ArrowDown /></el-icon>
            </span>
            
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="dashboard">
                  <el-icon><House /></el-icon>
                  <span>返回首页</span>
                </el-dropdown-item>
                
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  <span>个人资料</span>
                </el-dropdown-item>
                
                <el-dropdown-item command="settings">
                  <el-icon><Setting /></el-icon>
                  <span>系统设置</span>
                </el-dropdown-item>
                
                <el-dropdown-item divided command="logout">
                  <el-icon><SwitchButton /></el-icon>
                  <span>退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>
    
    <!-- 主内容区域 -->
    <main class="layout-main">
      <slot></slot>
    </main>
    
    <!-- 适老化底部 -->
    <footer class="layout-footer">
      <div class="footer-container">
        <div class="footer-section">
          <h4>📞 紧急联系方式</h4>
          <p>急救电话：120</p>
          <p>家属电话：请完善紧急联系人</p>
        </div>
        
        <div class="footer-section">
          <h4>🔒 安全提醒</h4>
          <p>定期更新密码</p>
          <p>勿向他人透露个人信息</p>
        </div>
        
        <div class="footer-section">
          <h4>📱 操作指南</h4>
          <p>字体可放大</p>
          <p>按钮尺寸较大便于点击</p>
        </div>
        
        <div class="footer-section">
          <h4>🏥 重要声明</h4>
          <p>本平台不做医疗诊断</p>
          <p>如有不适请及时就医</p>
        </div>
      </div>
      
      <div class="footer-copyright">
        <p>© 2026 银发数字化·智慧养老平台 | 服务热线：400-123-4567</p>
      </div>
    </footer>
    
    <!-- 紧急呼叫浮动按钮 -->
    <div class="emergency-float">
      <el-button 
        type="danger" 
        size="large"
        circle
        class="emergency-btn"
        @click="handleEmergencyCall"
      >
        <el-icon><PhoneFilled /></el-icon>
      </el-button>
      <span class="emergency-label">紧急呼叫</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { 
  House, Avatar, ArrowDown, User, Setting, SwitchButton, PhoneFilled
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import NotificationBell from '@/components/NotificationBell.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// 用户信息
const userInfo = computed(() => authStore.userInfo || {})

// 导航项配置
const navItems = computed(() => {
  const items = [
    { path: '/dashboard', title: '首页', icon: 'House' },
    { path: '/profile', title: '老人档案', icon: 'User' },
    { path: '/medication', title: '用药提醒', icon: 'Bell' },
    { path: '/health', title: '健康记录', icon: 'Monitor' }
  ]
  
  // 如果是子女，添加家人管理
  if (userInfo.value.role === 'child') {
    items.push({ path: '/family', title: '家人管理', icon: 'UserFilled' })
  }
  
  return items
})

// 检查当前路由是否激活
const isActive = (path) => {
  return route.path === path
}

// 处理用户命令
const handleCommand = (command) => {
  switch (command) {
    case 'dashboard':
      router.push('/dashboard')
      break
      
    case 'profile':
      if (userInfo.value.role === 'elder') {
        router.push('/profile')
      } else {
        ElMessage.info('请前往家人管理查看老人档案')
      }
      break
      
    case 'settings':
      router.push('/settings')
      break
      
    case 'logout':
      handleLogout()
      break
  }
}

// 处理紧急呼叫
const handleEmergencyCall = async () => {
  const result = await ElMessageBox.confirm(
    '是否拨打紧急电话？',
    '紧急呼叫',
    {
      confirmButtonText: '拨打120',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'emergency-modal',
      closeOnClickModal: false
    }
  )
  
  if (result) {
    // 在实际应用中，这里会调用拨打电话功能
    ElMessage.success('已启动紧急呼叫，请保持电话畅通')
    
    // 记录紧急呼叫
    console.log('紧急呼叫记录')
  }
}

// 处理退出登录
const handleLogout = async () => {
  try {
    const result = await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '确认退出',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    if (result) {
      authStore.logout()
      ElMessage.success('已成功退出登录')
    }
  } catch (error) {
    // 用户取消
  }
}
</script>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-size: var(--font-size-base);
}

/* 头部样式 */
.layout-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: var(--spacing-sm) 0;
  box-shadow: var(--box-shadow);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 品牌标识 */
.header-brand {
  display: flex;
  align-items: center;
}

.brand-link {
  display: flex;
  align-items: center;
  color: white;
  text-decoration: none;
  gap: var(--spacing-sm);
}

.brand-link:hover {
  opacity: 0.9;
}

.brand-text {
  font-size: var(--font-size-lg);
  font-weight: 600;
}

/* 导航菜单 */
.header-nav {
  flex: 1;
  display: flex;
  justify-content: center;
}

.nav-list {
  display: flex;
  gap: var(--spacing-xl);
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  transition: all 0.3s;
  min-width: 80px;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.nav-link.active {
  background: rgba(255, 255, 255, 0.2);
  color: white;
}

.nav-icon {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-xs);
}

.nav-text {
  font-size: var(--font-size-sm);
  font-weight: 500;
}

/* 用户信息 */
.header-user {
  display: flex;
  align-items: center;
}

.user-dropdown {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: white;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--border-radius-sm);
  transition: background-color 0.3s;
}

.user-info:hover {
  background: rgba(255, 255, 255, 0.1);
}

.user-icon {
  background: rgba(255, 255, 255, 0.2);
  padding: 6px;
  border-radius: 50%;
}

.user-name {
  font-size: var(--font-size-base);
  font-weight: 500;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.arrow-icon {
  font-size: var(--font-size-sm);
}

/* 主内容区域 */
.layout-main {
  flex: 1;
  padding: var(--spacing-lg);
  background: var(--bg-color);
}

/* 底部样式 */
.layout-footer {
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
  color: white;
  padding: var(--spacing-xl) 0 var(--spacing-lg);
  font-size: var(--font-size-sm);
}

.footer-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-lg);
}

.footer-section h4 {
  color: var(--primary-light);
  margin-bottom: var(--spacing-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.footer-section p {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: var(--spacing-xs);
  line-height: 1.5;
}

.footer-copyright {
  text-align: center;
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.6);
  font-size: var(--font-size-xs);
}

/* 紧急呼叫浮动按钮 */
.emergency-float {
  position: fixed;
  bottom: 30px;
  right: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  z-index: 1000;
}

.emergency-btn {
  width: 60px;
  height: 60px;
  font-size: 24px;
  box-shadow: 0 6px 20px rgba(255, 77, 79, 0.4);
  animation: pulse-emergency 2s infinite;
}

.emergency-label {
  color: var(--danger-color);
  font-weight: 600;
  font-size: var(--font-size-sm);
  background: white;
  padding: 4px 8px;
  border-radius: var(--border-radius-sm);
  box-shadow: var(--box-shadow);
}

/* 动画 */
@keyframes pulse-emergency {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes fade {
  from { opacity: 0.5; }
  to { opacity: 1; }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-container {
    padding: 0 var(--spacing-md);
    flex-wrap: wrap;
    gap: var(--spacing-sm);
  }
  
  .header-nav {
    width: 100%;
    order: 3;
  }
  
  .nav-list {
    gap: var(--spacing-sm);
    justify-content: space-around;
  }

  .nav-link {
    min-width: 60px;
    padding: var(--spacing-xs) var(--spacing-sm);
  }

  .nav-text {
    font-size: 12px;
  }
  
  .footer-container {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }
  
  .emergency-float {
    bottom: 20px;
    right: 20px;
  }
}

@media (max-width: 480px) {
  .layout-header {
    padding: 6px 0 4px;
  }

  .header-container {
    padding: 0 var(--spacing-sm);
  }

  .brand-text {
    font-size: 15px;
  }

  .layout-main {
    padding: var(--spacing-sm);
  }
  
  .nav-list {
    flex-wrap: nowrap;
    justify-content: space-around;
    width: 100%;
  }

  .nav-link {
    min-width: 50px;
    padding: 4px 6px;
  }

  .nav-text {
    font-size: 11px;
  }
  
  .user-name {
    max-width: 60px;
    font-size: 14px;
  }
  
  .footer-container {
    grid-template-columns: 1fr;
    text-align: center;
  }
  
  .emergency-float {
    bottom: 15px;
    right: 15px;
  }
  
  .emergency-btn {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
}
</style>

<style>
/* 全局模态框样式 */
.emergency-modal .el-message-box {
  max-width: 400px;
  font-size: 16px !important;
  border: 2px solid var(--danger-color);
  border-radius: var(--border-radius);
}

.emergency-modal .el-message-box__header {
  background: var(--danger-color);
  color: white;
  padding: var(--spacing-md);
  border-radius: var(--border-radius) var(--border-radius) 0 0;
}

.emergency-modal .el-message-box__title {
  color: white;
  font-size: 18px !important;
  font-weight: 600;
}

.emergency-modal .el-message-box__content {
  padding: var(--spacing-lg);
  font-size: 16px !important;
  line-height: 1.6;
}

.emergency-modal .el-button {
  font-size: 16px !important;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--border-radius-sm);
}

.emergency-modal .el-button--primary {
  background: var(--danger-color);
  border-color: var(--danger-color);
}

.emergency-modal .el-button--primary:hover {
  background: #ff7875;
  border-color: #ff7875;
}
</style>