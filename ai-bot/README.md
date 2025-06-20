# Matrix AI Bot

An intelligent AI bot powered by Large Language Models (LLM) that integrates seamlessly with the Matrix messaging platform. The bot can engage in natural conversations, answer questions, and provide assistance to users in Matrix rooms.

## Features

- **Multi-LLM Support**: Compatible with OpenAI GPT and Anthropic Claude
- **Matrix Integration**: Full Matrix protocol support via matrix-nio
- **Application Service**: Runs as a Matrix application service for reliable operation
- **Conversation History**: Maintains context across conversations
- **Smart Triggering**: Responds when mentioned or in direct messages
- **Configurable Personality**: Customizable bot personality and behavior
- **Rate Limiting**: Built-in rate limiting and error handling
- **Health Monitoring**: Health check endpoints for monitoring

## Technology Stack

- **Python 3.11**: Modern Python with async/await support
- **matrix-nio**: Async Matrix client library
- **OpenAI API**: GPT-3.5-turbo integration
- **Anthropic API**: Claude integration
- **Flask**: Web framework for application service endpoints
- **Docker**: Containerized deployment

## Project Structure

```
ai-bot/
├── bot.py                 # Main bot application
├── config.py             # Configuration management
├── llm_providers.py      # LLM provider implementations
├── requirements.txt      # Python dependencies
├── Dockerfile           # Container configuration
├── config/              # Configuration files
└── README.md           # This file
```

## Configuration

### Environment Variables

The bot is configured through environment variables:

```env
# Matrix Configuration
MATRIX_SERVER_URL=http://localhost:8008
MATRIX_USERNAME=@aibot:localhost
MATRIX_PASSWORD=aibot_password

# Application Service
AS_TOKEN=your_application_service_token
HS_TOKEN=your_homeserver_token

# LLM Provider APIs (provide at least one)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Bot Configuration
PREFERRED_LLM=openai
MAX_CONVERSATION_HISTORY=20
RESPONSE_TIMEOUT=30
MAX_RESPONSE_LENGTH=2000

# Bot Personality
BOT_NAME=Matrix AI Assistant
BOT_PERSONALITY=You are a helpful AI assistant...
```

### Bot Personality

The bot's personality can be customized through the `BOT_PERSONALITY` environment variable:

```python
BOT_PERSONALITY="""
You are a helpful AI assistant in a Matrix chat room.
You are friendly, knowledgeable, and concise in your responses.
You can help with various tasks, answer questions, and engage in conversation.
"""
```

## Architecture

### Core Components

#### MatrixAIBot Class
- **Matrix Client**: Handles Matrix protocol communication
- **LLM Provider**: Manages AI model interactions
- **Flask App**: Provides application service endpoints
- **Conversation History**: Maintains context per room

#### LLMProvider Class
- **Multi-Provider**: Supports OpenAI and Anthropic
- **Async Processing**: Non-blocking API calls
- **Error Handling**: Graceful fallbacks and error recovery
- **Response Filtering**: Content moderation and length limiting

#### Configuration System
- **Environment-based**: Easy deployment configuration
- **Validation**: Ensures required settings are present
- **Defaults**: Sensible defaults for most settings

### Message Flow

1. **Receive**: Bot receives message through Matrix sync or app service
2. **Filter**: Check if bot should respond (mentions, DMs)
3. **Process**: Extract message content and conversation history
4. **Generate**: Send to LLM provider for response generation
5. **Send**: Send AI response back to Matrix room
6. **Store**: Update conversation history

## LLM Integration

### OpenAI Integration

```python
response = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message}
    ],
    max_tokens=500,
    temperature=0.7
)
```

### Anthropic Integration

```python
response = anthropic_client.messages.create(
    model="claude-3-haiku-20240307",
    max_tokens=500,
    messages=[
        {"role": "user", "content": conversation_text}
    ]
)
```

## Deployment

### Docker Deployment

The bot runs in a Docker container with health checks:

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8080
CMD ["python", "bot.py"]
```

### Application Service Registration

The bot registers as a Matrix application service:

```yaml
id: ai-bot
url: http://ai-bot:8080
as_token: "your_as_token"
hs_token: "your_hs_token"
sender_localpart: aibot
namespaces:
  users:
    - exclusive: true
      regex: "@aibot:localhost"
```

## Usage

### Triggering the Bot

The bot responds in the following scenarios:

1. **Direct Mention**: `@aibot hello there!`
2. **Direct Message**: Any message in a 1-1 room with the bot
3. **Room Invitation**: Bot automatically joins when invited

### Example Interactions

```
User: @aibot what's the weather like?
Bot: I don't have access to real-time weather data, but I can help you with other questions! 🌤️

