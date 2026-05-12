set shell := ['bash', '-cu']

compose := 'docker compose --env-file .env -f docker-compose.yml'

default:
  @just --list

ensure-env:
  @if [ ! -f .env ]; then echo 'Missing .env. Copy .env.example to .env first.'; exit 1; fi

install-pnpm:
  @if command -v pnpm >/dev/null 2>&1; then pnpm --version; else corepack enable && corepack prepare pnpm@10.33.2 --activate; fi

install-uv:
  @if command -v uv >/dev/null 2>&1; then uv --version; else echo 'Install uv from https://docs.astral.sh/uv/getting-started/installation/'; exit 1; fi

up: ensure-env
  @{{compose}} up -d redis postgres minio qdrant

down: ensure-env
  @{{compose}} down --remove-orphans

nuke: ensure-env
  @{{compose}} down --volumes --remove-orphans

ps:
  @if [ -f docker-compose.yml ] && [ -f .env ]; then {{compose}} ps; else echo 'Infrastructure not configured yet (missing .env or docker-compose.yml).'; fi
  @for service in frontend gateway workers; do if [ -d "$service" ]; then echo "$service: scaffolded"; else echo "$service: missing"; fi; done

health: ensure-env
  @bash infra/scripts/health-check.sh

frontend-setup:
  @if [ -f frontend/package.json ]; then cd frontend && pnpm install --frozen-lockfile=false; else echo 'frontend/package.json not found; skipping'; fi

gateway-setup:
  @if [ -f gateway/package.json ]; then cd gateway && pnpm install --frozen-lockfile=false; else echo 'gateway/package.json not found; skipping'; fi

worker-setup:
  @if [ -f workers/pyproject.toml ]; then cd workers && uv sync --all-groups; else echo 'workers/pyproject.toml not found; skipping'; fi

setup: worker-setup gateway-setup frontend-setup

frontend-test:
  @if [ -f frontend/package.json ]; then cd frontend && pnpm run test; else echo 'frontend/package.json not found; skipping'; fi

gateway-test:
  @if [ -f gateway/package.json ]; then cd gateway && pnpm run test; else echo 'gateway/package.json not found; skipping'; fi

worker-test:
  @if [ -f workers/pyproject.toml ]; then cd workers && uv run --group dev pytest; else echo 'workers/pyproject.toml not found; skipping'; fi

test: frontend-test gateway-test worker-test
