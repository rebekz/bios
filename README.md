# Matrix Messaging Platform with AI Bot

A comprehensive web-based messaging platform built on Matrix.org protocol with Synapse homeserver and an integrated AI bot powered by LLM.

## Features

- **Matrix Homeserver**: Synapse-based Matrix server for secure, decentralized messaging
- **Web Client**: Modern React-based web interface for messaging
- **AI Bot**: Intelligent bot powered by LLM with fast uv package management
- **Real-time Communication**: WebSocket-based real-time messaging
- **End-to-End Encryption**: Secure messaging with Matrix's E2EE capabilities
- **Room Management**: Create and manage chat rooms
- **User Authentication**: Secure user registration and login

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │◄──►│  Synapse Server │◄──►│    AI Bot       │
│   (React)       │    │   (Python)      │    │   (Python)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Quick Start

1. **Setup Environment**:
   ```bash
   docker-compose up -d
   ```

2. **Access Web Client**:
   Open http://localhost:3000

3. **Register User**:
   Create your first user account through the web interface

4. **Start Messaging**:
   Create rooms and start chatting with the AI bot

## Components

- `synapse/` - Matrix Synapse homeserver configuration
- `web-client/` - React-based web messaging interface
- `ai-bot/` - LLM-powered AI bot
- `docker-compose.yml` - Complete deployment setup

## Development

See individual component READMEs for development instructions:
- [Synapse Setup](./synapse/README.md)
- [Web Client](./web-client/README.md)
- [AI Bot](./ai-bot/README.md)