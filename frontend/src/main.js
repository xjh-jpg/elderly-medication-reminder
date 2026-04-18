import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/dist/index.css'
import '@/styles/index.css'

import App from './App.vue'
import router from './router'

// 创建应用
const app = createApp(App)

// 注册Element Plus
app.use(ElementPlus, {
  locale: zhCn,
  size: 'large' // 使用大尺寸组件
})

// 注意：图标按需引入，不再全量注册
// 每个 .vue 文件已自行 import 所需图标组件

// 使用路由和状态管理
app.use(createPinia())
app.use(router)

// 全局配置
app.config.globalProperties.$apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// 挂载应用
app.mount('#app')

console.log('智慧养老平台前端已启动！')