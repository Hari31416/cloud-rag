#!/usr/bin/env bash
set -euo pipefail

if [[ ! -f .env ]]; then
  echo 'FAIL: .env is missing. Copy .env.example to .env first.'
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

required_vars=(
  REDIS_PORT
  REDIS_PASSWORD
  POSTGRES_PORT
  POSTGRES_DB
  POSTGRES_USER
  POSTGRES_PASSWORD
  MINIO_API_PORT
  MINIO_ROOT_USER
  MINIO_ROOT_PASSWORD
  QDRANT_HTTP_PORT
  QDRANT_API_KEY
)

for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "FAIL: ${var_name} is not set."
    exit 1
  fi
done

weak_values=(
  changeme
  password
  redis
  minioadmin
)

for weak in "${weak_values[@]}"; do
  if [[ "${REDIS_PASSWORD}" == "${weak}" || "${POSTGRES_PASSWORD}" == "${weak}" || "${MINIO_ROOT_PASSWORD}" == "${weak}" || "${QDRANT_API_KEY}" == "${weak}" ]]; then
    echo "FAIL: Weak credential value detected: ${weak}"
    exit 1
  fi
done

compose_cmd=(docker compose --env-file .env -f docker-compose.yml)
failures=0

running_services="$("${compose_cmd[@]}" ps --status running --services 2>/dev/null || true)"

redis_running=0
postgres_running=0
minio_running=0
qdrant_running=0

for service in redis postgres minio qdrant; do
  if grep -qx "${service}" <<<"${running_services}"; then
    echo "OK: ${service} container is running"
    case "${service}" in
      redis) redis_running=1 ;;
      postgres) postgres_running=1 ;;
      minio) minio_running=1 ;;
      qdrant) qdrant_running=1 ;;
    esac
  else
    echo "FAIL: ${service} container is not running"
    failures=$((failures + 1))
  fi
done

if [[ "${redis_running}" -eq 1 ]]; then
  if "${compose_cmd[@]}" exec -T redis redis-cli -a "${REDIS_PASSWORD}" ping 2>/dev/null | grep -q 'PONG'; then
    echo 'OK: Redis authentication and ping succeeded'
  else
    echo 'FAIL: Redis ping/auth check failed'
    failures=$((failures + 1))
  fi
else
  echo 'SKIP: Redis readiness check skipped (container not running)'
fi

if [[ "${postgres_running}" -eq 1 ]]; then
  postgres_ready=0
  for _ in {1..20}; do
    if "${compose_cmd[@]}" exec -T postgres pg_isready -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" >/dev/null 2>&1; then
      postgres_ready=1
      break
    fi
    sleep 1
  done

  if [[ "${postgres_ready}" -eq 1 ]]; then
    echo 'OK: PostgreSQL readiness check succeeded'
  else
    echo 'FAIL: PostgreSQL readiness check failed'
    failures=$((failures + 1))
  fi
else
  echo 'SKIP: PostgreSQL readiness check skipped (container not running)'
fi

if [[ "${minio_running}" -eq 1 ]]; then
  if curl -fsS "http://127.0.0.1:${MINIO_API_PORT}/minio/health/live" >/dev/null; then
    echo 'OK: MinIO live health endpoint is reachable'
  else
    echo 'FAIL: MinIO live health endpoint check failed'
    failures=$((failures + 1))
  fi
else
  echo 'SKIP: MinIO readiness check skipped (container not running)'
fi

if [[ "${qdrant_running}" -eq 1 ]]; then
  if curl -fsS -H "api-key: ${QDRANT_API_KEY}" "http://127.0.0.1:${QDRANT_HTTP_PORT}/healthz" >/dev/null; then
    echo 'OK: Qdrant health endpoint is reachable'
  else
    echo 'FAIL: Qdrant health endpoint check failed'
    failures=$((failures + 1))
  fi
else
  echo 'SKIP: Qdrant readiness check skipped (container not running)'
fi

if [[ "${failures}" -gt 0 ]]; then
  echo "FAIL: ${failures} health check(s) failed"
  exit 1
fi

echo 'OK: All infrastructure health checks passed'
