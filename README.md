# BIOS - Build Intelligence Operations System

A comprehensive Matrix-based communication platform with AI capabilities, document processing, and WhatsApp integration.

## 🚀 Features

### Core Platform
- **Matrix Homeserver**: Self-hosted Synapse server with PostgreSQL backend
- **Web Client**: Modern React-based Matrix client for web browsers
- **AI Bot**: Intelligent chatbot powered by OpenAI/Anthropic LLMs
- **Document Uploader**: Upload and process documents with AI analysis
- **WhatsApp Bridge**: Seamless integration with WhatsApp messaging

### AI Capabilities
- **Multi-provider support**: OpenAI GPT and Anthropic Claude
- **Conversation memory**: Context-aware responses across conversations
- **Room integration**: AI bot automatically joins public rooms
- **Intelligent responses**: Natural language processing and generation

### Communication Features
- **End-to-end encryption**: Secure messaging with Matrix E2EE
- **Media sharing**: Full support for images, videos, documents
- **Group management**: Create and manage rooms and spaces
- **Federation support**: Connect with other Matrix servers
- **Bridge integrations**: Connect to external platforms like WhatsApp

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │   AI Bot        │    │ WhatsApp Bridge │
│   (React)       │    │   (Python)      │    │ (mautrix-whatsapp)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                ┌─────────────────┴─────────────────┐
                │         Matrix Synapse            │
                │        (Homeserver)               │
                └─────────────────┬─────────────────┘
                                 │
                ┌─────────────────┴─────────────────┐
                │         PostgreSQL                │
                │        (Database)                 │
                └───────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- At least 4GB RAM
- 10GB available disk space

### 1. Clone the Repository
```bash
git clone <repository-url>
cd bios
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

### 3. Start the Platform
```bash
docker-compose up -d
```

### 4. Setup WhatsApp Bridge (Optional)
```bash
./scripts/setup-whatsapp-bridge.sh
```

### 5. Access the Platform
- **Web Client**: http://localhost:3000
- **Matrix Server**: http://localhost:8008
- **Document Uploader**: http://localhost:8080
- **WhatsApp Bridge**: http://localhost:29318

## 📱 WhatsApp Integration

The platform includes a WhatsApp bridge that enables:

### Features
- **Bidirectional messaging** between WhatsApp and Matrix
- **Group chat bridging** with full participant support
- **Media sharing** (images, videos, documents, audio)
- **Message reactions and replies**
- **Status updates** and typing indicators
- **Multi-device support** for WhatsApp Business

### Setup Process
1. Ensure the platform is running with `docker-compose up -d`
2. Run the WhatsApp bridge setup: `./scripts/setup-whatsapp-bridge.sh`
3. Start a chat with `@whatsappbot:localhost` (replace with your domain)
4. Send `!wa login` to get a QR code
5. Scan the QR code with your WhatsApp mobile app
6. Your WhatsApp chats will automatically appear as Matrix rooms

### Bridge Commands
- `!wa help` - Show available commands
- `!wa login` - Get QR code for authentication
- `!wa sync` - Synchronize chats
- `!wa list` - List bridged chats
- `!wa logout` - Disconnect from WhatsApp

For detailed setup instructions, see [WHATSAPP_BRIDGE_SETUP.md](WHATSAPP_BRIDGE_SETUP.md).

## 🤖 AI Bot Usage

The AI bot automatically joins public rooms and responds when mentioned:

### Features
- **Context awareness**: Remembers conversation history
- **Multi-provider support**: Configurable LLM backends
- **Automatic room joining**: Discovers and joins public rooms
- **Direct messaging**: Supports 1-on-1 conversations

### Interaction
- **Mention the bot**: Include the bot's username in your message
- **Direct message**: Send a private message to the bot
- **Commands**: Use natural language - no special commands needed

## 📄 Document Processing

Upload and analyze documents with AI:

### Supported Formats
- PDF documents
- Microsoft Office files (Word, Excel, PowerPoint)
- Text files and markdown
- Images with text (OCR)

### Features
- **Content extraction**: Parse document text and structure
- **AI analysis**: Summarization and question answering
- **Room integration**: Share processed documents in Matrix rooms
- **Batch processing**: Handle multiple documents

## 🔧 Configuration

### Environment Variables
- `OPENAI_API_KEY`: OpenAI API key for GPT models
- `ANTHROPIC_API_KEY`: Anthropic API key for Claude models
- `MATRIX_SERVER_URL`: Matrix homeserver URL
- `DATABASE_URL`: PostgreSQL connection string

### Service Configuration
Each service has its own configuration files:
- `synapse/homeserver.yaml`: Matrix server configuration
- `ai-bot/config.py`: AI bot settings
- `whatsapp-bridge/config.yaml`: WhatsApp bridge configuration

## 🛠️ Development

### Local Development
```bash
# Start services
docker-compose up -d postgres redis synapse

# Run AI bot locally
cd ai-bot
pip install -r requirements.txt
python bot.py

# Run web client locally
cd web-client
npm install
npm start
```

### Adding Features
- **AI Bot**: Modify `ai-bot/bot.py` and `ai-bot/llm_providers.py`
- **Web Client**: Edit React components in `web-client/src/`
- **Bridge Extensions**: Customize `whatsapp-bridge/config.yaml`

## 🔒 Security

### Authentication
- **Matrix accounts**: Standard Matrix authentication
- **Application services**: Secure token-based authentication
- **Bridge authentication**: WhatsApp QR code authentication

### Encryption
- **Matrix E2EE**: End-to-end encryption for Matrix conversations
- **TLS/HTTPS**: Encrypted transport for all connections
- **Database encryption**: PostgreSQL with encrypted storage options

### Privacy
- **Local processing**: All AI processing happens locally
- **No data sharing**: No user data sent to third parties
- **Bridge privacy**: WhatsApp messages processed locally only

## 📊 Monitoring

### Health Checks
```bash
# Check all services
docker-compose ps

# View logs
docker-compose logs -f

# Bridge status
curl http://localhost:29318/health
```

### Performance Monitoring
- PostgreSQL metrics
- Matrix server statistics
- Bridge connection status
- AI response times

## 🆘 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
docker-compose down
docker-compose pull
docker-compose up -d
```

#### WhatsApp Bridge Issues
```bash
# Check bridge logs
docker-compose logs whatsapp-bridge

# Restart bridge
docker-compose restart whatsapp-bridge

# Recreate bridge database
./scripts/setup-whatsapp-bridge.sh
```

#### AI Bot Not Responding
```bash
# Check bot logs
docker-compose logs ai-bot

# Verify API keys
grep API_KEY .env
```

### Database Issues
```bash
# Backup database
docker-compose exec postgres pg_dumpall -U synapse > backup.sql

# Restore database
docker-compose exec postgres psql -U synapse < backup.sql
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow existing code style
- Add documentation for new features
- Test changes thoroughly
- Update configuration examples

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Matrix.org**: For the excellent Matrix protocol and Synapse server
- **mautrix**: For the high-quality WhatsApp bridge
- **OpenAI/Anthropic**: For powerful AI capabilities
- **React/Node.js communities**: For modern web development tools

## 📞 Support

- **Documentation**: Check service-specific README files
- **Issues**: Report bugs in the GitHub issue tracker
- **Community**: Join our Matrix room for support
- **Commercial support**: Contact us for enterprise deployments

---

**BIOS** - Bringing intelligence to your communications infrastructure. 🚀