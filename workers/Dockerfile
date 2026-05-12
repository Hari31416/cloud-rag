FROM ghcr.io/astral-sh/uv:0.9.5-python3.12-bookworm-slim AS build

WORKDIR /app
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev
COPY src ./src
RUN uv sync --locked --no-dev

FROM ghcr.io/astral-sh/uv:0.9.5-python3.12-bookworm-slim AS runtime

WORKDIR /app
ENV PYTHONUNBUFFERED=1
COPY --from=build /app/.venv /app/.venv
COPY src ./src
ENV PATH="/app/.venv/bin:${PATH}"
CMD ["python", "-m", "workers"]
