# Matrix Web Client

A modern React-based web client for the Matrix messaging platform with a beautiful UI and real-time messaging capabilities.

## Features

- **Modern UI**: Clean, responsive design with gradient backgrounds and animations
- **Real-time Messaging**: WebSocket-based real-time communication
- **Matrix Integration**: Full integration with Matrix protocol using matrix-js-sdk
- **Room Management**: Create, join, and manage chat rooms
- **User Authentication**: Secure login and registration
- **Message History**: Persistent conversation history
- **Responsive Design**: Works on desktop and mobile devices
- **AI Bot Integration**: Seamless interaction with AI bot

## Technology Stack

- **React 18**: Modern React with hooks and context
- **Matrix JS SDK**: Official JavaScript SDK for Matrix
- **Styled Components**: CSS-in-JS styling
- **React Router**: Client-side routing
- **React Hot Toast**: Beautiful toast notifications
- **Date-fns**: Date and time formatting
- **Lucide React**: Beautiful icons

## Project Structure

```
web-client/
├── public/
│   ├── index.html         # Main HTML template
│   └── manifest.json      # PWA manifest
├── src/
│   ├── components/        # React components
│   │   ├── LoginPage.js   # Authentication page
│   │   ├── ChatPage.js    # Main chat interface
│   │   └── LoadingSpinner.js # Loading component
│   ├── App.js            # Main application component
│   ├── index.js          # Application entry point
│   └── index.css         # Global styles
├── Dockerfile            # Container configuration
├── nginx.conf           # Nginx configuration
└── package.json         # Dependencies and scripts
```

## Key Components

### App.js
- **Matrix Context**: Provides Matrix client to all components
- **Authentication**: Handles login/logout state
- **Routing**: Manages client-side routing

### LoginPage.js
- **Dual Mode**: Login and registration forms
- **Validation**: Form validation and error handling
- **Responsive**: Mobile-friendly design

### ChatPage.js
- **Room List**: Sidebar with all joined rooms
- **Message Display**: Real-time message rendering
- **Message Input**: Send messages with Enter key support
- **Auto-scroll**: Automatically scrolls to new messages

## Styling

The application uses a modern design system with:

- **Color Scheme**: Purple gradient theme
- **Typography**: Inter font family
- **Components**: Card-based layouts with shadows
- **Animations**: Smooth transitions and hover effects
- **Responsive**: Mobile-first responsive design

### CSS Architecture

- **Global Styles**: Base styles and resets in `index.css`
- **Component Styles**: Component-specific styles
- **Utility Classes**: Common utility classes for layout
- **CSS Variables**: Consistent color and spacing system

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Running Matrix homeserver

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### Environment Variables

```env
REACT_APP_MATRIX_SERVER_URL=http://localhost:8008
```

### Development Commands

```bash
# Start with hot reload
npm start

# Build optimized bundle
npm run build

# Serve production build
npx serve -s build

# Analyze bundle size
npm run build && npx webpack-bundle-analyzer build/static/js/*.js
```

## Features in Detail

### Authentication
- Login with Matrix credentials
- Registration for new users
- Persistent session management
- Automatic session restoration

### Messaging
- Real-time message delivery
- Message history loading
- User avatars with initials
- Message timestamps
- Own messages highlighted

### Room Management
- Room list with last messages
- Room creation with AI bot invitation
- Room selection and switching
- Room member count display

### User Experience
- Loading states and spinners
- Error handling with toast notifications
- Responsive design for all screen sizes
- Keyboard shortcuts (Enter to send)
- Auto-focus on message input

## Deployment

### Production Build

The application is built as a static React app and served through Nginx:

```dockerfile
# Multi-stage build
FROM node:18-alpine as builder
# ... build steps ...

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
```

### Nginx Configuration

The included `nginx.conf` provides:

- Static file serving with caching
- Matrix API proxying
- Client-side routing support
- Security headers
- Gzip compression

## API Integration

### Matrix Client Setup

```javascript
const client = sdk.createClient({
  baseUrl: 'http://localhost:8008',
  store: new sdk.MemoryStore(),
  scheduler: new sdk.MatrixScheduler(),
});
```

### Event Handling

```javascript
client.on('Room.timeline', (event, room) => {
  // Handle new messages
});

client.on('Room', (room) => {
  // Handle room updates
});
```

## Troubleshooting

### Common Issues

1. **Connection Issues**: Check Matrix server is running
2. **CORS Errors**: Ensure proper nginx configuration
3. **Build Failures**: Clear node_modules and reinstall
4. **Performance**: Check for unnecessary re-renders

### Debug Mode

Enable debug logging:

```javascript
localStorage.setItem('mx_log_level', 'debug');
```

## Contributing

1. **Code Style**: Follow existing patterns
2. **Components**: Keep components small and focused
3. **Styling**: Use existing CSS classes when possible
4. **Testing**: Add tests for new features

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Optimization

- **Code Splitting**: Automatic with Create React App
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components
- **Bundle Size**: Optimized with webpack