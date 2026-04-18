<template>
  <AdminLayout>
    <div class="admin-settings">
      <h1 class="page-title">系统设置</h1>

      <!-- 修改管理员密码 -->
      <div class="section-card">
        <h2 class="section-title"><el-icon><Lock /></el-icon> 修改管理员密码</h2>
        <el-form ref="pwFormRef" :model="pwForm" :rules="pwRules" label-width="110px" size="large" style="max-width:460px">
          <el-form-item label="当前密码" prop="oldPassword">
            <el-input v-model="pwForm.oldPassword" type="password" show-password placeholder="请输入当前密码" />
          </el-form-item>
          <el-form-item label="新密码" prop="newPassword">
            <el-input v-model="pwForm.newPassword" type="password" show-password placeholder="至少6位" />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input v-model="pwForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" :loading="pwSaving" @click="changePassword">确认修改</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 基础配置 -->
      <div class="section-card">
        <h2 class="section-title"><el-icon><Setting /></el-icon> 基础配置</h2>
        <el-form :model="sysConfig" label-width="160px" size="large" style="max-width:520px">
          <el-form-item label="平台名称">
            <el-input v-model="sysConfig.platformName" />
          </el-form-item>
          <el-form-item label="客服电话">
            <el-input v-model="sysConfig.servicePhone" />
          </el-form-item>
          <el-form-item label="用药提醒提前(分钟)">
            <el-input-number v-model="sysConfig.reminderAdvance" :min="5" :max="60" style="width:100%" />
          </el-form-item>
          <el-form-item label="用户注册">
            <el-switch v-model="sysConfig.allowRegister" active-text="允许" inactive-text="禁止" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" size="large" @click="saveConfig">保存配置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 系统信息 -->
      <div class="section-card">
        <h2 class="section-title"><el-icon><InfoFilled /></el-icon> 系统信息</h2>
        <el-descriptions :column="2" border size="large">
          <el-descriptions-item label="系统版本">v1.0.0</el-descriptions-item>
          <el-descriptions-item label="后端框架">Node.js + Express</el-descriptions-item>
          <el-descriptions-item label="前端框架">Vue3 + Element Plus</el-descriptions-item>
          <el-descriptions-item label="数据库">MySQL 8.0.12</el-descriptions-item>
          <el-descriptions-item label="部署时间">2026-04-14</el-descriptions-item>
          <el-descriptions-item label="运行状态"><el-tag type="success">运行中</el-tag></el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Lock, Setting, InfoFilled } from '@element-plus/icons-vue'
import AdminLayout from './AdminLayout.vue'

const pwFormRef = ref(null)
const pwSaving = ref(false)
const pwForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const pwRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [{ required: true, min: 6, message: '密码至少6位', trigger: 'blur' }],
  confirmPassword: [{
    validator: (r, v, cb) => v !== pwForm.newPassword ? cb(new Error('两次密码不一致')) : cb(),
    trigger: 'blur'
  }],
}

const changePassword = async () => {
  if (!pwFormRef.value) return
  await pwFormRef.value.validate()
  pwSaving.value = true
  await new Promise(r => setTimeout(r, 600))
  pwSaving.value = false
  Object.assign(pwForm, { oldPassword: '', newPassword: '', confirmPassword: '' })
  ElMessage.success('管理员密码已修改')
}

const sysConfig = reactive({
  platformName: '银发数字化·智慧养老平台',
  servicePhone: '400-123-4567',
  reminderAdvance: 15,
  allowRegister: true,
})

const saveConfig = () => ElMessage.success('配置已保存')
</script>

<style scoped>
.admin-settings { max-width: 900px; }
.page-title { font-size: 22px; font-weight: 700; margin: 0 0 20px; }
.section-card { background: #fff; border-radius: 10px; padding: 24px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,.07); }
.section-title { font-size: 16px; font-weight: 600; display: flex; align-items: center; gap: 8px; margin: 0 0 20px; }
</style>
