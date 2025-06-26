# Document Uploader

A web application for uploading documents and sending notifications to Matrix rooms via the AI bot.

## Features

- 📄 **Document Upload**: Support for various document formats (PDF, DOC, DOCX, TXT, RTF, ODT)
- 🚀 **Matrix Integration**: Send notifications to Matrix rooms when documents are uploaded
- 🎨 **Modern UI**: Clean, responsive web interface with drag-and-drop support
- 🔒 **Security**: File type validation, size limits, and secure file handling
- 📱 **Mobile Friendly**: Responsive design that works on all devices

## Supported File Types

- `.pdf` - PDF documents
- `.doc` - Microsoft Word (Legacy)
- `.docx` - Microsoft Word (Modern)
- `.txt` - Plain text files
- `.rtf` - Rich Text Format
- `.odt` - OpenDocument Text

**Maximum file size**: 10MB

## Configuration

The application uses environment variables for configuration:

```bash
MATRIX_SERVER_URL=http://localhost:8008    # Matrix homeserver URL
MATRIX_USERNAME=@aibot:localhost           # Bot username
MATRIX_PASSWORD=aibot_password             # Bot password
```

## Installation & Usage

### Option 1: Docker (Recommended)

1. Build the Docker image:
```bash
docker build -t document-uploader .
```

2. Run the container:
```bash
docker run -d \
  --name document-uploader \
  -p 8080:8080 \
  -e MATRIX_SERVER_URL=http://host.docker.internal:8008 \
  -e MATRIX_USERNAME=@aibot:localhost \
  -e MATRIX_PASSWORD=aibot_password \
  -v ./uploads:/app/uploads \
  document-uploader
```

3. Access the application at `http://localhost:8080`

### Option 2: Local Development

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export MATRIX_SERVER_URL=http://localhost:8008
export MATRIX_USERNAME=@aibot:localhost
export MATRIX_PASSWORD=aibot_password
```

3. Run the application:
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

4. Access the application at `http://localhost:8080`

## Usage Examples

### Basic Usage
1. Visit `http://localhost:8080/` to see available rooms
2. Click on a room to access its upload page
3. Upload your document and add an optional message

### Direct Room Access
If you know the room ID, you can access the upload page directly:
```
http://localhost:8080/upload/!roomid:example.com
```

### Shareable Links
You can share direct upload links with team members:
- `http://localhost:8080/upload/!general:company.com` - General discussion room
- `http://localhost:8080/upload/!documents:company.com` - Document sharing room

## Integration with Docker Compose

Add this service to your existing `docker-compose.yml`:

```yaml
services:
  # ... existing services ...
  
  document-uploader:
    build:
      context: ./document-uploader
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - MATRIX_SERVER_URL=http://synapse:8008
      - MATRIX_USERNAME=@aibot:localhost
      - MATRIX_PASSWORD=aibot_password
    depends_on:
      - synapse
      - ai-bot
    networks:
      - matrix_network
    volumes:
      - ./document-uploader/uploads:/app/uploads
    restart: unless-stopped
```

## API Endpoints

### Web Interface
- `GET /` - Room selection interface
- `GET /upload/{room_id}` - Upload form interface for specific room
- `POST /upload/{room_id}` - Handle file upload and send Matrix message to specific room

### API Endpoints
- `GET /rooms` - Get list of available Matrix rooms
- `GET /health` - Health check endpoint
- `POST /upload` - Legacy endpoint (returns error directing to use room-specific URL)

## How It Works

1. **Room Selection**: User visits the root URL (/) to see available Matrix rooms
2. **Direct Upload**: User accesses `/upload/{room_id}` directly or clicks a room from the selection page
3. **File Upload**: User selects a document (room is already determined by URL)
4. **Validation**: File type and size are validated
5. **Storage**: Document is saved to the uploads directory with timestamp
6. **Matrix Integration**: Application logs into Matrix and sends a notification message
7. **Confirmation**: User receives success/error feedback

## File Storage

Uploaded files are stored in the `uploads/` directory with the following naming convention:
```
YYYYMMDD_HHMMSS_originalfilename.ext
```

Example: `20241201_143022_report.pdf`

## Security Features

- **File Type Validation**: Only allowed file extensions are accepted
- **File Size Limits**: Maximum 10MB per file
- **Safe File Names**: Timestamps prevent filename conflicts
- **Non-root Container**: Docker container runs as non-root user
- **Input Validation**: All form inputs are validated

## Troubleshooting

### Common Issues

1. **No Matrix rooms available**
   - Ensure the AI bot is running and logged in
   - Check that the bot has joined some Matrix rooms
   - Verify Matrix server credentials

2. **Upload fails**
   - Check file size (max 10MB)
   - Verify file type is allowed
   - Check disk space in uploads directory

3. **Matrix message not sent**
   - Verify Matrix server is running
   - Check bot credentials
   - Ensure room ID is valid

### Logs

View application logs:
```bash
# Docker
docker logs document-uploader

# Local development
# Logs are printed to console
```

## Development

### Project Structure
```
document-uploader/
├── app/
│   └── main.py          # FastAPI application
├── templates/
│   └── upload.html      # Web interface
├── static/
│   └── style.css        # Additional styles
├── uploads/             # Uploaded files storage
├── requirements.txt     # Python dependencies
├── Dockerfile          # Container configuration
└── README.md           # This file
```

### Adding New Features

1. **New File Types**: Add extensions to `ALLOWED_EXTENSIONS` in `main.py`
2. **Custom Styling**: Modify `templates/upload.html` or `static/style.css`
3. **Additional Validation**: Update the `upload_document` function
4. **Matrix Features**: Extend the `MatrixClient` class

## License

This project is part of the BIOS Matrix platform. 