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
- Served via Nginx on port 80 (exposed as 8082)
- Nginx handles SPA routing

**Tokenization Overlay Service**
- Validates token minting and transfer transactions
- Runs on port 8083
- Connects to MySQL and MongoDB databases

**MySQL Database**
- Stores overlay service data
- Port 3306
- User: appuser, Password: apppass, Database: appdb

**MongoDB Database**
- Stores additional overlay data
- Port 27017
- User: root, Password: example

### Development Setup (`docker-compose.dev.yml`)

**Frontend Service**
- Runs Vite dev server
- Hot module replacement (HMR) enabled
- Source code mounted as volume
- Runs on port 5173

**Overlay Service**
- Development-friendly logging
- Source code mounted for hot reload
- Connects to development databases

## Networking

Both configurations use a custom bridge network called `token-network`:
- Services can communicate using service names
- Frontend calls overlay at `http://tokenization-overlay:8083`
- External access via mapped ports

## Volumes

**Production**
- No source code mounting (built into image)
- Database volumes for persistence

**Development**
- Source code directories mounted for hot reload
- `node_modules` explicitly excluded via volume mount
- Database volumes for persistence

## Environment Variables

**Frontend**
- `VITE_OVERLAY_URL` - Overlay service endpoint
  - Development: `http://localhost:8083/api`
  - Production: `http://localhost:8083/api`

**Overlay Service**
- `NODE_ENV` - production or development
- `PORT` - Server port (8083)
- `MYSQL_HOST` - MySQL database host
- `MYSQL_USER` - MySQL username
- `MYSQL_PASSWORD` - MySQL password
- `MYSQL_DATABASE` - MySQL database name
- `MONGODB_URI` - MongoDB connection string

## Ports

**Production Mode**
- Frontend: http://localhost:8082
- Overlay Service: http://localhost:8083
- MySQL: localhost:3306
- MongoDB: localhost:27017

**Development Mode**
- Frontend: http://localhost:5173
- Overlay Service: http://localhost:8083
- MySQL: localhost:3306
- MongoDB: localhost:27017

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
# Check what's using the ports
lsof -i :8082
lsof -i :8083
lsof -i :5173
lsof -i :3306
lsof -i :27017

# Change ports in docker-compose.yml if needed
```

**Database connection issues**
```bash
# Check if databases are running
docker-compose ps

# Check database logs
docker-compose logs mysql
docker-compose logs mongodb

# Restart databases
docker-compose restart mysql mongodb
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
7. **Database Security**: Use strong passwords and configure network access controls
8. **Backup**: Set up regular database backups

## Database Management

**MySQL**
```bash
# Connect to MySQL
docker-compose exec mysql mysql -u appuser -p

# Backup database
docker-compose exec mysql mysqldump -u appuser -p appdb > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T mysql mysql -u appuser -p appdb
```

**MongoDB**
```bash
# Connect to MongoDB
docker-compose exec mongodb mongosh -u root -p

# Backup database
docker-compose exec mongodb mongodump -u root -p --out /tmp/backup

# Restore database
docker-compose exec mongodb mongorestore -u root -p /tmp/backup
```
