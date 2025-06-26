# WhatsApp Bridge for Matrix

This service provides WhatsApp bridging capability for your Matrix homeserver using the mautrix-whatsapp bridge.

## Features

- **Bidirectional messaging**: Send and receive messages between WhatsApp and Matrix
- **Media support**: Share images, videos, documents, and audio files
- **Group chats**: Bridge WhatsApp group conversations to Matrix rooms
- **End-to-end encryption**: Support for encrypted conversations (when enabled)
- **Reactions and replies**: Full support for message reactions and replies
- **Status updates**: Bridge WhatsApp status updates to Matrix
- **Multi-device**: Works with WhatsApp multi-device beta

## Setup Instructions

### 1. Prerequisites

Make sure your Matrix homeserver is running and accessible. The bridge needs to connect to your Synapse server.

### 2. Configuration

The bridge configuration is handled automatically through the `config.yaml` file. Key settings include:

- **Homeserver connection**: The bridge connects to your Synapse server at `http://synapse:8008`
- **Database**: Uses PostgreSQL for storing bridge data
- **Permissions**: Users on your domain have "user" level access, admins have "admin" access

### 3. Starting the Bridge

The bridge starts automatically with your Docker Compose setup. It will:

1. Connect to your Matrix homeserver
2. Register as an application service
3. Wait for users to authenticate with WhatsApp

### 4. User Authentication

Users need to authenticate with WhatsApp to start bridging:

1. Send a message to `@whatsappbot:localhost` (replace with your domain)
2. Use the command `!wa login` to get a QR code
3. Scan the QR code with your WhatsApp mobile app
4. The bridge will confirm successful authentication

### 5. Using the Bridge

Once authenticated, users can:

- **Automatic bridging**: WhatsApp chats automatically appear as Matrix rooms
- **Send messages**: Messages sent in Matrix rooms are forwarded to WhatsApp
- **Receive messages**: WhatsApp messages appear in the corresponding Matrix rooms
- **Group management**: Create and manage WhatsApp groups through Matrix

## Bridge Commands

Users can interact with the bridge using these commands (send to `@whatsappbot:localhost`):

- `!wa help` - Show available commands
- `!wa login` - Get QR code for WhatsApp authentication
- `!wa logout` - Disconnect from WhatsApp
- `!wa sync` - Synchronize chats with Matrix
- `!wa list` - List bridged chats
- `!wa set-relay` - Enable relay mode for a room (admin only)

## Troubleshooting

### Common Issues

1. **Connection failed**: Check that Synapse is running and accessible
2. **QR code not working**: Make sure you're using WhatsApp multi-device beta
3. **Messages not bridging**: Verify bridge registration in Synapse configuration

### Logs

Bridge logs are available in the container:
```bash
docker-compose logs whatsapp-bridge
```

### Bridge Status

Check bridge status by sending `!wa ping` to the bridge bot.

## Security Considerations

- **Authentication**: The bridge uses application service authentication with Synapse
- **Data storage**: Conversation data is stored in PostgreSQL
- **End-to-end encryption**: Supported when enabled in Matrix rooms
- **Privacy**: The bridge processes messages locally - no data is sent to third parties

## Advanced Configuration

For advanced users, you can modify the `config.yaml` file to:

- Enable/disable specific features
- Adjust message formatting
- Configure custom permissions
- Set up relay mode
- Enable disappearing messages

## Support

For issues and questions:

1. Check the logs for error messages
2. Verify your configuration
3. Ensure all services are running
4. Check the mautrix-whatsapp documentation: https://docs.mau.fi/bridges/whatsapp/

## Architecture

The bridge operates as a Matrix application service that:

1. **Connects to Matrix**: Registers with Synapse as an application service
2. **Connects to WhatsApp**: Uses the WhatsApp Web protocol via whatsmeow library
3. **Bridges messages**: Translates messages between Matrix and WhatsApp formats
4. **Manages state**: Maintains conversation state and user mappings
5. **Handles media**: Processes and forwards multimedia content

This enables seamless communication between Matrix and WhatsApp users while maintaining the security and features of both platforms.