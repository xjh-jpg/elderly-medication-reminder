/**
 * 用药提醒服务
 * - 每分钟检查当前时间是否匹配某条用药提醒
 * - 匹配时弹出浏览器通知 + Element Plus 弹窗
 * - 支持开启/关闭、一次性注册
 */
import dayjs from 'dayjs'
import { ElNotification } from 'element-plus'

let timer = null
let notifiedKeys = new Set() // 当天已提醒过的 key，防止重复
let getMedications = null    // 外部传入的获取用药数据函数

/** 请求浏览器通知权限 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const perm = await Notification.requestPermission()
  return perm === 'granted'
}

/** 发送浏览器桌面通知 */
const sendBrowserNotification = (title, body) => {
  if (Notification.permission !== 'granted') return
  new Notification(title, {
    body,
    icon: '/favicon.ico',
    tag: 'medication-reminder'
  })
}

/** 检查用药时间，触发提醒 */
const checkMedications = () => {
  if (typeof getMedications !== 'function') return
  const meds = getMedications()
  if (!Array.isArray(meds) || meds.length === 0) return

  const now = dayjs()
  const todayStr = now.format('YYYY-MM-DD')
  const nowHM = now.format('HH:mm')

  // 每天0点清除已提醒记录
  const dayKey = `day-${todayStr}`
  if (!notifiedKeys.has(dayKey)) {
    notifiedKeys = new Set([dayKey])
  }

  meds.forEach(med => {
    if (!med.take_time) return
    // take_time 格式可能是 "HH:mm:ss" 或 "HH:mm"
    const medHM = med.take_time.substring(0, 5)
    if (medHM !== nowHM) return

    const key = `${todayStr}-${med.id}-${medHM}`
    if (notifiedKeys.has(key)) return // 已提醒过
    notifiedKeys.add(key)

    // 仅对 pending 状态的用药提醒
    if (med.status === 'taken') return

    const title = `💊 用药提醒`
    const body = `${med.medicine_name} ${med.dosage}，${med.remark || '请按时服药'}`

    // 浏览器桌面通知
    sendBrowserNotification(title, body)

    // Element Plus 页面内通知
    ElNotification({
      title,
      message: `${body}\n服用时间：${medHM}`,
      type: 'warning',
      duration: 8000,
      position: 'top-right',
      showClose: true
    })
  })
}

/**
 * 启动用药提醒定时器
 * @param {Function} getDataFn - 返回当前用药列表数组的函数
 */
export const startMedicationReminder = async (getDataFn) => {
  getMedications = getDataFn
  await requestNotificationPermission()

  if (timer) clearInterval(timer)
  // 立即检查一次
  checkMedications()
  // 每30秒检查一次（保证在整分钟时触发）
  timer = setInterval(checkMedications, 30 * 1000)
}

/** 停止用药提醒 */
export const stopMedicationReminder = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  getMedications = null
}
