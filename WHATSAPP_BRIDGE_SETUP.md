# WhatsApp Bridge Setup Guide

This guide will help you set up and use the WhatsApp bridge to connect your Matrix homeserver with WhatsApp.

## Overview

The WhatsApp bridge allows users to:
- Send and receive WhatsApp messages through Matrix
- Bridge WhatsApp group chats to Matrix rooms
- Share media files between WhatsApp and Matrix
- Use WhatsApp from any Matrix client
- Maintain end-to-end encryption (when enabled)

## Prerequisites

1. **Matrix homeserver running**: Your Synapse server should be operational
2. **WhatsApp account**: You need an active WhatsApp account with multi-device enabled
3. **Mobile device**: You'll need your phone to scan the QR code for authentication

## Installation Steps

### 1. Start the Services

First, start all services including the new WhatsApp bridge:

```bash
docker-compose up -d
```

### 2. Setup the Bridge Database

Run the setup script to create the WhatsApp bridge database:

```bash
./scripts/setup-whatsapp-bridge.sh
```

This script will:
- Wait for PostgreSQL to be ready
- Create the `whatsapp_bridge` database
- Set proper permissions
- Restart the bridge service

### 3. Verify Installation

Check that all services are running:

```bash
docker-compose ps
```

You should see the `whatsapp-bridge` service running on port 29318.

Check the bridge logs:

```bash
docker-compose logs whatsapp-bridge
```

You should see logs indicating the bridge has connected to your Matrix homeserver.

## User Setup and Authentication

### 1. Start a Chat with the Bridge Bot

Users need to start a direct message with the bridge bot:

- **Bot username**: `@whatsappbot:localhost` (replace `localhost` with your domain)
- **Method**: Create a new direct message or use the command `/invite @whatsappbot:localhost` in any room

### 2. Login to WhatsApp

Send the login command to the bridge bot:

```
!wa login
```

The bridge will respond with a QR code. You have a few minutes to scan it.

### 3. Scan the QR Code

1. Open WhatsApp on your mobile device
2. Go to **Settings** → **Linked Devices** → **Link a Device**
3. Scan the QR code displayed by the bridge bot
4. Wait for confirmation that the login was successful

### 4. Sync Your Chats

After successful authentication, your WhatsApp chats will automatically start appearing as Matrix rooms. To manually sync:

```
!wa sync
```

## Using the Bridge

### Bridge Commands

Send these commands to `@whatsappbot:localhost`:

| Command | Description |
|---------|-------------|
| `!wa help` | Show all available commands |
| `!wa login` | Get QR code for WhatsApp authentication |
| `!wa logout` | Disconnect from WhatsApp |
| `!wa reconnect` | Reconnect to WhatsApp |
| `!wa sync` | Synchronize chats with Matrix |
| `!wa list` | List all bridged chats |
| `!wa search <query>` | Search for chats |
| `!wa invite-link` | Get WhatsApp group invite link |
| `!wa set-relay` | Enable relay mode (admin only) |
| `!wa ping` | Check bridge connection status |

### Room Management

- **WhatsApp → Matrix**: WhatsApp chats automatically become Matrix rooms
- **Matrix → WhatsApp**: Messages sent in bridged rooms are forwarded to WhatsApp
- **Group chats**: WhatsApp groups appear as Matrix rooms with all participants
- **Direct messages**: WhatsApp DMs become Matrix DMs

### Media Support

The bridge supports:
- **Images**: JPEG, PNG, GIF, WebP
- **Videos**: MP4, WebM, MOV
- **Audio**: MP3, AAC, OGG, voice messages
- **Documents**: PDF, DOC, DOCX, and other file types
- **Stickers**: WhatsApp stickers are converted to images

### Features

- ✅ **Bidirectional messaging**
- ✅ **Media sharing**
- ✅ **Group chats**
- ✅ **Message reactions**
- ✅ **Reply to messages**
- ✅ **Read receipts**
- ✅ **Typing indicators**
- ✅ **Message editing** (limited)
- ✅ **Message deletion**
- ✅ **Status updates**
- ✅ **Multi-device support**

## Troubleshooting

### Common Issues

#### 1. QR Code Won't Scan
- Make sure WhatsApp multi-device is enabled
- Ensure you're using a recent version of WhatsApp
- Try refreshing the QR code with `!wa login` again
- Check that your phone has internet connectivity

#### 2. Bridge Not Responding
Check the bridge status:
```bash
docker-compose logs whatsapp-bridge
```

