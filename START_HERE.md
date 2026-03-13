# 开始阅读

English version: `START_HERE_EN.md`

## 当前状态

`companyagents/` 这条独立重写线现在已经有一套可运行的端到端脚手架：

- 后端 API 可本地启动
- 已有初始 migration
- 已有 smoke tests
- 前端可成功构建
- 前后端已能本地联调
- 实时任务事件可通过 WebSocket 流转
- runtime worker 可自动派发已批准任务并推进已完成任务
- 基于 actor 的权限与 runtime 控制面已经端到端打通

## 已经能做什么

后端链路：

1. 创建任务
2. Qualify 任务
3. 创建计划
4. 提交审核
5. 批准 / 请求修改 / 拒绝
6. 创建 work item
7. 更新 work item 进度
8. 创建 artifact
9. 查询 task bundle 和 dashboard bundle
10. 让 runtime worker 自动生成执行 work item
11. 让 runtime worker 将已完成任务推进到 reporting-ready 和 done
12. 全局或按任务控制 runtime
13. 在 Board 和 Task Detail 中查看 runtime audit

前端链路：

1. 从 UI 创建任务
2. 从 UI 创建计划
3. 从 UI 提交审核
4. 从 UI 批准 / 请求修改 / 拒绝
5. 从 UI 创建 work item
6. 从 UI 更新 work item 进度
7. 从 UI 创建 artifact
8. 查看 Board / Attention / Teams / Task Detail
9. 在 UI 中切换 actor 身份
10. 从 Board / Settings / Task Detail 控制 runtime

Demo 支持：

- `python -m companyagents.backend.scripts.seed_demo`
- 可生成审核中、执行中、阻塞中、被退回修改计划等样例

## 建议入口

如果你是第一次进入这个子仓库，建议按这个顺序看：

1. `README.md`（中文默认说明）
2. `README_EN.md`（English version）
3. `docs/final-plan.md`
4. `backend/START.md`
5. `backend/app/main.py`
6. `backend/app/api/router.py`
7. `backend/app/services/dashboard_service.py`
8. `backend/app/services/task_bundle_service.py`
9. `frontend/src/hooks/useControlPlane.ts`
10. `frontend/src/App.tsx`

## 下一步工程建议

如果你准备继续实现，当前比较高价值的下一步是：

1. 增强 supervisor 策略和 intervention history UX
2. 把 worker 策略继续做深，不只停留在当前 orchestrator
3. 增加更可复用的 seed/demo 脚本
4. 增加 `Inbox` / `Templates` 页面和更完整的设置能力
5. 增加更深入的 integration 和 e2e 测试

## 当前切片的完成标准

如果满足下面这些条件，可以认为当前切片是健康的：

- API 可以本地启动
- 前端可以本地构建
- 一个任务能从 `New` 走到 `Approved`
- work item 和 artifact 可以创建
- dashboard bundle 能返回 summary、attention、teams、recent activity
- task bundle 能返回控制面需要的任务详情数据
- WebSocket 能发出实时任务事件
- runtime 可以全局和按任务控制
