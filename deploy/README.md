# Production Deployment Guide

This directory contains the production deployment configuration for the Players application on Mac mini.

## Architecture

```
Internet
    ↓
Cloudflare Tunnel (tunnel service)
    ↓
Caddy Reverse Proxy (proxy service) - ports 80/443
    ↓
Rails App (web service) - internal only
    ↓
PostgreSQL (db service) - internal only
```

## Prerequisites

- Docker and Docker Compose installed
- Cloudflare account with a tunnel configured
- Domain name (optional, can use Cloudflare tunnel domain)

## Setup

1. **Copy and configure environment file:**
   ```bash
   cd deploy
   cp .env.example .env
   nano .env  # Edit with your values
   ```

2. **Generate SECRET_KEY_BASE:**
   ```bash
   docker run --rm ruby:3.1.2-slim bash -c "gem install bundler && bundle exec rails secret"
   # Or use: openssl rand -hex 64
   ```

3. **Create Cloudflare Tunnel:**
   - Go to https://one.dash.cloudflare.com/
   - Navigate to Zero Trust > Access > Tunnels
   - Create a new tunnel and copy the token
   - Configure the tunnel to point to `http://proxy:80`
   - Add the token to your `.env` file

4. **Update Caddyfile if needed:**
   - Edit `Caddyfile` to customize reverse proxy settings
   - Update domain or add additional configurations

## Deployment

### First Time Deployment

```bash
cd deploy

# Build and start all services
docker-compose -f docker-compose.prod.yml up -d --build

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Run database migrations
docker-compose -f docker-compose.prod.yml exec web bundle exec rails db:create db:migrate

# Optional: Seed data
docker-compose -f docker-compose.prod.yml exec web bundle exec rails db:seed
```

### Updating Application

```bash
cd deploy

# Pull latest code (on your Mac mini)
git pull origin main

# Rebuild and restart web service
docker-compose -f docker-compose.prod.yml up -d --build web

# Run migrations if needed
docker-compose -f docker-compose.prod.yml exec web bundle exec rails db:migrate

# Check logs
docker-compose -f docker-compose.prod.yml logs -f web
```

## Management Commands

### View logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f web
docker-compose -f docker-compose.prod.yml logs -f db
docker-compose -f docker-compose.prod.yml logs -f proxy
```

### Stop services
```bash
docker-compose -f docker-compose.prod.yml stop
```

### Start services
```bash
docker-compose -f docker-compose.prod.yml start
```

### Restart services
```bash
docker-compose -f docker-compose.prod.yml restart web
```

### Access Rails console
```bash
docker-compose -f docker-compose.prod.yml exec web bundle exec rails console
```

### Database backup
```bash
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres players_production > backup-$(date +%Y%m%d-%H%M%S).sql
```

### Database restore
```bash
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres players_production < backup.sql
```

## Service Configuration

### Web Service (Rails)
- Built from `Dockerfile.web.prod`
- Runs Puma web server
- Not exposed to host (accessed via proxy)
- Restarts automatically unless stopped
- Environment: `RAILS_ENV=production`

### Database Service (PostgreSQL)
- PostgreSQL 13
- Data persisted in named volume `pgdata_prod`
- Only accessible from backend network
- Restarts automatically unless stopped

### Proxy Service (Caddy)
- Handles HTTPS/TLS termination
- Automatic SSL certificates via Let's Encrypt
- Reverse proxy to Rails app
- Exposed on ports 80/443
- Configuration in `Caddyfile`

### Tunnel Service (Cloudflare)
- Exposes application to internet
- No port forwarding needed
- DDoS protection
- Cloudflare CDN benefits

## Networks

- **backend**: Isolated network for db ↔ web communication
- **frontend**: Network for web ↔ proxy ↔ tunnel communication

## Volumes

- **pgdata_prod**: PostgreSQL data (persistent)
- **caddy_data**: SSL certificates and Caddy data
- **caddy_config**: Caddy configuration cache

## Troubleshooting

### Check service health
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Restart all services
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Remove and recreate (CAUTION: data loss if no backup)
```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

### View resource usage
```bash
docker stats
```

## Security Notes

- Rails is not directly exposed to the internet
- All traffic goes through Caddy (HTTPS) and Cloudflare Tunnel
- Database is only accessible from backend network
- Static files served with long cache headers
- Security headers configured in Caddy
- Containers run as non-root users
