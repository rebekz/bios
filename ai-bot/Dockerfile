FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files first for better caching
COPY requirements.txt ./

# Install Python dependencies using pip
RUN pip install --no-cache-dir -r requirements.txt

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
CMD ["python", "simple_bot.py"]