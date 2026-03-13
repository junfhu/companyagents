#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8100}"
FRONTEND_PORT="${FRONTEND_PORT:-4173}"
HOST="${HOST:-0.0.0.0}"
RUN_DIR="${ROOT_DIR}/.run"
BACKEND_LOG="${RUN_DIR}/backend.log"
FRONTEND_LOG="${RUN_DIR}/frontend.log"

mkdir -p "${RUN_DIR}"

if [[ ! -d "${ROOT_DIR}/frontend/node_modules" ]]; then
  echo "frontend 依赖还没安装。请先执行: cd ${ROOT_DIR}/frontend && npm install" >&2
  exit 1
fi

if [[ ! -f "${ROOT_DIR}/frontend/.env" ]]; then
  echo "未检测到 frontend/.env，正在从 frontend/.env.example 复制默认配置。"
  cp "${ROOT_DIR}/frontend/.env.example" "${ROOT_DIR}/frontend/.env"
fi

cleanup() {
  local exit_code=$?
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "${BACKEND_PID}" 2>/dev/null; then
    kill "${BACKEND_PID}" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "${FRONTEND_PID}" 2>/dev/null; then
    kill "${FRONTEND_PID}" 2>/dev/null || true
  fi
  wait "${BACKEND_PID:-}" "${FRONTEND_PID:-}" 2>/dev/null || true
  exit "${exit_code}"
}

trap cleanup INT TERM EXIT

echo "启动后端..."
(
  cd "${ROOT_DIR}"
  PYTHONPATH=.. APP_AUTO_CREATE_TABLES=true python -m uvicorn companyagents.backend.app.main:app --reload --host "${HOST}" --port "${BACKEND_PORT}"
) >"${BACKEND_LOG}" 2>&1 &
BACKEND_PID=$!

echo "启动前端..."
(
  cd "${ROOT_DIR}/frontend"
  VITE_API_BASE="${VITE_API_BASE:-http://127.0.0.1:${BACKEND_PORT}/api}" npm run dev -- --host "${HOST}" --port "${FRONTEND_PORT}"
) >"${FRONTEND_LOG}" 2>&1 &
FRONTEND_PID=$!

echo "companyagents 已启动。"
echo "后端日志: ${BACKEND_LOG}"
echo "前端日志: ${FRONTEND_LOG}"
echo "监听地址: http://${HOST}:${BACKEND_PORT} (backend), http://${HOST}:${FRONTEND_PORT} (frontend)"
echo "本机访问: http://127.0.0.1:${BACKEND_PORT} (backend), http://127.0.0.1:${FRONTEND_PORT} (frontend)"
echo "远程访问: 请改用服务器实际 IP 或域名，不要使用 0.0.0.0 作为浏览器访问地址。"
echo "按 Ctrl+C 可同时停止前后端。"

wait -n "${BACKEND_PID}" "${FRONTEND_PID}"
