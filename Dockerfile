# =============================================================================
# Model Garden - Dockerfile
# =============================================================================
# Multi-stage build for production deployment
# - Stage 1: Build the React app with Vite
# - Stage 2: Serve with Nginx
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Build
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY package.json package-lock.json* ./

# Install dependencies (ci for reproducible builds)
RUN npm ci

# Copy source files
COPY . .

# Configure the LLM server URL
# Default: host.docker.internal:1234 (reaches LM Studio on host machine)
# Override with: docker build --build-arg VITE_LM_STUDIO_URL=http://your-server:1234
ARG VITE_LM_STUDIO_URL=http://host.docker.internal:1234
ENV VITE_LM_STUDIO_URL=$VITE_LM_STUDIO_URL

# Build the production bundle
RUN npm run build

# -----------------------------------------------------------------------------
# Stage 2: Production
# -----------------------------------------------------------------------------
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose HTTP port
EXPOSE 80

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
