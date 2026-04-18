import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    host: true
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  // 依赖预构建优化，减少首次加载时间
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'pinia',
      'element-plus',
      'element-plus/dist/locale/zh-cn.mjs',
      'axios',
      'dayjs',
      'dayjs/plugin/relativeTime'
    ]
  },
  // 构建优化
  build: {
    // 分包策略：将大型依赖单独打包，利用浏览器缓存
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus', 'element-plus/dist/locale/zh-cn.mjs'],
          'vue-vendor': ['vue', 'vue-router', 'pinia'],
          'utils': ['axios', 'dayjs']
        }
      }
    },
    // 提高压缩警告阈值（Element Plus 较大属于正常情况）
    chunkSizeWarningLimit: 600
  }
})
