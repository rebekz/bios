FROM dock.mau.dev/mautrix/whatsapp:latest

# Create data directory
RUN mkdir -p /data

# Copy configuration files
COPY config.yaml /data/config.yaml
COPY registration.yaml /data/registration.yaml

# Set working directory
WORKDIR /data

# Expose the port for the bridge
EXPOSE 29318

# Start the bridge
ENTRYPOINT ["/usr/bin/mautrix-whatsapp", "-c", "/data/config.yaml", "-r", "/data/registration.yaml"]