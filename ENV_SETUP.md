# Environment Setup Quick Start

## Production Setup (5 minutes)

### 1. Create Production Environment File

```bash
# Copy the example file
cp .env.production.example .env.production
```

### 2. Generate Secure Secrets

```bash
# Generate SECRET_KEY_BASE
openssl rand -hex 64

# Or using Rails (if available)
docker run --rm ruby:3.1.2-slim bash -c "gem install bundler && rails secret"

# Generate secure database password
openssl rand -base64 32
```

### 3. Edit Production Environment File

```bash
nano .env.production
```

**Minimum required configuration:**

```bash
# REQUIRED
SECRET_KEY_BASE=<paste_generated_secret_here>
DATABASE_HOST=db
DATABASE_USER=postgres
DATABASE_PASSWORD=<paste_generated_password_here>
DATABASE_NAME=players_production

# RECOMMENDED
RAILS_ENV=production
RACK_ENV=production
RAILS_LOG_TO_STDOUT=true
RAILS_SERVE_STATIC_FILES=true
```

### 4. Validate Configuration

```bash
# Validate your environment setup
./scripts/validate_env.sh production
```

Expected output:
```
✅ VALIDATION PASSED
All required variables are configured.
You can deploy to production.
```

### 5. Deploy

```bash
cd deploy
docker-compose -f docker-compose.prod.yml up -d
```

## Development Setup

```bash
# Development uses .env (already exists)
# Just verify it's correct:
cat .env

# Should have:
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=players_development
DATABASE_HOST=db
SECRET_KEY_BASE=123ChangeMe
RAILS_ENV=development
```

## Common Issues

### Issue: "FATAL ERROR: Required environment variables are not properly configured"

**Cause**: Missing or invalid environment variables in production

**Fix**:
1. Check that `.env.production` exists
2. Run validation: `./scripts/validate_env.sh production`
3. Fix any reported issues
4. Restart: `docker-compose -f deploy/docker-compose.prod.yml restart web`

### Issue: "KeyError: key not found: DATABASE_HOST"

**Cause**: Environment file not loaded or variable not set

**Fix**:
```bash
# Ensure .env.production exists and has DATABASE_HOST
grep DATABASE_HOST .env.production

# Verify docker-compose loads the file
docker-compose -f deploy/docker-compose.prod.yml config | grep DATABASE_HOST
```

### Issue: SECRET_KEY_BASE is too short or invalid

**Cause**: Using placeholder or weak secret

**Fix**:
```bash
# Generate new secret
openssl rand -hex 64 > /tmp/secret.txt

# Update .env.production with the generated value
nano .env.production

# Paste the secret into SECRET_KEY_BASE=
```

## Security Checklist

Before deploying to production:

- [ ] `.env.production` exists and is configured
- [ ] `SECRET_KEY_BASE` is at least 64 characters
- [ ] `SECRET_KEY_BASE` is unique (not from example)
- [ ] `DATABASE_PASSWORD` is strong and unique
- [ ] `.env.production` is in `.gitignore` (verify: `git status`)
- [ ] All placeholder values replaced with real values
- [ ] Validation script passes: `./scripts/validate_env.sh production`
- [ ] Environment file permissions are restrictive: `chmod 600 .env.production`

## Files Overview

```
.env.template              # Development template (committed)
.env                       # Development secrets (gitignored)
.env.production.example    # Production template (committed)
.env.production           # Production secrets (gitignored)
ENV_VARS.md               # Full documentation
ENV_SETUP.md              # This quick start guide
```

## Helper Commands

```bash
# Validate production environment
./scripts/validate_env.sh production

# Generate new SECRET_KEY_BASE
openssl rand -hex 64

# Generate secure password
openssl rand -base64 32

# Check current environment in container
docker-compose -f deploy/docker-compose.prod.yml exec web env | grep -E "RAILS_ENV|DATABASE"

# Test database connection
docker-compose -f deploy/docker-compose.prod.yml exec web bundle exec rails runner "puts ActiveRecord::Base.connection.execute('SELECT 1').first"
```

## Next Steps

After environment is configured:

1. **Deploy**: Follow [deploy/README.md](deploy/README.md)
2. **Run migrations**: `docker-compose -f deploy/docker-compose.prod.yml exec web bundle exec rails db:migrate`
3. **Verify**: Check logs and access the application
4. **Backup secrets**: Store `.env.production` in secure password manager

## References

- [ENV_VARS.md](ENV_VARS.md) - Complete environment variables documentation
- [deploy/README.md](deploy/README.md) - Production deployment guide
- [12 Factor App - Config](https://12factor.net/config)