User: Can you help me write a Python function?
Bot: Absolutely! I'd be happy to help you write a Python function. What should the function do? 🐍

User: Tell me a joke
Bot: Why don't scientists trust atoms? Because they make up everything! 😄
```

## Development

### Local Development

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set Environment Variables**:
   ```bash
   export MATRIX_SERVER_URL=http://localhost:8008
   export MATRIX_USERNAME=@aibot:localhost
   export OPENAI_API_KEY=your_key_here
   ```

3. **Run Bot**:
   ```bash
   python bot.py
   ```

### Testing

```bash
# Test configuration
python -c "from config import BotConfig; print(BotConfig())"

# Test LLM providers
python -c "from llm_providers import LLMProvider; from config import BotConfig; print(LLMProvider(BotConfig()).get_available_providers())"

# Health check
curl http://localhost:8080/health
```

### Debugging

Enable debug logging by setting the log level:

```python
logging.basicConfig(level=logging.DEBUG)
```

Common debug commands:
```bash
# Check bot logs
docker-compose logs -f ai-bot

# Restart bot
docker-compose restart ai-bot

# Access bot container
docker-compose exec ai-bot bash
```

## Conversation Management

### History Storage

The bot maintains conversation history per room:

```python
conversation_history = {
    "room_id": [
        {
            "role": "user",
            "content": "Hello!",
            "sender": "@user:localhost",
            "timestamp": "2024-01-01T00:00:00Z"
        },
        {
            "role": "assistant", 
            "content": "Hi there! How can I help?",
            "sender": "@aibot:localhost",
            "timestamp": "2024-01-01T00:00:01Z"
        }
    ]
}
```

### Context Limits

- **History Limit**: Last 20 messages per room
- **Token Management**: Automatic truncation for API limits
- **Memory Cleanup**: Periodic cleanup of old conversations

## Error Handling

### Common Scenarios

1. **API Failures**: Graceful fallback messages
2. **Network Issues**: Retry logic with exponential backoff
3. **Rate Limits**: Built-in rate limiting and queuing
4. **Invalid Messages**: Input sanitization and validation

### Error Messages

The bot provides helpful error messages:

```python
"I'm sorry, I encountered an error processing your message. 🤖"
"I'm having trouble connecting to my AI service. Please try again later. 🤖"
"I'm currently unable to process your request. Please try again later. 🤖"
```

## Security

### Best Practices

- **API Keys**: Stored as environment variables
- **Input Sanitization**: All user inputs are sanitized
- **Rate Limiting**: Prevents abuse and spam
- **Access Control**: Bot only responds to appropriate triggers

### Application Service Security

- **Token Validation**: AS and HS tokens for authentication
- **Exclusive User**: Bot has exclusive access to its user ID
- **Namespace Control**: Limited to specific user namespaces

## Monitoring

### Health Checks

```python
@app.route('/health')
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "providers": llm_provider.get_available_providers()
    }
```

### Metrics

Key metrics to monitor:

- **Response Time**: Average LLM response time
- **Error Rate**: Percentage of failed requests
- **Active Rooms**: Number of rooms with bot
- **Message Volume**: Messages processed per hour

## Troubleshooting

### Common Issues

1. **Bot Not Responding**:
   - Check Matrix server connectivity
   - Verify application service registration
   - Check API keys are valid

2. **Slow Responses**:
   - Monitor LLM provider API status
   - Check network connectivity
   - Review conversation history size

3. **Memory Issues**:
   - Monitor conversation history storage
   - Check for memory leaks
   - Review cleanup processes

### Debug Commands

```bash
# Check bot status
docker-compose ps ai-bot

# View detailed logs
docker-compose logs -f ai-bot | grep ERROR

# Test API connectivity
docker-compose exec ai-bot python -c "import openai; print('OpenAI OK')"

# Check Matrix connectivity
docker-compose exec ai-bot python -c "import asyncio; from config import BotConfig; print('Config OK')"
```

## Contributing

1. **Code Style**: Follow PEP 8 guidelines
2. **Error Handling**: Always include proper error handling
3. **Documentation**: Update docstrings and comments
4. **Testing**: Add tests for new features
5. **Logging**: Include appropriate logging statements

## Future Enhancements

- **Multi-language Support**: Support for multiple languages
- **Custom Commands**: Slash commands for special functions
- **File Processing**: Ability to process uploaded files
- **Voice Messages**: Text-to-speech capabilities
- **Integrations**: Connect with external APIs and services