FROM matrixdotorg/synapse:latest

# Install additional dependencies
USER root
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Switch back to synapse user
USER 991

# Copy configuration files
COPY homeserver.yaml /data/homeserver.yaml
COPY log.config /data/log.config

# Create necessary directories
RUN mkdir -p /data/media_store /data/uploads

EXPOSE 8008 8448

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8008/health || exit 1