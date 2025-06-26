#!/bin/bash
set -e

echo "Initializing Synapse homeserver..."

# Create directories if they don't exist (but don't change ownership)
mkdir -p /data/media_store /data/uploads /data/log

# Check if homeserver.yaml exists
if [ ! -f /data/homeserver.yaml ]; then
    echo "No homeserver.yaml found, this should be mounted as a volume!"
    exit 1
fi

# Generate signing key if it doesn't exist
if [ ! -f /data/localhost.signing.key ]; then
    echo "Generating signing key..."
    python -m synapse.app.homeserver --server-name=localhost --config-path=/data/homeserver.yaml --generate-keys
fi

# Start synapse
echo "Starting Synapse homeserver..."
exec python -m synapse.app.homeserver --config-path=/data/homeserver.yaml 