# 后端启动指南

English version: `START_EN.md`

## 本地开发模式

本地最快的开发回路建议先用 SQLite。

## 1. 设置环境变量

参考 `.env.example` 配置环境变量。

示例：

```bash
export DATABASE_URL_OVERRIDE="sqlite+aiosqlite:///./delivery_os.db"
export APP_AUTO_CREATE_TABLES=true
export APP_DEBUG=true
export APP_RUNTIME_WORKERS_ENABLED=true
```

## 2. 启动 API

在仓库根目录执行：

```bash
uvicorn modern_delivery_os.backend.app.main:app --reload --port 8100
```

## 3. 健康检查

打开：

```text
http://127.0.0.1:8100/health
http://127.0.0.1:8100/api
```

## 4. 当前功能集

后端目前已实现：

- 任务生命周期：create、qualify、inspect
- 计划生命周期：create、inspect、submit for review
- 审核生命周期：approve、request changes、reject
- work item 生命周期：create、progress update
- artifact 创建与查询
- activity timeline 查询
- supervisor 动作：pause、resume、retry、escalate、rollback、replan
- 通过请求头进行基于 actor 的权限校验
- dashboard 聚合：
  - summary
  - attention
  - teams
  - recent activity
  - dashboard bundle
- 通过 task bundle 聚合任务详情
- runtime 控制：
  - status
  - run once
  - pause / resume
  - task-level run once / sweep
- 后台 runtime orchestration：
  - 自动把 approved 任务派发成生成的 work items
  - 自动升级长时间 stalled 的 blocked 任务
  - 自动把已完成工作推进到 reporting-ready 和 done
- `/ws` WebSocket 实时事件

## 5. 示例链路

1. `POST /api/tasks`
2. `POST /api/tasks/{task_id}/qualify`
3. `POST /api/tasks/{task_id}/plan`
4. `POST /api/tasks/{task_id}/submit-review`
5. `POST /api/tasks/{task_id}/approve`
6. `POST /api/tasks/{task_id}/work-items`
7. `POST /api/work-items/{work_item_id}/progress`
8. `POST /api/tasks/{task_id}/artifacts`
9. `GET /api/tasks/{task_id}/bundle`
10. `GET /api/dashboard/bundle`
11. `POST /api/runtime/run-once`
12. `POST /api/runtime/tasks/{task_id}/run-once`

## 6. 实时能力

WebSocket 端点：

```text
ws://127.0.0.1:8100/ws?channels=global,task:TASK-123
```

当前实现会把任务事件广播到：

- `global`
- `task:{task_id}`

## 7. 项目结构提示

值得优先看的后端入口：

- `app/main.py`：FastAPI 应用和 lifespan 初始化
- `app/api/`：路由层
- `app/services/dashboard_service.py`：全局控制面聚合
- `app/services/task_bundle_service.py`：单任务聚合
- `app/services/runtime_service.py`：runtime orchestration 规则
- `app/runtime.py`：worker 循环和手动 runtime 控制
- `app/services/workflow.py`：状态流转规则
- `app/realtime.py`：WebSocket 广播管理器

## 8. Migration

初始 Alembic 脚手架位于：

```text
modern_delivery_os/backend/migration/
```

在 MVP 开发阶段，`APP_AUTO_CREATE_TABLES=true` 是可接受的。
当 schema 稳定后，更推荐所有变更都通过 migration 管理。

## 9. Demo Seed

如果你想为 Board、Attention、Teams、Task Detail 生成更真实的样例任务，可以执行：

```bash
python -m modern_delivery_os.backend.scripts.seed_demo
```

当前 seed 会生成：

- 等待审核的任务
- 执行中的任务
- 已阻塞且带 supervisor intervention 的任务
- 被退回修改计划的任务
