# Base Image: Lightweight Python 3.11
FROM python:3.11-slim

# Environment Variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_HOME=/app

# Work Directory
WORKDIR $APP_HOME

# System Dependencies (minimal for ezdxf/pandas)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python Dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Application Code
COPY . .

# Create unprivileged user for security
RUN useradd -m appuser && chown -R appuser:appuser $APP_HOME
USER appuser

# Expose Port
EXPOSE 8000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start Command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
