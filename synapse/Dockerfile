FROM matrixdotorg/synapse:latest

# Install additional dependencies as root
USER root
RUN apt-get update && apt-get install -y \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy entrypoint script
COPY init.sh /usr/local/bin/init.sh
RUN chmod +x /usr/local/bin/init.sh

# Switch to synapse user
USER 991

# Directories will be created at runtime by init script

EXPOSE 8008 8448

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8008/health || exit 1

# Use custom entrypoint
ENTRYPOINT ["/usr/local/bin/init.sh"]