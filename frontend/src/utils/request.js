import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// 创建axios实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 添加token到请求头
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 添加请求时间戳
    config.headers['X-Request-Timestamp'] = Date.now()
    
    return config
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { data } = response
    
    // 如果返回的是文件流，直接返回
    if (response.config.responseType === 'blob') {
      return response
    }
    
    // 处理业务错误
    if (data.code !== 200 && data.code !== 0) {
      // 401未授权 —— 登录接口本身返回的401不清除token
      if (data.code === 401) {
        const isLoginRequest = response.config.url && response.config.url.includes('/api/auth/login')
        if (!isLoginRequest) {
          ElMessage.error('登录已过期，请重新登录')
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          router.push('/login')
        }
        return Promise.reject(new Error(data.message || '未授权'))
      }
      
      // 403权限不足
      if (data.code === 403) {
        ElMessage.error(data.message || '权限不足')
        return Promise.reject(new Error(data.message || '权限不足'))
      }
      
      // 其他业务错误
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    
    return data
  },
  (error) => {
    console.error('响应错误:', error)
    
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response
      const isLoginRequest = error.config.url && error.config.url.includes('/api/auth/login')
      
      switch (status) {
        case 400:
          ElMessage.error(data?.message || '请求参数错误')
          break
        case 401:
          // 登录接口的401只提示错误信息，不清token不跳转
          if (!isLoginRequest) {
            ElMessage.error('登录已过期，请重新登录')
            localStorage.removeItem('token')
            localStorage.removeItem('userInfo')
            router.push('/login')
          }
          break
        case 403:
          ElMessage.error(data?.message || '权限不足')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || `请求失败(${status})`)
      }
    } else if (error.request) {
      // 请求已发送但没有响应
      if (error.code === 'ECONNABORTED') {
        ElMessage.error('请求超时，请检查网络连接')
      } else {
        ElMessage.error('网络错误，请检查网络连接')
      }
    } else {
      // 请求配置错误
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

// API调用封装
export const api = {
  // 认证相关
  auth: {
    login: (data) => request.post('/api/auth/login', data),
    register: (data) => request.post('/api/auth/register', data),
    getCurrentUser: () => request.get('/api/auth/me'),
    changePassword: (data) => request.post('/api/auth/change-password', data),
    sendCode: (data) => request.post('/api/auth/send-code', data)
  },
  
  // 老人档案
  elder: {
    getProfile: (elderId) => request.get(`/api/elder/profile/${elderId || ''}`),
    updateProfile: (data) => request.put('/api/elder/profile', data),
    getEmergencyContacts: () => request.get('/api/elder/emergency-contacts'),
    getStats: () => request.get('/api/elder/stats'),
    getList: (params) => request.get('/api/elder/list', { params })
  },
  
  // 用药提醒
  medication: {
    getList: (params) => request.get('/api/medication', { params }),
    getToday: () => request.get('/api/medication/today'),
    create: (data) => request.post('/api/medication', data),
    update: (id, data) => request.put(`/api/medication/${id}`, data),
    markStatus: (id, status) => request.patch(`/api/medication/${id}/status`, { status }),
    delete: (id) => request.delete(`/api/medication/${id}`),
    getStats: (params) => request.get('/api/medication/stats', { params })
  },
  
  // 健康记录
  health: {
    getList: (params) => request.get('/api/health', { params }),
    getLatest: () => request.get('/api/health/latest'),
    create: (data) => request.post('/api/health', data),
    update: (id, data) => request.put(`/api/health/${id}`, data),
    delete: (id) => request.delete(`/api/health/${id}`),
    getStats: (params) => request.get('/api/health/stats', { params }),
    batchImport: (data) => request.post('/api/health/batch-import', data)
  },
  
  // 管理员
  admin: {
    login: (data) => request.post('/api/admin/login', data),
    getUserList: (params) => request.get('/api/admin/users', { params }),
    toggleUserStatus: (data) => request.post('/api/admin/users/toggle-status', data),
    getStats: () => request.get('/api/admin/stats'),
    exportData: (params) => request.get('/api/admin/export', { params }),
    getLogs: (params) => request.get('/api/admin/logs', { params }),
    getConfig: () => request.get('/api/admin/config'),
    changePassword: (data) => request.post('/api/admin/change-password', data)
  }
}

// 导出默认请求实例
export default request