# Docker Setup Guide

This document explains the Docker configuration for the utility tokens demo.

## Files Created

### Root Level
- `docker-compose.yml` - Production configuration
- `docker-compose.dev.yml` - Development configuration with hot reload
- `Makefile` - Convenient commands for running Docker
- `.dockerignore` - Excludes unnecessary files from Docker builds

### Tokenization Frontend (`tokenization/frontend/`)
- `Dockerfile` - Multi-stage build with Nginx for production
- `Dockerfile.dev` - Development image for hot reload
- `nginx.conf` - Nginx configuration for serving the SPA
- `.dockerignore` - Frontend-specific exclusions
- `.env.production` - Production environment variables
- `.env.development` - Development environment variables

### Tokenization Overlay (`tokenization/overlay/`)
- `Dockerfile` - Overlay service image
- `.dockerignore` - Overlay-specific exclusions

## Usage

### Quick Commands (with Make)

```bash
# Start production services
make prod

# Start development services (hot reload enabled)
make dev

# Stop services
make down

# View logs
make logs

# Clean everything (containers, volumes, images)
make clean

# See all available commands
make help
```

### Docker Compose Commands

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
- Multi-stage build: Node.js → Nginx
- Optimized production build
- Served via Nginx on port 8080
- Nginx handles SPA routing

**Tokenization Overlay Service**
- Remote overlay service at https://store-us-1.bsvb.tech
- Validates token minting and transfer transactions
- Handles token indexing and lookup queries

### Development Setup (`docker-compose.dev.yml`)

**Frontend Service**
- Runs Vite dev server
- Hot module replacement (HMR) enabled
- Source code mounted as volume
- Runs on port 8080

**Overlay Service**
- Remote overlay service (same as production)
- No local overlay needed for development

## Networking

- Frontend runs as standalone container
- Connects to remote overlay service at `https://store-us-1.bsvb.tech`
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
- `VITE_OVERLAY_URL` - Overlay service endpoint
  - Default: `https://store-us-1.bsvb.tech` (remote overlay service)

## Ports

**Production Mode**
- Frontend: http://localhost:8080
- Overlay Service: https://store-us-1.bsvb.tech (remote)

**Development Mode**
- Frontend: http://localhost:8080
- Overlay Service: https://store-us-1.bsvb.tech (remote)

## Troubleshooting

**Containers won't start**
```bash
# Check logs
make logs
# or
docker-compose logs -f

# Rebuild from scratch
make clean
make prod
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

1. **Environment Variables**: Update `.env.production` with production URLs
2. **SSL/TLS**: Configure Nginx with SSL certificates
3. **Reverse Proxy**: Consider using a reverse proxy (Traefik, Nginx) in front
4. **Logging**: Configure centralized logging
5. **Monitoring**: Add health checks and monitoring
6. **Security**: Review Nginx security headers in `nginx.conf`
7. **CDN**: Consider using a CDN for static asset delivery
8. **Caching**: Configure browser caching headers appropriately