Common solutions:
- Restart the bridge: `docker-compose restart whatsapp-bridge`
- Check Synapse is running: `docker-compose logs synapse`
- Verify database connectivity

#### 3. Messages Not Bridging
- Send `!wa ping` to check connection status
- Try `!wa sync` to resynchronize chats
- Check bridge permissions in configuration
- Verify the bridge is registered with Synapse

#### 4. Database Connection Issues
If you see database errors:
```bash
# Recreate the database
docker-compose exec postgres psql -U synapse -c "DROP DATABASE IF EXISTS whatsapp_bridge;"
./scripts/setup-whatsapp-bridge.sh
```

### Debug Information

Get detailed bridge information:
```
!wa ping
!wa list
```

Check service status:
```bash
docker-compose ps whatsapp-bridge
docker-compose logs --tail=50 whatsapp-bridge
```

### Advanced Troubleshooting

Enable debug logging by editing `whatsapp-bridge/config.yaml`:
```yaml
logging:
    root:
        level: DEBUG
```

Then restart the bridge:
```bash
docker-compose restart whatsapp-bridge
```

## Security and Privacy

### Data Storage
- **Local storage**: All WhatsApp data is stored locally in your PostgreSQL database
- **No third-party services**: The bridge doesn't send data to external services
- **Encryption**: Messages can be encrypted in Matrix rooms

### Authentication
- **Application service**: The bridge uses Matrix application service authentication
- **WhatsApp session**: Your WhatsApp session is stored securely
- **Access control**: Configure user permissions in the bridge config

### Best Practices
1. **Regular backups**: Backup your PostgreSQL database regularly
2. **Secure access**: Use strong passwords and enable 2FA on Matrix accounts
3. **Network security**: Use HTTPS/TLS for all connections
4. **Regular updates**: Keep the bridge and Matrix server updated

## Configuration Options

### User Permissions

Edit `whatsapp-bridge/config.yaml` to configure permissions:

```yaml
bridge:
    permissions:
        "your-domain.com": "user"      # All users on your domain
        "@admin:your-domain.com": "admin"  # Specific admin user
        "@user:your-domain.com": "user"    # Specific user
```

Permission levels:
- `relay`: Can only use relay mode
- `user`: Can bridge their own WhatsApp account
- `admin`: User permissions + bridge administration

### Relay Mode

Enable relay mode for rooms where not everyone has WhatsApp:

```yaml
bridge:
    relay:
        enabled: true
        admin_only: false
```

Users can then enable relay mode:
```
!wa set-relay
```

### Message Formatting

Customize how messages appear in WhatsApp:

```yaml
bridge:
    relay:
        message_formats:
            m.text: '<b>{{ .Sender.Displayname }}</b>: {{ .Message }}'
            m.image: '<b>{{ .Sender.Displayname }}</b> sent an image'
```

## Monitoring

### Health Checks

The bridge provides a health endpoint:
```bash
curl http://localhost:29318/health
```

### Logs

Monitor bridge activity:
```bash
docker-compose logs -f whatsapp-bridge
```

### Metrics

For production deployments, consider setting up monitoring for:
- Bridge uptime
- Message throughput
- Error rates
- Database performance

## Backup and Recovery

### Database Backup

Backup the bridge database:
```bash
docker-compose exec postgres pg_dump -U synapse whatsapp_bridge > whatsapp_bridge_backup.sql
```

### Configuration Backup

Backup bridge configuration:
```bash
cp -r whatsapp-bridge/ whatsapp-bridge-backup/
```

### Recovery

To restore from backup:
```bash
# Restore database
docker-compose exec postgres psql -U synapse whatsapp_bridge < whatsapp_bridge_backup.sql

# Restore configuration
cp -r whatsapp-bridge-backup/* whatsapp-bridge/
docker-compose restart whatsapp-bridge
```

## Support and Resources

- **Documentation**: https://docs.mau.fi/bridges/whatsapp/
- **Matrix room**: #whatsapp:maunium.net
- **Issues**: Report problems in your bridge logs first
- **Community**: Join Matrix communities for support

## Conclusion

The WhatsApp bridge provides a powerful way to integrate WhatsApp messaging with your Matrix infrastructure. With proper setup and configuration, users can seamlessly communicate across both platforms while maintaining security and privacy.

For additional help or advanced configuration options, refer to the official mautrix-whatsapp documentation or reach out to the Matrix community.