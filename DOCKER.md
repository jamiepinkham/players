# Docker Development Guide

This repo contains Docker configuration for **local development and testing only**.

For production/QA deployment configuration, see the separate **players-deployment** repo.

## Files in This Repo

### `Dockerfile`
Builds the Rails application Docker image.

```bash
# Build the image
docker build -t players:latest -f Dockerfile rails/

# Used by GitHub Actions to build production images
```

### `docker-compose.yml`
Local development environment with code hot-reloading.

**Services:**
- `players` - Rails app (mounts local code for live changes)
- `db` - PostgreSQL 16
- `redis` - Redis 7 (for caching and background jobs)

**Usage:**
```bash
# Start development environment
docker compose up

# App runs at http://localhost:3000
# Code changes auto-reload (no rebuild needed)

# Run migrations
docker compose exec players rails db:migrate

# Access Rails console
docker compose exec players rails console

# Stop environment
docker compose down
```

### `docker-compose.test.yml`
Test environment for running RSpec tests in Docker.

**Usage:**
```bash
# Build test image
docker build -t players-test:latest -f Dockerfile rails/

# Run tests
docker compose -f docker-compose.test.yml up --abort-on-container-exit

# Tests run against fresh database
# Results output to console
```

### `.dockerignore`
Excludes files from Docker image builds (node_modules, tmp, logs, etc.)

## Production Deployment

**DO NOT use these files for production deployment!**

Production/QA stack configuration is in the **players-deployment** repo:
- `~/dev/players-deployment/stack/docker-compose.consolidated.yml`
- `~/dev/players-deployment/docs/DEPLOYMENT.md`

## Local Development Workflow

### First Time Setup

1. **Create environment file:**
   ```bash
   cp rails/.env.example rails/.env
   # Edit .env with local development values
   ```

2. **Start services:**
   ```bash
   docker compose up -d
   ```

3. **Setup database:**
   ```bash
   docker compose exec players rails db:create db:migrate db:seed
   ```

4. **Access app:**
   Open http://localhost:3000

### Daily Development

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f players

# Make code changes (auto-reloads!)
# Edit files in rails/app, rails/config, etc.

# Run migrations
docker compose exec players rails db:migrate

# Run tests
docker compose -f docker-compose.test.yml up

# Stop services
docker compose down
```

### Troubleshooting

**Database connection errors:**
```bash
# Reset database
docker compose down -v  # Warning: deletes data!
docker compose up -d
docker compose exec players rails db:create db:migrate
```

**Port already in use:**
```bash
# Stop conflicting service on port 3000
lsof -ti:3000 | xargs kill

# Or change port in docker-compose.yml
ports:
  - "3001:3000"  # Access at localhost:3001
```

**Cache issues:**
```bash
# Rebuild image
docker compose build --no-cache players
docker compose up -d
```

## Differences from Production

Local development differs from production:

| Feature | Development | Production |
|---------|------------|------------|
| Code changes | Auto-reload (mounted) | Baked into image |
| Database | Local postgres container | Managed postgres on fenway |
| Redis | Local redis container | Shared redis on fenway |
| HTTPS | Not used | Cloudflare + Caddy |
| Secrets | .env file | Portainer environment vars |
| Deployment | docker compose up | Portainer stack update |

## Testing Before Deployment

Before deploying to QA/production:

1. **Run full test suite:**
   ```bash
   docker compose -f docker-compose.test.yml up
   ```

2. **Test production build:**
   ```bash
   # Build production image
   docker build -t players:test -f Dockerfile rails/

   # Run it locally
   docker run -p 3000:3000 --env-file rails/.env players:test
   ```

3. **Verify migrations:**
   ```bash
   docker compose exec players rails db:migrate:status
   ```

## Additional Resources

- **Application deployment**: See `DEPLOYMENT_CHECKLIST.md`
- **Stack infrastructure**: See `~/dev/players-deployment/`
- **Cache warmup**: See `rails/CACHE_WARMUP.md`
