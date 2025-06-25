FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies and uv
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl -LsSf https://astral.sh/uv/install.sh | sh \
    && . $HOME/.cargo/env

# Add uv to PATH
ENV PATH="/root/.cargo/bin:$PATH"

# Copy dependency files first for better caching
COPY pyproject.toml uv.lock* requirements.txt ./

# Install Python dependencies using uv (prefer pyproject.toml)
RUN if [ -f pyproject.toml ]; then \
        uv pip install --system --no-cache .; \
    else \
        uv pip install --system --no-cache -r requirements.txt; \
    fi

# Copy application code
COPY . .

# Create config directory
RUN mkdir -p /app/config

# Expose port for application service
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:8080/health')" || exit 1

# Run the bot
CMD ["python", "bot.py"]