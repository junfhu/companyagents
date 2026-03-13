# 安装部署指南

English version: `install-guide_EN.md`

## 适用场景

这份文档适合想把 `modern_delivery_os` 在本地跑起来、做演示、或作为开发环境使用的人。

当前最推荐的方式是：

- 后端使用 SQLite
- 前端使用 Vite dev server
- 可选导入 demo 数据

## 环境要求

建议准备：

- Python `3.11+`
- Node.js `18+`
- npm `9+`

可选基础设施：

- PostgreSQL
- Redis

如果只是本地开发和产品演示，不需要 PostgreSQL 和 Redis。

## 1. 获取代码

进入子仓库目录：

```bash
cd modern_delivery_os
```

## 2. 安装后端依赖

在 `modern_delivery_os/` 目录执行：

```bash
python -m pip install -e .
```

## 3. 安装前端依赖

```bash
cd frontend
npm install
cd ..
```

## 4. 配置后端环境变量

最简单的本地配置示例：

```bash
export DATABASE_URL_OVERRIDE="sqlite+aiosqlite:///./delivery_os.db"
export APP_AUTO_CREATE_TABLES=true
export APP_DEBUG=true
export APP_RUNTIME_WORKERS_ENABLED=true
```

说明：

- `DATABASE_URL_OVERRIDE` 使用本地 SQLite 数据库
- `APP_AUTO_CREATE_TABLES=true` 允许启动时自动建表
- `APP_RUNTIME_WORKERS_ENABLED=true` 会启用后台 runtime worker

如果你需要更多配置项，可以参考根目录的 [.env.example](/root/edict/modern_delivery_os/.env.example)。

## 5. 配置前端环境变量

```bash
cd frontend
cp .env.example .env
```

然后确认 `.env` 中包含：

```text
VITE_API_BASE=http://127.0.0.1:8100/api
```

默认的 `frontend/.env.example` 是 `8000` 端口，如果你按项目默认的 `make` 命令启动后端，需要改成 `8100`。

## 6. 启动后端

在仓库上级目录执行：

```bash
make -C modern_delivery_os backend-dev
```

默认访问地址：

```text
http://127.0.0.1:8100
```

可用于检查是否启动成功：

```text
http://127.0.0.1:8100/health
http://127.0.0.1:8100/api
```

## 7. 启动前端

```bash
make -C modern_delivery_os frontend-dev
```

默认前端地址：

```text
http://127.0.0.1:4173
```

## 8. 导入演示数据

如果你想快速看到更完整的页面效果，可以导入 demo 数据：

```bash
make -C modern_delivery_os seed-demo
```

它会生成几类任务：

- 等待审核
- 执行中
- 长时间阻塞
- 被退回修改计划

## 9. 生产构建与测试

前端生产构建：

```bash
make -C modern_delivery_os frontend-build
```

后端测试：

```bash
make -C modern_delivery_os backend-test
```

## 常见问题

### 前端打开后没有数据

优先检查：

- 后端是否已经启动
- `VITE_API_BASE` 是否指向 `http://127.0.0.1:8100/api`

### 后端启动了但页面报错

优先检查：

- 是否执行过 `python -m pip install -e .`
- 是否启用了 `APP_AUTO_CREATE_TABLES=true`

### 想快速体验完整流程

最省事的方式是：

1. 启动后端
2. 启动前端
3. 执行 `make -C modern_delivery_os seed-demo`
4. 打开 `Board`、`Attention`、`Teams`、`Task Detail`
