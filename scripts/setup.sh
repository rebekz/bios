#!/bin/bash

# Matrix Messaging Platform Setup Script

set -e

echo "🚀 Setting up Matrix Messaging Platform..."

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please edit it with your configuration."
    echo "⚠️  Important: Add your OpenAI or Anthropic API key to .env file"
else
    echo "✅ .env file already exists."
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p synapse/data
mkdir -p synapse/config
mkdir -p ai-bot/config
mkdir -p web-client/build

# Set proper permissions
echo "🔒 Setting permissions..."
chmod +x scripts/*.sh
chmod 755 synapse/data
chmod 755 ai-bot/config

# Generate secrets for Synapse if they don't exist
if [ ! -f synapse/data/homeserver.yaml.generated ]; then
    echo "🔐 Generating Synapse secrets..."
    
    # Generate macaroon secret
    MACAROON_SECRET=$(openssl rand -hex 32)
    FORM_SECRET=$(openssl rand -hex 32)
    REGISTRATION_SECRET=$(openssl rand -hex 32)
    
    # Replace secrets in homeserver.yaml
    sed -i "s/your_macaroon_secret_here/$MACAROON_SECRET/g" synapse/homeserver.yaml
    sed -i "s/your_form_secret_here/$FORM_SECRET/g" synapse/homeserver.yaml
    sed -i "s/your_registration_secret_here/$REGISTRATION_SECRET/g" synapse/homeserver.yaml
    
    touch synapse/data/homeserver.yaml.generated
    echo "✅ Synapse secrets generated."
fi

# Generate application service tokens
if [ ! -f ai-bot/config/tokens.generated ]; then
    echo "🤖 Generating AI bot tokens..."
    
    AS_TOKEN=$(openssl rand -hex 32)
    HS_TOKEN=$(openssl rand -hex 32)
    
    # Update application service registration
    sed -i "s/aibot_application_service_token_here/$AS_TOKEN/g" synapse/ai-bot-registration.yaml
    sed -i "s/homeserver_token_for_aibot_here/$HS_TOKEN/g" synapse/ai-bot-registration.yaml
    
    # Update .env file
    sed -i "s/aibot_application_service_token_here/$AS_TOKEN/g" .env
    sed -i "s/homeserver_token_for_aibot_here/$HS_TOKEN/g" .env
    
    touch ai-bot/config/tokens.generated
    echo "✅ AI bot tokens generated."
fi

echo "🏗️  Building and starting services..."

# Build and start services
docker-compose up -d --build

echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
if docker-compose ps | grep -q "Up"; then
    echo "✅ Services are starting up..."
    echo ""
    echo "🎉 Matrix Messaging Platform setup complete!"
    echo ""
    echo "📱 Access the web client at: http://localhost:3000"
    echo "🏠 Matrix server at: http://localhost:8008"
    echo ""
    echo "🔍 To check service status: docker-compose ps"
    echo "📋 To view logs: docker-compose logs -f"
    echo "🛑 To stop services: docker-compose down"
    echo ""
    echo "⚠️  Don't forget to:"
    echo "   1. Add your LLM API key to the .env file"
    echo "   2. Restart the ai-bot service: docker-compose restart ai-bot"
    echo "   3. Create your first user account through the web interface"
else
    echo "❌ Some services failed to start. Check logs with: docker-compose logs"
    exit 1
fi