# Frontend

`modern_delivery_os` 的 React 控制台前端。

English version: `README_EN.md`

## 当前切片

当前前端已经接好后端 control-plane API，包含：

- dashboard summary
- dashboard attention
- dashboard bundle
- task list
- task detail
- plan panel
- review panel
- work item panel
- artifact panel
- supervisor panel
- task action buttons
- teams overview
- settings page
- runtime status 与 audit 面板
- 全局与任务级 runtime 控制
- WebSocket 实时刷新

## 运行方式

1. 把 `.env.example` 复制为 `.env`
2. 执行 `npm install` 安装依赖
3. 执行 `npm run dev` 启动开发服务器

前端默认通过 `VITE_API_BASE` 连接后端 API。

## 已实现页面

- Task Board
- Attention
- Task Detail
- Teams
- Settings

## 实现说明

当前实现主要倾向于：

- 简单直接的路由结构
- 用 bundle API 拉取 task detail 和 dashboard overview
- 首次 HTTP 加载后通过 WebSocket 做增量刷新
- 在 Board、Attention、Sidebar 之间共享 control-plane panels
- 通过 actor-context 切换支持权限感知写操作
- 在 UI 中直接暴露 runtime 控制和 audit 可见性
