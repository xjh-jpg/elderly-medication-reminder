<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  console.log('智慧养老平台前端已启动！')
})
</script>

<style scoped>
#app {
  min-height: 100vh;
  background-color: var(--bg-color);
}

/* 路由过渡动画 */
.router-enter-active,
.router-leave-active {
  transition: opacity 0.3s ease;
}

.router-enter-from,
.router-leave-to {
  opacity: 0;
}
</style>