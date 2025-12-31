# Environment Variables Documentation

This document describes all environment variables used by the Players application.

## Quick Start

1. **Development**: Copy `.env.template` to `.env`
2. **Production**: Copy `.env.production.example` to `.env.production`

```bash
# Development
cp .env.template .env

# Production
cp .env.production.example .env.production
nano .env.production  # Edit with real values
```

## Required Variables (Production)

These variables **MUST** be set in production. The application will fail to start without them.

### `SECRET_KEY_BASE`
- **Required in**: Production
- **Purpose**: Encrypts sessions, cookies, and other sensitive data
- **Format**: Long random string (minimum 32 characters, recommend 64+)
- **Generate with**:
  ```bash
  rails secret
  # or
  openssl rand -hex 64
  ```
- **Example**: `abc123def456...` (64+ characters)
- **Security**: Must be unique per environment, never commit to git

### `DATABASE_HOST`
- **Required in**: Production
- **Purpose**: PostgreSQL server hostname
- **Format**: Hostname or IP address
- **Example**: `db` (Docker), `localhost`, `192.168.1.100`
- **Default**: `db` (development)

### `DATABASE_USER`
- **Required in**: Production
- **Purpose**: PostgreSQL username
- **Format**: String
- **Example**: `postgres`, `players_user`
- **Default**: `postgres` (development)

### `DATABASE_PASSWORD`
- **Required in**: Production
- **Purpose**: PostgreSQL password
- **Format**: String
- **Example**: Use a strong, random password
- **Security**: Never use default passwords in production
- **Generate with**: `openssl rand -base64 32`

### `DATABASE_NAME`
- **Required in**: Production
- **Purpose**: PostgreSQL database name
- **Format**: String
- **Example**: `players_production`, `players_app`
- **Default**: `players_development` (development)

## Recommended Variables (Production)

These should be set for optimal production operation.

### `RAILS_ENV`
- **Purpose**: Rails environment mode
- **Format**: `production`, `development`, `staging`, `test`
- **Example**: `production`
- **Default**: `development`
- **Note**: Must be `production` in production

### `RACK_ENV`
- **Purpose**: Rack middleware environment
- **Format**: `production`, `development`, `staging`
- **Example**: `production`
- **Default**: Inherits from RAILS_ENV
- **Note**: Should match RAILS_ENV

### `RAILS_LOG_TO_STDOUT`
- **Purpose**: Output logs to stdout (required for Docker/containers)
- **Format**: `true`, `false`, `1`, `0`
- **Example**: `true`
- **Default**: `false`
- **Recommended**: `true` for Docker deployments

### `RAILS_LOG_LEVEL`
- **Purpose**: Minimum log level
- **Format**: `debug`, `info`, `warn`, `error`, `fatal`
- **Example**: `info`
- **Default**: `debug` (development), `info` (production)
- **Recommendation**: Use `info` initially, `warn` after stable

### `RAILS_SERVE_STATIC_FILES`
- **Purpose**: Serve static assets from Rails (vs nginx/CDN)
- **Format**: `true`, `false`, `1`, `0`
- **Example**: `true`
- **Default**: `false`
- **When to use**: Docker deployments without reverse proxy serving assets

### `RAILS_MAX_THREADS`
- **Purpose**: Maximum threads per Puma worker
- **Format**: Integer (1-32)
- **Example**: `5`
- **Default**: `5`
- **Tuning**: Higher values = more concurrent requests, more memory

### `PORT`
- **Purpose**: Port for web server to listen on
- **Format**: Integer (1-65535)
- **Example**: `3000`
- **Default**: `3000`

## Optional Variables

### Performance & Scaling

#### `WEB_CONCURRENCY`
- **Purpose**: Number of Puma worker processes
- **Format**: Integer (1-16)
- **Example**: `2`
- **Default**: `1` (single process)
- **Note**: Requires `preload_app!` in puma.rb
- **Recommendation**: 2-4 workers for production

### Security & CORS

#### `APP_HOST`
- **Purpose**: Primary application hostname for host authorization
- **Format**: Hostname (no protocol, no wildcards)
- **Example**: `players.billymartinplayersleague.com`
- **Default**: `players.billymartinplayersleague.com`
- **Required**: Yes (production)
- **Security**: Used for host authorization - Rails will only accept requests to this hostname

#### `CORS_ORIGINS`
- **Purpose**: Allowed CORS origins for API requests
- **Format**: Comma-separated list of origins
- **Example**: `https://app.example.com,https://example.com`
- **Default**: `localhost:3000,localhost:5100`

#### `FORCE_SSL` (Deprecated - Always Enabled)
- **Purpose**: Force all traffic over HTTPS
- **Status**: **ALWAYS ENABLED** in production via `config.force_ssl = true`
- **Behavior**: All HTTP requests automatically redirected to HTTPS
- **Recommendation**: Keep enabled for security

#### `TRUSTED_HOSTS`
- **Purpose**: Additional hostnames allowed by host authorization
- **Format**: Comma-separated list of hostnames (NO wildcards)
- **Example**: `www.players.billymartinplayersleague.com,api.players.billymartinplayersleague.com`
- **Default**: None
- **Security**: Each hostname must be explicitly listed. Wildcards like `*.example.com` are NOT allowed

