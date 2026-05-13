set shell := ['bash', '-cu']

compose := 'docker compose --env-file .env -f docker-compose.yml'
run_dir := '.run'
uv_cache_dir := '/private/tmp/cloudrag-uv-cache'

default:
  @just --list

ensure-env:
  @if [ ! -f .env ]; then echo 'Missing .env. Copy .env.example to .env first.'; exit 1; fi

install-pnpm:
  @if command -v pnpm >/dev/null 2>&1; then pnpm --version; else corepack enable && corepack prepare pnpm@10.33.2 --activate; fi

install-uv:
  @if command -v uv >/dev/null 2>&1; then uv --version; else echo 'Install uv from https://docs.astral.sh/uv/getting-started/installation/'; exit 1; fi

up: ensure-env
  @{{compose}} up --wait redis postgres minio qdrant

down: ensure-env
  @{{compose}} down --remove-orphans

nuke: ensure-env
  @{{compose}} down --volumes --remove-orphans

ps:
  @if [ -f docker-compose.yml ] && [ -f .env ]; then {{compose}} ps || echo 'Infrastructure status unavailable (Docker not running or access denied).'; else echo 'Infrastructure not configured yet (missing .env or docker-compose.yml).'; fi
  @for service in frontend gateway workers; do if [ -d "$service" ]; then echo "$service: scaffolded"; else echo "$service: missing"; fi; done

health: ensure-env
  @bash infra/scripts/health-check.sh

frontend-setup:
  @if [ -f frontend/package.json ]; then cd frontend && pnpm install --frozen-lockfile=false; else echo 'frontend/package.json not found; skipping'; fi

gateway-setup:
  @if [ -f gateway/package.json ]; then cd gateway && pnpm install --frozen-lockfile=false; else echo 'gateway/package.json not found; skipping'; fi

worker-setup:
  @if [ -f workers/pyproject.toml ]; then cd workers && UV_CACHE_DIR={{uv_cache_dir}} uv sync --all-groups; else echo 'workers/pyproject.toml not found; skipping'; fi

setup: worker-setup gateway-setup frontend-setup

prepare-run-dir:
  @mkdir -p {{run_dir}}

frontend-start: prepare-run-dir
  @if [ -f frontend/package.json ]; then \
    if [ -f {{run_dir}}/frontend.pid ] && kill -0 "$$(cat {{run_dir}}/frontend.pid)" 2>/dev/null; then echo 'frontend already running'; \
    else { cd frontend && mkdir -p ../{{run_dir}} && nohup pnpm run dev > ../{{run_dir}}/frontend.log 2>&1 & } && echo $$! > {{run_dir}}/frontend.pid; fi; \
  else echo 'frontend/package.json not found; skipping'; fi

gateway-start: prepare-run-dir
  @if [ -f gateway/package.json ]; then \
    if [ -f {{run_dir}}/gateway.pid ] && kill -0 "$$(cat {{run_dir}}/gateway.pid)" 2>/dev/null; then echo 'gateway already running'; \
    else { cd gateway && mkdir -p ../{{run_dir}} && nohup pnpm run dev > ../{{run_dir}}/gateway.log 2>&1 & } && echo $$! > {{run_dir}}/gateway.pid; fi; \
  else echo 'gateway/package.json not found; skipping'; fi

worker-start: prepare-run-dir
  @if [ -f workers/pyproject.toml ]; then \
    if [ -f {{run_dir}}/worker.pid ] && kill -0 "$$(cat {{run_dir}}/worker.pid)" 2>/dev/null; then echo 'worker already running'; \
    else { cd workers && mkdir -p ../{{run_dir}} && nohup .venv/bin/python -m workers > ../{{run_dir}}/worker.log 2>&1 & } && echo $$! > {{run_dir}}/worker.pid; fi; \
  else echo 'workers/pyproject.toml not found; skipping'; fi

frontend-stop:
  @echo "Stopping frontend on port ${FRONTEND_PORT:-5173}..."
  @lsof -ti :${FRONTEND_PORT:-5173} | xargs kill -9 2>/dev/null || true
  @rm -f .run/frontend.pid
  @echo "Frontend stopped."

gateway-stop:
  @echo "Stopping gateway on port ${GATEWAY_PORT:-3000}..."
  @pgrep -f 'tsx watch src/index.ts' | xargs kill -9 2>/dev/null || true
  @lsof -ti :${GATEWAY_PORT:-3000} | xargs kill -9 2>/dev/null || true
  @rm -f .run/gateway.pid
  @echo "Gateway stopped."

worker-stop:
  @pgrep -f 'python -m workers' | xargs kill -9 2>/dev/null || true
  @rm -f .run/worker.pid
  @echo "Worker stopped."

logs-frontend:
  @if [ -f {{run_dir}}/frontend.log ]; then tail -n 100 -f {{run_dir}}/frontend.log; else echo 'frontend log not found'; fi

logs-gateway:
  @if [ -f {{run_dir}}/gateway.log ]; then tail -n 100 -f {{run_dir}}/gateway.log; else echo 'gateway log not found'; fi

logs-worker:
  @if [ -f {{run_dir}}/worker.log ]; then tail -n 100 -f {{run_dir}}/worker.log; else echo 'worker log not found'; fi

logs:
  @for file in frontend gateway worker; do \
    if [ -f {{run_dir}}/"$$file".log ]; then echo "== $$file =="; tail -n 20 {{run_dir}}/"$$file".log; fi; \
  done

start: up worker-start gateway-start frontend-start

stop: frontend-stop worker-stop gateway-stop down

restart: stop start

up-all: up worker-start gateway-start frontend-start

down-all: stop

nuke-all: frontend-stop worker-stop gateway-stop nuke

frontend-test:
  @if [ -f frontend/package.json ]; then cd frontend && pnpm run test; else echo 'frontend/package.json not found; skipping'; fi

gateway-test:
  @if [ -f gateway/package.json ]; then cd gateway && pnpm run test; else echo 'gateway/package.json not found; skipping'; fi

worker-test:
  @if [ -x workers/.venv/bin/pytest ]; then cd workers && .venv/bin/pytest; elif [ -f workers/pyproject.toml ]; then cd workers && UV_CACHE_DIR={{uv_cache_dir}} uv run --group dev pytest; else echo 'workers/pyproject.toml not found; skipping'; fi

test: frontend-test gateway-test worker-test
