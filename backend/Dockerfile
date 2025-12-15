# syntax=docker/dockerfile:1.7-labs
FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN useradd -m -u 10001 appuser
WORKDIR /app
FROM base AS builder
COPY backend/requirements.txt /tmp/requirements.txt
RUN --mount=type=cache,target=/root/.cache/pip pip install --prefix=/install -r /tmp/requirements.txt
FROM base AS dev
COPY --from=builder /install /usr/local
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
USER appuser
WORKDIR /app
ENV APP_ENV=dev
COPY backend/src/ /app/
EXPOSE 8000
HEALTHCHECK --interval=10s --timeout=2s --start-period=15s --retries=5 CMD curl -fsS http://127.0.0.1:8000/health || exit 1
CMD ["python","-m","uvicorn","main:app","--host","0.0.0.0","--port","8000","--reload"]
FROM base AS prod
COPY --from=builder /install /usr/local
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
USER appuser
WORKDIR /app
ENV APP_ENV=prod
COPY backend/src/ /app/
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 CMD curl -fsS http://127.0.0.1:8000/health || exit 1
CMD ["python","-m","uvicorn","main:app","--host","0.0.0.0","--port","8000"]
