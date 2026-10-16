# =============================================================================
# AEROSYNC Backend — Production Dockerfile
# Multi-stage security-hardened container for FastAPI + OR-Tools + Supabase
# =============================================================================

FROM python:3.12-slim AS builder

WORKDIR /app

# Install system build dependencies if necessary
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies into a virtual environment
COPY requirements.txt .
RUN python -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# =============================================================================
# Final Production Runtime Stage
# =============================================================================
FROM python:3.12-slim AS runner

WORKDIR /app

# Install curl for container health check probes
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    APP_ENV=production

# Security: Run as dedicated non-root user
RUN addgroup --system --gid 1001 aerosync && \
    adduser --system --uid 1001 --ingroup aerosync appuser

# Copy application source code
COPY --chown=appuser:aerosync app ./app

USER appuser

EXPOSE 8000

# Health check probe against API health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Production server start command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
