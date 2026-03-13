# AI Delivery Operating System

当前多智能体交付系统的现代化重写版本。

English version: `README_EN.md`

## 这是什么

`modern_delivery_os/` 是下一代系统的独立实现线，用来把新架构和旧运行时隔离开，方便我们持续迭代、验证和演示，而不影响现有系统。

目前这个目录已经不是单纯的规划稿，而是一套可本地运行的垂直切片，覆盖了控制面、权限、runtime worker、实时刷新和前端控制台。

## 当前已实现

当前脚手架已经包含：

- 现代化角色与任务流转模型
- FastAPI control plane
- 兼容 SQLite / Postgres 的 SQLAlchemy 模型
- Alembic 初始化迁移
- task、plan、review、work item、artifact、activity、intervention 全链路
- 基于 actor 的写操作权限校验
- React 控制台，包含 `Board`、`Attention`、`Teams`、`Task Detail`、`Settings`
- WebSocket 实时刷新
- 轻量级 runtime worker，可自动派发已批准任务
- runtime 状态、审计视图和手动控制能力

## 当前状态

现在已经可以跑通如下主链路：

1. 创建任务
2. Qualify 任务
3. 创建计划
4. 提交审核
5. 批准 / 请求修改 / 拒绝
6. 创建 work item
7. 更新 work item 进度
8. 创建 artifact
9. 查看 task bundle、dashboard bundle、teams 和 activity
10. 让 runtime worker 为已批准计划自动生成执行 work item
11. 让 runtime worker 将已完成执行自动推进到 `ReadyToReport` 和 `Done`
12. 在 UI 中全局或按任务控制 runtime
13. 审计 runtime 生成的 work、event 和 escalation

## 后端能力概览

已实现的关键接口包括：

- `GET /health`
- `GET /api`
- `POST /api/tasks`
- `GET /api/tasks`
- `GET /api/tasks/{task_id}`
- `POST /api/tasks/{task_id}/qualify`
- `POST /api/tasks/{task_id}/plan`
- `POST /api/tasks/{task_id}/submit-review`
- `POST /api/tasks/{task_id}/approve`
- `POST /api/tasks/{task_id}/request-changes`
- `POST /api/tasks/{task_id}/reject`
- `POST /api/tasks/{task_id}/work-items`
- `POST /api/work-items/{work_item_id}/progress`
- `POST /api/tasks/{task_id}/artifacts`
- `GET /api/tasks/{task_id}/activity`
- `GET /api/tasks/{task_id}/bundle`
- `GET /api/dashboard/summary`
- `GET /api/dashboard/attention`
- `GET /api/dashboard/bundle`
- `GET /api/teams`
- `GET /api/teams/{team_name}/work-items`
- `GET /api/runtime/status`
- `POST /api/runtime/run-once`
- `POST /api/runtime/pause`
- `POST /api/runtime/resume`
- `POST /api/runtime/tasks/{task_id}/run-once`
- `POST /api/runtime/tasks/{task_id}/sweep`
- WebSocket 端点 `/ws`

## 前端能力概览

目前前端已经具备：

- `Board` 总览页
- `Attention` 队列页
- `Teams` 执行页
- `Task Detail` 任务详情页
- `Settings` 页面，用于 actor 切换和 runtime 控制
- 任务创建、计划、审核、work item、进度、artifact 表单
- runtime 状态面板、runtime audit 视图、任务级 runtime 操作
- 基于 WebSocket 的实时刷新
- 用于演示的 demo seed 脚本

## 目录结构

```text
modern_delivery_os/
  README.md
  README_EN.md
  CHECKLIST.md
  START_HERE.md
  docs/
  backend/
  frontend/
  tests/
```

## 建议先看哪里

- `docs/final-plan.md`：最终产品方向和架构规划
- `backend/START.md`：后端本地运行说明
- `frontend/README.md`：前端本地运行说明
- `backend/app/main.py`：FastAPI 入口
- `frontend/src/App.tsx`：前端应用壳和路由

## 演示数据

本地可以用下面的命令生成一组更真实的 demo 数据：

```bash
python -m modern_delivery_os.backend.scripts.seed_demo
```

会生成几类典型任务：

- 等待审核的任务
- 执行中的任务
- 已阻塞且带 intervention 历史的任务
- 被退回修改计划的任务

## 常用命令

```bash
make -C modern_delivery_os backend-dev
make -C modern_delivery_os frontend-dev
make -C modern_delivery_os frontend-build
make -C modern_delivery_os backend-test
make -C modern_delivery_os seed-demo
```

## 下一步建议

当前脚手架已经适合继续往下一层实现。比较高价值的下一步包括：

1. 增强 runtime 策略、重试机制和任务模板能力
2. 补强 supervisor 历史视图和 intervention 分析
3. 增加 `Inbox` / `Templates` 页面，补齐产品壳
4. 增加 demo seed 和更完整的端到端测试
