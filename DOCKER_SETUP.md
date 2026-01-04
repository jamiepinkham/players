# Docker Compose Setup

This project uses docker-compose with environment-specific configurations to avoid redundant settings.

## File Structure

- `docker-compose.yml` - Base configuration (common settings)
- `docker-compose.override.yml` - Development overrides (auto-loaded locally)
- `docker-compose.qa.yml` - QA environment overrides
- `docker-compose.prod.yml` - Production environment overrides
- `.env` - Environment variables (create from `.env.example`)

## Environment Setup

### Development (Local)

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your local settings

3. Run docker-compose (automatically uses base + override):
   ```bash
   docker-compose up --build
   ```

### QA Environment

1. Create `.env` with QA-specific values:
   ```bash
   DATABASE_NAME=players_qa
   RAILS_ENV=production
   # ... other QA settings
   ```

2. Run with QA configuration:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.qa.yml up -d
   ```

### Production Environment

1. Create `.env` with production values:
   ```bash
   DATABASE_NAME=players_production
   RAILS_ENV=production
   SECRET_KEY_BASE=<secure-random-key>
   # ... other production settings
   ```

2. Run with production configuration:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

## Key Differences by Environment

| Feature | Development | QA | Production |
|---------|-------------|-----|------------|
| Image | Built locally | ghcr.io/jamiepinkham/players:qa | ghcr.io/jamiepinkham/players:main |
| Volumes | Mounted for hot-reload | None | None |
| Restart | No | unless-stopped | unless-stopped |
| Ports | 3000:3000 | 3000:3000 | Not exposed directly |
| Networks | default | default | default + web (external) |
| Asset Watch | Enabled | Disabled | Disabled |

## Environment Variables

See `.env.example` for all available environment variables. Key variables:

- `DATABASE_USER` / `DATABASE_PASSWORD` - Postgres credentials
- `DATABASE_NAME` - Database name (different per environment)
- `DATABASE_HOST` - Database host (usually `db`)
- `SECRET_KEY_BASE` - Rails secret key (generate with `rails secret`)
- `RAILS_ENV` - Rails environment (development/production)

## Notes

- Development automatically includes hot-reload and volume mounts
- QA and Production pull pre-built images from GitHub Container Registry
- The `web` network in production is external (for reverse proxy integration)
- Never commit your `.env` file - it contains secrets
