import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// 懒加载组件
const Login = () => import('@/views/Login.vue')
const Register = () => import('@/views/Register.vue')
const Dashboard = () => import('@/views/Dashboard.vue')
const ElderProfile = () => import('@/views/ElderProfile.vue')
const Medication = () => import('@/views/Medication.vue')
const HealthRecords = () => import('@/views/HealthRecords.vue')
const Emergency = () => import('@/views/Emergency.vue')
const Settings = () => import('@/views/Settings.vue')
const AdminDashboard = () => import('@/views/admin/Dashboard.vue')
const AdminUsers = () => import('@/views/admin/Users.vue')
const AdminData = () => import('@/views/admin/Data.vue')
const AdminLogs = () => import('@/views/admin/Logs.vue')
const AdminSettings = () => import('@/views/admin/Settings.vue')

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { title: '注册', requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Dashboard,
    meta: { title: '首页', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'ElderProfile',
    component: ElderProfile,
    meta: { title: '老人档案', requiresAuth: true }
  },
  {
    path: '/medication',
    name: 'Medication',
    component: Medication,
    meta: { title: '用药提醒', requiresAuth: true }
  },
  {
    path: '/health',
    name: 'HealthRecords',
    component: HealthRecords,
    meta: { title: '健康记录', requiresAuth: true }
  },
  {
    path: '/emergency',
    name: 'Emergency',
    component: Emergency,
    meta: { title: '紧急救助', requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { title: '个人中心', requiresAuth: true }
  },
  // 管理员路由
  {
    path: '/admin',
    name: 'Admin',
    redirect: '/admin/dashboard',
    meta: { title: '管理员', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: AdminDashboard,
    meta: { title: '管理首页', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/users',
    name: 'AdminUsers',
    component: AdminUsers,
    meta: { title: '用户管理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/data',
    name: 'AdminData',
    component: AdminData,
    meta: { title: '数据管理', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/logs',
    name: 'AdminLogs',
    component: AdminLogs,
    meta: { title: '操作日志', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/settings',
    name: 'AdminSettings',
    component: AdminSettings,
    meta: { title: '系统设置', requiresAuth: true, requiresAdmin: true }
  },
  // 404页面
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - 智慧养老平台`
  }
  
  // 检查是否需要认证
  if (to.meta.requiresAuth) {
    if (!authStore.isAuthenticated) {
      // 未登录，重定向到登录页
      next('/login')
      return
    }
    
    // 检查是否需要管理员权限
    if (to.meta.requiresAdmin && authStore.userRole !== 'admin') {
      // 非管理员，重定向到用户首页
      next('/dashboard')
      return
    }
  }
  
  // 如果已登录，访问登录/注册页时重定向到首页
  if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
    if (authStore.userRole === 'admin') {
      next('/admin/dashboard')
    } else {
      next('/dashboard')
    }
    return
  }
  
  next()
})

// 路由错误处理
router.onError((error) => {
  console.error('路由错误:', error)
})

export default router