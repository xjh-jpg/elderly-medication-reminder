# 银发数字化·智慧养老平台

> 面向老年人口与子女的健康管理与监护平台，适老化设计，简单易用。

---

## 📁 项目结构

```
elder-care-platform/
├── frontend/          # Vue3 前端
├── backend/           # Node.js + Express 后端
├── database/          # 数据库SQL文件
└── README.md
```

---

## 🚀 快速启动

### 第一步：初始化数据库

1. 启动 MySQL 8.0（确保端口3306运行）
2. 登录 MySQL，执行：

```sql
source database/init.sql
```

或使用 Navicat / MySQL Workbench 导入 `database/init.sql`

---

### 第二步：启动后端

```bash
cd backend
npm install
npm run dev
```

后端启动成功后显示：
```
银发数字化·智慧养老平台 API 服务器启动成功！
服务地址: http://localhost:3000
```

---

### 第三步：启动前端

```bash
cd frontend
npm install
npm run dev
```

前端启动成功后访问：**http://localhost:5173**

---

## 🔐 默认账号

| 角色 | 手机号 | 密码 |
|------|--------|------|
| 老人账号 | 13500000001 | 123456 |
| 老人账号 | 13500000002 | 123456 |
| 子女账号 | 13800000001 | 123456 |
| 管理员 | admin | 123456（在 /admin/dashboard 登录）|

---

## 📱 功能页面

| 路径 | 功能 |
|------|------|
| `/login` | 登录页 |
| `/register` | 注册页 |
| `/dashboard` | 首页仪表盘 |
| `/profile` | 老人档案管理 |
| `/medication` | 用药提醒 |
| `/health` | 健康记录 |
| `/emergency` | 紧急救助 |
| `/settings` | 个人中心 |
| `/admin/dashboard` | 管理员概览 |
| `/admin/users` | 用户管理 |
| `/admin/data` | 数据管理 |
| `/admin/logs` | 操作日志 |
| `/admin/settings` | 系统设置 |

---

## 🌐 API 接口

后端运行后可访问 **http://localhost:3000/api-docs** 查看完整接口文档。

| 前缀 | 说明 |
|------|------|
| `/api/auth/*` | 登录/注册/修改密码 |
| `/api/elder/*` | 老人档案 CRUD |
| `/api/medication/*` | 用药提醒 CRUD |
| `/api/health/*` | 健康记录 CRUD |
| `/api/admin/*` | 管理员功能 |

---

## 🛠 技术栈

- **前端**：Vue3 + Vite + Element Plus + Pinia + Vue Router
- **后端**：Node.js + Express + JWT + bcryptjs
- **数据库**：MySQL 8.0.12
- **端口**：前端 5173 / 后端 3000 / 数据库 3306

---

## ⚠️ 注意事项

1. 本平台**不提供医疗诊断**，健康数据仅供参考
2. 遇到紧急情况请拨打 **120**
3. 所有密码均经过 bcrypt 加密存储
4. 接口均需 JWT Token 鉴权（登录/注册接口除外）