### Email (Action Mailer)

#### `SMTP_ADDRESS`
- **Purpose**: SMTP server hostname
- **Example**: `smtp.sendgrid.net`, `smtp.gmail.com`

#### `SMTP_PORT`
- **Purpose**: SMTP server port
- **Example**: `587` (TLS), `465` (SSL), `25` (plain)

#### `SMTP_DOMAIN`
- **Purpose**: HELO domain
- **Example**: `example.com`

#### `SMTP_USERNAME`
- **Purpose**: SMTP authentication username
- **Example**: `apikey` (SendGrid), `your@email.com`

#### `SMTP_PASSWORD`
- **Purpose**: SMTP authentication password
- **Example**: Your SMTP password or API key
- **Security**: Keep secret, rotate regularly

#### `MAILER_FROM`
- **Purpose**: Default "from" email address
- **Example**: `noreply@example.com`

### CDN & Assets

#### `ASSET_HOST`
- **Purpose**: CDN hostname for assets
- **Format**: URL
- **Example**: `https://cdn.example.com`
- **Default**: None (serve from app)

### Application URLs

#### `APP_HOST`
- **Purpose**: Application hostname (for URL generation)
- **Example**: `example.com`

#### `APP_PROTOCOL`
- **Purpose**: Application protocol
- **Example**: `https`, `http`
- **Default**: `http`

## Environment Files

### File Precedence
Rails loads environment variables in this order (later overrides earlier):

1. System environment variables
2. `.env` (committed as template)
3. `.env.local` (gitignored, local overrides)
4. `.env.[environment]` (e.g., `.env.production`)
5. `.env.[environment].local`

### Recommended Setup

```
.env.template          # Committed - development defaults
.env.production.example # Committed - production template
.env                   # Gitignored - local development
.env.production        # Gitignored - production secrets
```

## Validation

The application validates required environment variables at startup in production.

### Validation Rules

1. **Required variables must exist** - Cannot be `nil`
2. **Required variables must not be empty** - Cannot be blank strings
3. **SECRET_KEY_BASE validation**:
   - Must be at least 32 characters
   - Cannot contain "change", "example", "your_"
4. **Database variable validation**:
   - Cannot contain "your_", "example", or placeholder text

### Validation Failure

If validation fails, the application will:
1. Print a detailed error message to STDERR
2. List missing/invalid variables
3. Exit with code 1 (fail-fast)

Example error:
```
================================================================================
FATAL ERROR: Required environment variables are not properly configured
================================================================================

Missing required environment variables:
  ❌ SECRET_KEY_BASE

Invalid or placeholder environment variables:
  ⚠️  DATABASE_PASSWORD (appears to be a placeholder)

Please ensure all required environment variables are set before starting
the application in production mode.
...
```

## Security Best Practices

1. **Never commit secrets to git**
   - `.env.production` is gitignored
   - Only commit `.env.production.example` templates

2. **Use strong random values**
   - Generate SECRET_KEY_BASE with `rails secret` or `openssl rand -hex 64`
   - Use complex database passwords

3. **Rotate secrets regularly**
   - SECRET_KEY_BASE rotation requires user re-authentication
   - Plan for zero-downtime secret rotation

4. **Use different values per environment**
   - Development, staging, and production must have unique secrets
   - Never copy production secrets to development

5. **Restrict access to production secrets**
   - Store in secure secret management system
   - Use environment variables in CI/CD, not committed files

## Docker & Container Deployments

For Docker deployments, environment variables can be set via:

1. **docker-compose.yml**
   ```yaml
   services:
     web:
       environment:
         RAILS_ENV: production
         DATABASE_HOST: db
       env_file:
         - .env.production
   ```

2. **Dockerfile ENV**
   ```dockerfile
   ENV RAILS_ENV=production
   ENV RAILS_LOG_TO_STDOUT=true
   ```

3. **docker run -e**
   ```bash
   docker run -e SECRET_KEY_BASE=xxx -e DATABASE_HOST=db ...
   ```

**Recommendation**: Use `env_file` in docker-compose for local development, and inject secrets via CI/CD for production.

## Troubleshooting

### Application won't start in production
- Check that all required variables are set
- Verify SECRET_KEY_BASE is not a placeholder
- Check logs: `docker-compose logs web`

### Database connection fails
- Verify DATABASE_HOST is correct
- Check DATABASE_USER and DATABASE_PASSWORD
- Ensure database is running: `docker-compose ps db`

### Assets not loading
- Set `RAILS_SERVE_STATIC_FILES=true` if not using CDN
- Verify assets were precompiled during build
- Check logs for asset pipeline errors

### Logs not appearing
- Set `RAILS_LOG_TO_STDOUT=true` for Docker deployments
- Check log level: `RAILS_LOG_LEVEL=info` or `debug`

## References

- [Rails Environment Variables](https://guides.rubyonrails.org/configuring.html#custom-configuration)
- [dotenv gem](https://github.com/bkeepers/dotenv)
- [12 Factor App - Config](https://12factor.net/config)
