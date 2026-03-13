# 用户指南

English version: `user-guide_EN.md`

## 这个软件能做什么

AI Delivery Operating System 是一套多步骤交付工作的工作流控制面，用来把一个需求请求组织成可追踪、可审核、可恢复的执行链路：

1. 创建任务
2. Qualify 需求
3. 制定计划
4. 提交审核
5. 批准或退回修改
6. 创建并跟踪 work item
7. 挂载输出 artifact
8. 监控 runtime 自动化和 supervisor 干预

它当前更像一套现代化 control plane 和可演示的 MVP，而不是已经完全部署成熟的生产平台。

## 现在已经能做什么

- 管理任务从 intake 到完成的主流程
- 在 `Board`、`Attention`、`Teams`、`Task Detail` 页面查看任务状态
- 在 UI 中创建计划、work item、进度更新和 artifact
- 切换 actor 身份，模拟不同角色执行流程
- 让 runtime worker 自动派发已批准任务
- 暂停、恢复或手动触发 runtime orchestration
- 查看 runtime audit 事件和 supervisor escalation

## 适合谁使用

- Workflow supervisor
- 项目经理或交付经理
- 审核角色
- 负责执行队列的团队负责人
- 需要评估这套 operating model 的内部演示用户

## 当前有哪些页面

- `Board`：总览、runtime 状态、runtime audit
- `Attention`：需要干预或长时间阻塞的任务
- `Teams`：按团队查看 work item 执行情况
- `Task Detail`：查看完整任务链路、时间线、work、artifact、supervisor 动作
- `Settings`：切换 actor 身份、控制全局 runtime

## 安装要求

建议的本地环境：

- Python `3.11+`
- Node.js `18+`
- npm `9+`

面向未来部署设计的可选基础设施：

- PostgreSQL
- Redis

如果只是本地开发和演示，SQLite 就够用。

## 快速安装

在 `modern_delivery_os/` 目录下执行：

### 1. 安装后端依赖

```bash
python -m pip install -e .
```

### 2. 安装前端依赖

```bash
cd frontend
npm install
cd ..
```

### 3. 配置环境变量

后端示例：

```bash
export DATABASE_URL_OVERRIDE="sqlite+aiosqlite:///./delivery_os.db"
export APP_AUTO_CREATE_TABLES=true
export APP_RUNTIME_WORKERS_ENABLED=true
```

前端示例：

```bash
cd frontend
cp .env.example .env
```

然后设置：

```text
VITE_API_BASE=http://127.0.0.1:8100/api
```

## 本地启动

### 启动后端

```bash
make -C modern_delivery_os backend-dev
```

默认后端地址：

```text
http://127.0.0.1:8100
```

### 启动前端

```bash
make -C modern_delivery_os frontend-dev
```

默认前端地址：

```text
http://127.0.0.1:4173
```

### 导入演示数据

```bash
make -C modern_delivery_os seed-demo
```

## 第一次使用建议流程

1. 打开前端页面
2. 在 Board 页面创建一个任务
3. 如有需要，在 Settings 或 Sidebar 中切换 actor
4. 对任务做 qualify 和 planning
5. 提交审核并批准
6. 让 runtime 自动生成 work，或者手动创建 work
7. 更新 work 进度
8. 增加 artifact
9. 查看任务时间线和 runtime audit

## 常用命令

```bash
make -C modern_delivery_os backend-dev
make -C modern_delivery_os frontend-dev
make -C modern_delivery_os frontend-build
make -C modern_delivery_os backend-test
make -C modern_delivery_os seed-demo
```

## 当前限制

- 还没有完整认证系统
- 还没有生产级 worker fleet
- `Inbox` 和 `Templates` 页面还没实现
- 测试目前主要覆盖 MVP 主流程
- 当前更适合本地开发、产品演示和设计验证

## 继续了解

- 英文用户指南：`docs/user-guide_EN.md`
- 产品设计：`docs/final-plan.md`
- 后端启动说明：`backend/START.md`
- 前端说明：`frontend/README.md`
