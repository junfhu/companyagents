# 构建清单

English version: `CHECKLIST_EN.md`

## Phase 0 基础冻结

- [x] 冻结现代化角色模型
- [x] 冻结工作流状态
- [x] 冻结领域对象
- [x] 冻结 MVP 范围
- [x] 创建独立项目骨架

## Phase 1 后端

- [x] 增加 `pyproject.toml`
- [x] 增加 SQLAlchemy 模型
- [x] 增加 Alembic migration 初始化
- [x] 增加 task API
- [x] 增加 plan API
- [x] 增加 review API
- [x] 增加 work item API
- [x] 增加 artifact API
- [x] 增加 activity API
- [x] 增加 supervisor API
- [x] 增加事件发布接口
- [x] 增加 runtime 状态与控制 API
- [x] 增加基于 actor 的权限校验

## Phase 2 Worker

- [ ] Intake worker
- [ ] Planning worker
- [ ] Review worker
- [x] Delivery worker
- [x] Execution worker
- [x] Reporting worker
- [x] Supervisor worker
- [x] 全局 runtime loop
- [x] 任务级 runtime run/sweep 控制

## Phase 3 前端

- [x] App shell
- [ ] Inbox 页面
- [x] Task board
- [x] Task detail
- [x] Teams 页面
- [ ] Templates 页面
- [x] Settings 页面
- [x] Attention 页面
- [x] Runtime 状态面板
- [x] Runtime audit 面板
- [x] 任务级 runtime 控制

## Phase 4 实时能力

- [x] WebSocket 服务
- [x] 实时任务时间线
- [x] Supervisor 面板
- [x] Intervention 流
- [x] UI 中的 runtime 事件标记

## Phase 5 质量

- [x] 后端 smoke tests
- [x] 端到端 API 流程测试
- [x] Runtime orchestration 测试
- [x] Runtime control endpoint 测试
- [x] 前端生产构建验证
