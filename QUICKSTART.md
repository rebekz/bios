# Quick Start Guide

Get your Matrix messaging platform with AI bot up and running in minutes!

## 🚀 One-Command Setup

```bash
./scripts/setup.sh
```

This script will:
- ✅ Check Docker requirements
- ✅ Create configuration files
- ✅ Generate security tokens
- ✅ Build and start all services
- ✅ Set up the complete platform

## 📋 Prerequisites

- **Docker** and **Docker Compose** installed
- **OpenAI API Key** or **Anthropic API Key** (for AI bot)
- **8GB RAM** recommended for smooth operation

## ⚡ Manual Setup (Alternative)

### 1. Clone and Configure

```bash
# Copy environment template
cp .env.example .env

# Edit configuration (add your API key!)
nano .env  # or use your preferred editor
```

### 2. Add Your API Key

Edit `.env` file and add at least one API key:

```env
# Add your OpenAI key
OPENAI_API_KEY=sk-your-openai-api-key-here

# OR add your Anthropic key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
```

### 3. Start Services

```bash
# Build and start all services
docker-compose up -d --build

# Check status
docker-compose ps
```

## 🌐 Access Your Platform

Once services are running:

- **Web Client**: http://localhost:3000
- **Matrix Server**: http://localhost:8008
- **Health Checks**: 
  - Synapse: http://localhost:8008/health
  - AI Bot: http://localhost:8080/health

## 👤 Create Your First Account

1. **Open Web Client**: Navigate to http://localhost:3000
2. **Click "Create Account"**: Switch to registration mode
3. **Enter Username**: Choose any username (e.g., `alice`)
4. **Set Password**: Choose a secure password
5. **Click "Create Account"**: Account will be created automatically

## 💬 Start Chatting

1. **Create a Room**: Click "Create Room" in the sidebar
2. **Name Your Room**: Enter a room name (e.g., "General Chat")
3. **AI Bot Joins**: The AI bot will automatically be invited
4. **Start Messaging**: Type your first message!

## 🤖 Interact with AI Bot

The AI bot responds when:
- **Mentioned**: `@aibot hello there!`
- **Direct Message**: Send a private message to the bot
- **New Rooms**: Bot joins automatically when invited

Example interactions:
```
You: @aibot can you help me with Python?
Bot: Absolutely! I'd be happy to help you with Python. What do you need assistance with? 🐍

You: Tell me a joke
Bot: Why do programmers prefer dark mode? Because light attracts bugs! 😄
```

## 📊 Monitor Your Platform

### Check Service Status
```bash
# View all services
docker-compose ps

# Check logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f synapse
docker-compose logs -f ai-bot
docker-compose logs -f web-client
```

### Common Management Commands
```bash
# Restart a service
docker-compose restart ai-bot

# Stop all services
docker-compose down

# Restart everything
docker-compose down && docker-compose up -d
```

## 🔧 Troubleshooting

### Services Won't Start
```bash
# Check Docker is running
docker --version
docker-compose --version

# Check port availability
netstat -tulpn | grep :3000
netstat -tulpn | grep :8008
```

### AI Bot Not Responding
1. **Check API Key**: Ensure valid API key in `.env`
2. **Restart Bot**: `docker-compose restart ai-bot`  
3. **Check Logs**: `docker-compose logs ai-bot`

### Web Client Issues
1. **Clear Browser Cache**: Hard refresh (Ctrl+F5)
2. **Check Matrix Server**: Ensure http://localhost:8008 is accessible
3. **Review Logs**: `docker-compose logs web-client`

### Database Issues
```bash
# Reset database (WARNING: loses all data)
docker-compose down
docker volume rm $(docker volume ls -q | grep postgres)
docker-compose up -d
```

## 🎯 Next Steps

### Customize Your Bot
Edit `.env` to customize bot behavior:
```env
BOT_NAME=My Custom Assistant
BOT_PERSONALITY=You are a helpful coding assistant...
PREFERRED_LLM=anthropic  # or 'openai'
```

### Production Deployment
For production use:
1. **Enable HTTPS**: Configure SSL certificates
2. **Use External Database**: Replace with managed PostgreSQL
3. **Secure Secrets**: Use proper secret management
4. **Monitor Resources**: Set up monitoring and alerts
5. **Backup Data**: Regular database backups

### Add More Features
- **File Sharing**: Enable file uploads in rooms
- **Custom Commands**: Extend bot with slash commands  
- **Integrations**: Connect external APIs and services
- **Mobile App**: Use Element or other Matrix clients

## 🆘 Getting Help

### Check Documentation
- **Main README**: [README.md](README.md)
- **Synapse Setup**: [synapse/README.md](synapse/README.md)
- **Web Client**: [web-client/README.md](web-client/README.md)
- **AI Bot**: [ai-bot/README.md](ai-bot/README.md)

### Community Resources
- **Matrix.org**: https://matrix.org/docs/
- **Synapse Admin**: https://github.com/matrix-org/synapse/
- **Element Web**: https://github.com/vector-im/element-web

### Common Issues
- **Port Conflicts**: Change ports in `docker-compose.yml`
- **Memory Issues**: Reduce services or add more RAM
- **API Limits**: Monitor API usage and upgrade plans

## 🎉 Success!

You now have a fully functional Matrix messaging platform with:
- ✅ Secure messaging server
- ✅ Beautiful web interface  
- ✅ Intelligent AI bot
- ✅ Real-time communication
- ✅ Room management
- ✅ User authentication

Happy chatting! 🚀