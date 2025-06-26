#!/bin/bash

# Setup script for WhatsApp Bridge
# This script creates the necessary database for the WhatsApp bridge

set -e

echo "Setting up WhatsApp Bridge..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
until docker-compose exec postgres pg_isready -U synapse -d synapse; do
    echo "PostgreSQL is not ready yet. Waiting..."
    sleep 2
done

echo "PostgreSQL is ready!"

# Create WhatsApp bridge database
echo "Creating WhatsApp bridge database..."
docker-compose exec postgres psql -U synapse -c "CREATE DATABASE whatsapp_bridge OWNER synapse;" || echo "Database already exists"

# Grant permissions
docker-compose exec postgres psql -U synapse -c "GRANT ALL PRIVILEGES ON DATABASE whatsapp_bridge TO synapse;"

echo "WhatsApp bridge database setup complete!"

# Restart the bridge to ensure it connects properly
echo "Restarting WhatsApp bridge..."
docker-compose restart whatsapp-bridge

echo "WhatsApp Bridge setup complete!"
echo ""
echo "To use the bridge:"
echo "1. Start a chat with @whatsappbot:localhost (replace localhost with your domain)"
echo "2. Send the command: !wa login"
echo "3. Scan the QR code with your WhatsApp mobile app"
echo "4. Your WhatsApp chats will start appearing as Matrix rooms"
echo ""
echo "For more information, see whatsapp-bridge/README.md"