# Production stage
FROM nginx:alpine

# Copy built files to nginx (assuming build directory exists locally)
COPY build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]