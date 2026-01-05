# Deployment Checklist

Quick reference for deploying to QA or Production servers.

**Note:** This guide uses `~/edge` as the deployment directory. You can use any directory you prefer (e.g., `/opt/edge`, `/srv/edge`, etc.). Just replace `~/edge` throughout with your chosen path.

## Prerequisites

- [ ] Docker and docker-compose installed on server
- [ ] GitHub Personal Access Token with `read:packages` scope
- [ ] SSH access to deployment server
- [ ] Server meets minimum requirements (2GB RAM, 10GB disk)

## Files to Copy to Server

### For QA Server

```bash
scp docker-compose.yml deploy@qa-server:~/edge/
scp docker-compose.qa.yml deploy@qa-server:~/edge/
scp deploy.sh deploy@qa-server:~/edge/
scp .env.qa deploy@qa-server:~/edge/.env.template
```

### For Production Server

```bash
scp docker-compose.yml deploy@prod-server:~/edge/
scp docker-compose.prod.yml deploy@prod-server:~/edge/
scp deploy.sh deploy@prod-server:~/edge/
scp .env.prod deploy@prod-server:~/edge/.env.template
```

## Initial Server Setup

### 1. Create Deployment Directory

```bash
ssh deploy@server
mkdir -p ~/edge  # or your preferred directory
cd ~/edge
```

### 2. Configure Environment

```bash
# Copy template to .env
cp .env.template .env

# Generate secret key
openssl rand -hex 64

# Edit .env with secure values
nano .env
```

### 3. Set Required Environment Variables

**QA Environment:**
```bash
DATABASE_USER=postgres
DATABASE_PASSWORD=<secure-password>
DATABASE_NAME=players_qa
DATABASE_HOST=db
SECRET_KEY_BASE=<generated-secret>
RAILS_ENV=production
DISABLE_HOST_CHECK=true
DISABLE_FORCE_SSL=true
```

**Production Environment:**
```bash
DATABASE_USER=postgres
DATABASE_PASSWORD=<very-secure-password>
DATABASE_NAME=players_production
DATABASE_HOST=db
SECRET_KEY_BASE=<generated-secret>
RAILS_ENV=production
APP_HOST=yourdomain.com
# Do NOT set DISABLE_HOST_CHECK or DISABLE_FORCE_SSL
```

### 4. Make Deploy Script Executable

```bash
chmod +x deploy.sh
```

### 5. Login to GitHub Container Registry

```bash
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

Verify login succeeded:
```bash
docker login ghcr.io
# Should show: Login Succeeded
```

### 6. Initial Deployment

```bash
# For QA
./deploy.sh qa

# For Production
./deploy.sh prod
```

## Verification Steps

### 1. Check Services Running

```bash
docker-compose -f docker-compose.yml -f docker-compose.qa.yml ps
# or
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

All services should show "Up" and database should be "healthy"

### 2. Test Health Endpoints

```bash
# From server
curl http://localhost:3000/health

# Should return:
# {"status":"ok","service":"players","timestamp":"..."}

# Test database connection
curl http://localhost:3000/health/ready

# Should return:
# {"status":"ready","service":"players","database":"connected","timestamp":"..."}
```

### 3. Check Logs

```bash
# QA
docker-compose -f docker-compose.yml -f docker-compose.qa.yml logs -f

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f
```

Look for:
- ✓ "Listening on http://0.0.0.0:3000"
- ✓ Database connection successful
- ✓ No error messages

## Ongoing Deployments

### Update Application

```bash
# On local machine - build and push new image
docker build -t ghcr.io/jamiepinkham/players:main .
docker push ghcr.io/jamiepinkham/players:main

# On server - deploy update
./deploy.sh qa    # or prod
```

### Update Configuration Only

```bash
# Edit .env file
nano .env

# Restart services
docker-compose -f docker-compose.yml -f docker-compose.qa.yml restart
```

### View Logs

```bash
# Follow logs
./deploy.sh qa    # Automatically shows logs at the end

# Or manually
docker-compose -f docker-compose.yml -f docker-compose.qa.yml logs -f
docker-compose -f docker-compose.yml -f docker-compose.qa.yml logs -f players
```

### Stop Services

```bash
docker-compose -f docker-compose.yml -f docker-compose.qa.yml down
```

### Clean Up (removes volumes/data)

```bash
# WARNING: This deletes the database!
docker-compose -f docker-compose.yml -f docker-compose.qa.yml down -v
```

## Troubleshooting

### Can't Pull Images

**Problem:** `denied: denied` or authentication errors

**Solution:**
```bash
# Re-authenticate with GitHub
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin
```

### Port Already in Use

**Problem:** `port is already allocated`

**Solution:**
```bash
# Find what's using the port
sudo lsof -i :3000

# Stop the conflicting service or change port in docker-compose file
```

### Database Connection Failed

**Problem:** Application can't connect to database

**Solution:**
```bash
# Check database is running
docker-compose -f docker-compose.yml -f docker-compose.qa.yml ps db

# Check database logs
docker-compose -f docker-compose.yml -f docker-compose.qa.yml logs db

# Restart database
docker-compose -f docker-compose.yml -f docker-compose.qa.yml restart db
```

### Out of Disk Space

**Problem:** `no space left on device`

**Solution:**
```bash
# Clean up Docker
docker system prune -a

# Remove old images
docker image prune -a

# Check disk usage
df -h
docker system df
```

## Environment Differences Summary

| Setting | Development | QA | Production |
|---------|-------------|-----|------------|
| Image Source | Built locally | GHCR | GHCR |
| RAILS_ENV | development | production | production |
| Database | players_development | players_qa | players_production |
| SSL Enforced | No | No | Yes |
| Host Check | Disabled | Disabled | Enabled |
| Restart Policy | No | unless-stopped | unless-stopped |
| Port Exposed | 3000:3000 | 3000:3000 | Via reverse proxy |
| Networks | default | default | default + web |

## Security Notes

- Never commit `.env` files with real secrets
- Use strong passwords for database (20+ characters)
- Rotate `SECRET_KEY_BASE` periodically
- Keep GitHub tokens secure and scoped appropriately
- In production, only allow specific hosts via `APP_HOST` or `TRUSTED_HOSTS`
- In production, SSL is enforced (do not set `DISABLE_FORCE_SSL=true`)

## Support

For detailed information, see:
- [README.md](README.md) - General overview
- [DOCKER_SETUP.md](DOCKER_SETUP.md) - Detailed Docker configuration
