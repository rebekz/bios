# Matrix Synapse Homeserver

This directory contains the configuration and setup for the Matrix Synapse homeserver, which is the core component of our messaging platform.

## Features

- **Matrix Protocol**: Full implementation of the Matrix protocol for secure messaging
- **PostgreSQL Database**: Reliable data storage with PostgreSQL backend
- **Application Service Support**: Integration with AI bot through application services
- **User Registration**: Open registration for new users
- **Room Management**: Create and manage chat rooms
- **Federation**: Connect with other Matrix servers (configurable)

## Configuration

### Main Configuration Files

- `homeserver.yaml` - Main Synapse configuration
- `log.config` - Logging configuration
- `ai-bot-registration.yaml` - AI bot application service registration

### Key Configuration Sections

#### Server Settings
```yaml
server_name: "localhost"
public_baseurl: "http://localhost:8008/"
listeners:
  - port: 8008
    bind_addresses: ['0.0.0.0']
```

#### Database
```yaml
database:
  name: psycopg2
  args:
    host: postgres
    user: synapse
    password: synapse_password
    database: synapse
```

#### Registration
```yaml
enable_registration: true
enable_registration_without_verification: true
```

## Security

The homeserver is configured with several security features:

- **Secrets**: Macaroon and form secrets are auto-generated during setup
- **Rate Limiting**: Built-in rate limiting for messages, registration, and login
- **Federation Control**: Whitelist-based federation (localhost only by default)

## Directory Structure

```
synapse/
├── Dockerfile              # Container configuration
├── homeserver.yaml         # Main Synapse config
├── log.config             # Logging configuration
├── ai-bot-registration.yaml # AI bot registration
├── data/                  # Synapse data directory
└── config/               # Additional config files
```

## Development

### Local Development

1. **Configuration**: Edit `homeserver.yaml` for local development settings
2. **Database**: The container connects to the PostgreSQL service
3. **Logs**: Check logs with `docker-compose logs synapse`

### Production Considerations

For production deployment:

1. **TLS/SSL**: Enable HTTPS and configure proper certificates
2. **Federation**: Configure federation settings if connecting to other servers
3. **Database**: Use managed PostgreSQL service
4. **Secrets**: Use secure secret management
5. **Monitoring**: Enable metrics and monitoring

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and accessible
2. **Port Conflicts**: Check that ports 8008 and 8448 are available
3. **Permissions**: Ensure proper file permissions for data directory

### Useful Commands

```bash
# Check Synapse logs
docker-compose logs -f synapse

# Restart Synapse
docker-compose restart synapse

# Access Synapse container
docker-compose exec synapse bash

# Check database connection
docker-compose exec synapse python -c "import psycopg2; print('OK')"
```

## API Endpoints

The Synapse server exposes several API endpoints:

- `/_matrix/client/` - Client API
- `/_matrix/federation/` - Federation API
- `/_synapse/admin/` - Admin API
- `/health` - Health check endpoint

## Matrix Specifications

This Synapse installation supports:

- Matrix Client-Server API v1.5
- Matrix Server-Server API v1.0
- End-to-End Encryption
- Application Services
- Push Notifications