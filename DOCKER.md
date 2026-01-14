# Docker Setup Guide

This document explains the Docker configuration for the utility tokens demo.

## Files

### Root Level
- `docker-compose.yml` - Production configuration
- `docker-compose.dev.yml` - Development configuration with hot reload
- `Dockerfile` - Multi-stage build for Next.js production
- `Dockerfile.dev` - Development image for hot reload
- `.dockerignore` - Excludes unnecessary files from Docker builds

## Usage

### Quick Commands (with npm scripts)

```bash
# Start production services
npm run docker:prod

# Start development services (hot reload enabled)
npm run docker:dev

# Stop services
npm run docker:down

# View logs
npm run docker:logs

# Clean everything (containers, volumes, images)
npm run docker:clean

# Build images
npm run docker:build

# Start services in background
npm run docker:up
```

### Docker Compose Commands (Direct)

**Production**
```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f
```

**Development**
```bash
# Build and start
docker-compose -f docker-compose.dev.yml up --build

# Run in background
docker-compose -f docker-compose.dev.yml up -d

# Stop
docker-compose -f docker-compose.dev.yml down
```

## Architecture

### Production Setup (`docker-compose.yml`)

**Tokenization Frontend Service**
- Multi-stage build: deps → builder → runner
- Next.js standalone output for optimal production builds
- Self-contained Node.js server on port 8080
- Runs as non-root user for security

**Tokenization Overlay Service**
- Remote overlay service at https://overlay-us-1.bsvb.tech
- Validates token minting and transfer transactions
- Handles token indexing and lookup queries

### Development Setup (`docker-compose.dev.yml`)

**Frontend Service**
- Runs Next.js dev server with webpack
- Hot module replacement (HMR) enabled
- Source code mounted as volume for live updates
- Runs on port 8080

**Overlay Service**
- Remote overlay service (same as production)
- No local overlay needed for development

## Networking

- Frontend runs as standalone container
- Connects to remote overlay service at `https://overlay-us-1.bsvb.tech`
- Port 8080 exposed for browser access

## Volumes

**Production**
- No source code mounting (built into image)
- Static assets served from container

**Development**
- Source code mounted for hot reload
- `node_modules` excluded via volume mount

## Environment Variables

**Frontend**
- `NEXT_PUBLIC_OVERLAY_URL` - Overlay service endpoint
  - Default: `https://overlay-us-1.bsvb.tech` (remote overlay service)

## Ports

**Production Mode**
- Frontend: http://localhost:8080
- Overlay Service: https://overlay-us-1.bsvb.tech (remote)

**Development Mode**
- Frontend: http://localhost:8080
- Overlay Service: https://overlay-us-1.bsvb.tech (remote)

## Troubleshooting

**Containers won't start**
```bash
# Check logs
npm run docker:logs
# or
docker-compose logs -f

# Rebuild from scratch
npm run docker:clean
npm run docker:prod
```

**Port conflicts**
```bash
# Check what's using the port
lsof -i :8080

# Change port in docker-compose.yml if needed
```

**Hot reload not working in dev mode**
```bash
# Ensure you're using the dev compose file
docker-compose -f docker-compose.dev.yml up

# Check that volumes are mounted correctly
docker-compose -f docker-compose.dev.yml config
```

## Production Deployment Notes

For production deployment:

1. **Environment Variables**: Set `NEXT_PUBLIC_OVERLAY_URL` build arg in docker-compose.yml
2. **SSL/TLS**: Configure SSL certificates (using Nginx or cloud provider)
3. **Reverse Proxy**: Consider using a reverse proxy (Traefik, Nginx, Caddy) in front
4. **Logging**: Configure centralized logging for the Next.js container
5. **Monitoring**: Add health checks and monitoring
6. **Security**: Next.js runs as non-root user; review security headers in next.config.mjs
7. **CDN**: Consider using a CDN for static asset delivery
8. **Caching**: Configure appropriate caching headers in Next.js config
