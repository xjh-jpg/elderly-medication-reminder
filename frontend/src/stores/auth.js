import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/request'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))
  const loading = ref(false)
  const error = ref(null)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => userInfo.value?.role || '')
  const userName = computed(() => userInfo.value?.name || '')
  const userPhone = computed(() => userInfo.value?.phone || '')
  const userId = computed(() => userInfo.value?.id || '')

  // 获取token
  const getToken = () => token.value

  // 登录（支持密码登录和验证码登录）
  const login = async (loginData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.auth.login(loginData)
      
      if (response.code === 200) {
        const { user, token: newToken, message } = response.data
        
        // 保存token和用户信息
        token.value = newToken
        userInfo.value = user
        
        localStorage.setItem('token', newToken)
        localStorage.setItem('userInfo', JSON.stringify(user))
        
        // 根据角色跳转
        if (user.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
        
        return { success: true, data: response.data, message }
      } else {
        // 处理其他状态码
        error.value = response.message || '登录失败'
        return { success: false, error: error.value }
      }
    } catch (err) {
      error.value = err.message || '登录失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (phone, password, name, role = 'elder', code = '') => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.auth.register({ phone, password, name, role, code })
      
      if (response.code === 200) {
        // 注册成功后自动登录
        return await login({ phone, password, loginType: 'password', role })
      }
    } catch (err) {
      error.value = err.message || '注册失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 获取当前用户信息
  const fetchCurrentUser = async () => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.auth.getCurrentUser()
      
      if (response.code === 200) {
        userInfo.value = response.data
        localStorage.setItem('userInfo', JSON.stringify(response.data))
        return { success: true, data: response.data }
      }
    } catch (err) {
      error.value = err.message || '获取用户信息失败'
      
      // 如果是认证失败，清除本地存储
      if (err.message.includes('未授权') || err.message.includes('401')) {
        logout()
      }
      
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 修改密码
  const changePassword = async (oldPassword, newPassword) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.auth.changePassword({
        old_password: oldPassword,
        new_password: newPassword
      })
      
      if (response.code === 200) {
        return { success: true, message: response.message }
      }
    } catch (err) {
      error.value = err.message || '修改密码失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 发送验证码
  const sendVerificationCode = async (phone) => {
    try {
      const response = await api.auth.sendCode({ phone })
      return { success: true, data: response.data }
    } catch (err) {
      return { success: false, error: err.message || '发送验证码失败' }
    }
  }

  // 管理员登录
  const adminLogin = async (account, password) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.admin.login({ account, password })
      
      if (response.code === 200) {
        const { admin, token: newToken } = response.data
        
        // 保存管理员token和信息
        token.value = newToken
        userInfo.value = {
          id: admin.id,
          account: admin.account,
          name: admin.name,
          role: 'admin',
          create_time: admin.create_time
        }
        
        localStorage.setItem('token', newToken)
        localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
        
        router.push('/admin')
        return { success: true, data: response.data }
      }
    } catch (err) {
      error.value = err.message || '管理员登录失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 修改管理员密码
  const changeAdminPassword = async (oldPassword, newPassword) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await api.admin.changePassword({
        old_password: oldPassword,
        new_password: newPassword
      })
      
      if (response.code === 200) {
        return { success: true, message: response.message }
      }
    } catch (err) {
      error.value = err.message || '修改管理员密码失败'
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  // 退出登录
  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    
    // 跳转到登录页
    router.push('/login')
  }

  // 检查权限
  const hasPermission = (requiredRoles) => {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }
    
    return requiredRoles.includes(userRole.value)
  }

  // 清理错误
  const clearError = () => {
    error.value = null
  }

  return {
    // 状态
    token,
    userInfo,
    loading,
    error,
    
    // 计算属性
    isAuthenticated,
    userRole,
    userName,
    userPhone,
    userId,
    
    // 方法
    getToken,
    login,
    register,
    fetchCurrentUser,
    changePassword,
    sendVerificationCode,
    adminLogin,
    changeAdminPassword,
    logout,
    hasPermission,
    clearError
  }
})