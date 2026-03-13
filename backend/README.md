# Backend

`companyagents` 后端控制面，基于 FastAPI 实现。

English version: `README_EN.md`

## 当前能力

后端目前已经提供：

- 任务生命周期 API
- 计划与审核 API
- work item 与 artifact API
- activity timeline API
- supervisor intervention API
- 基于 actor 的权限校验
- dashboard summary、attention、teams、bundle API
- runtime 状态与控制 API
- task detail bundle 聚合
- WebSocket 实时事件广播
- 面向 approved / blocked / completed 任务的后台 orchestration loop

## 关键模块

- `app/main.py`：FastAPI 入口与 lifespan 初始化
- `app/api/`：路由层
- `app/services/dashboard_service.py`：全局控制面聚合
- `app/services/task_bundle_service.py`：单任务详情聚合
- `app/services/runtime_service.py`：runtime orchestration 逻辑
- `app/runtime.py`：runtime worker 循环与任务级执行辅助
- `app/services/workflow.py`：状态流转规则
- `scripts/seed_demo.py`：本地演示数据种子脚本

## 本地运行

详细启动说明见 [START.md](/root/edict/companyagents/backend/START.md)。
