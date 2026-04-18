<template>
  <div class="notification-bell" v-if="isLoggedIn">
    <el-popover
      placement="bottom-end"
      :width="320"
      trigger="click"
      v-model:visible="popVisible"
    >
      <template #reference>
        <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99" type="danger">
          <el-button circle text class="bell-btn" @click="popVisible = !popVisible">
            <el-icon :size="22"><Bell /></el-icon>
          </el-button>
        </el-badge>
      </template>

      <div class="notif-panel">
        <div class="notif-header">
          <span class="notif-title">消息通知</span>
          <el-button text size="small" @click="markAllRead" v-if="unreadCount > 0">全部已读</el-button>
        </div>

        <div class="notif-list" v-if="notifications.length">
          <div
            v-for="n in notifications"
            :key="n.id"
            :class="['notif-item', { unread: !n.read }]"
            @click="markRead(n)"
          >
            <el-icon :class="['notif-icon', n.type]"><component :is="n.icon" /></el-icon>
            <div class="notif-body">
              <p class="notif-msg">{{ n.message }}</p>
              <span class="notif-time">{{ n.time }}</span>
            </div>
            <div class="unread-dot" v-if="!n.read" />
          </div>
        </div>
        <el-empty v-else description="暂无通知" :image-size="60" />
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Bell, Warning, InfoFilled, SuccessFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/utils/request'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const isLoggedIn = computed(() => !!authStore.token)
const popVisible = ref(false)

// 通知列表
const notifications = ref([])
let pollTimer = null

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

const markRead = (n) => { n.read = true }
const markAllRead = () => { notifications.value.forEach(n => { n.read = true }) }

// 格式化时间
const fmtTime = (t) => {
  if (!t) return ''
  return dayjs(t).format('MM-DD HH:mm')
}

// 加载今日待服用药品作为通知
const loadMedNotifications = async () => {
  if (!isLoggedIn.value) return
  try {
    const res = await api.medication.getToday()
    if (res.code === 200 && res.data) {
      const pending = (res.data.pending || []).filter(m => m.status === 'pending')
      const now = dayjs()
      // 生成通知：距离服药时间 ≤60min 内的未服药提醒
      const newNotifs = pending
        .filter(m => {
          if (!m.take_time) return false
          const [h, min] = m.take_time.split(':').map(Number)
          const target = dayjs().hour(h).minute(min).second(0)
          const diff = target.diff(now, 'minute')
          return diff >= -5 && diff <= 60
        })
        .map(m => ({
          id: `med-${m.id}`,
          message: `💊 ${m.medicine_name} ${m.dosage}，服药时间 ${m.take_time?.substring(0, 5)}`,
          type: 'warning',
          icon: 'Warning',
          time: fmtTime(new Date()),
          read: false
        }))

      // 合并，避免重复
      const existIds = new Set(notifications.value.map(n => n.id))
      newNotifs.forEach(n => {
        if (!existIds.has(n.id)) notifications.value.unshift(n)
      })
      // 最多保留30条
      if (notifications.value.length > 30) notifications.value = notifications.value.slice(0, 30)
    }
  } catch (e) {
    // 静默失败
  }
}

onMounted(() => {
  loadMedNotifications()
  // 每5分钟刷新一次
  pollTimer = setInterval(loadMedNotifications, 5 * 60 * 1000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.notification-bell {
  display: inline-flex;
  align-items: center;
}
.bell-btn {
  color: rgba(255,255,255,0.9) !important;
  background: transparent !important;
  border: none !important;
  padding: 8px !important;
}
.bell-btn:hover {
  color: white !important;
  background: rgba(255,255,255,0.15) !important;
}
.notif-panel { max-height: 400px; overflow-y: auto; }
.notif-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px 8px; border-bottom: 1px solid #f0f0f0;
  font-weight: 600; font-size: 15px;
}
.notif-title { color: #333; }
.notif-list { padding: 4px 0; }
.notif-item {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 10px 14px; cursor: pointer; transition: background .2s;
  position: relative;
}
.notif-item:hover { background: #f5f7fa; }
.notif-item.unread { background: #fff9f0; }
.notif-icon {
  font-size: 20px; margin-top: 2px; flex-shrink: 0;
}
.notif-icon.warning { color: #faad14; }
.notif-icon.success { color: #52c41a; }
.notif-icon.info { color: #1890ff; }
.notif-body { flex: 1; min-width: 0; }
.notif-msg { font-size: 14px; color: #333; margin: 0 0 3px; line-height: 1.4; }
.notif-time { font-size: 12px; color: #aaa; }
.unread-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #ff4d4f; flex-shrink: 0; margin-top: 6px;
}
</style>
