# Image Verification - Quick Start

## Overview

The production Docker image is automatically verified before deployment to ensure it boots correctly and responds to requests.

## Health Check Endpoints

```bash
# Basic health check (no database)
curl http://localhost:3000/health
curl http://localhost:3000/healthz

# Readiness check (with database)
curl http://localhost:3000/health/ready

# Liveness check
curl http://localhost:3000/health/live
```

**Expected Response (200 OK)**:
```json
{"status":"ok","service":"players","timestamp":"2025-12-30T12:00:00Z"}
```

---

## Local Verification

Test the production image locally before pushing:

```bash
./scripts/verify_production_image.sh
```

**What it does**:
- ✅ Builds production Docker image
- ✅ Starts test database
- ✅ Starts application container
- ✅ Tests /health endpoint
- ✅ Tests / root endpoint
- ✅ Reports results

**Expected output**:
```
✅ Build succeeded
✅ Database is ready
✅ Container started
✅ Application is responding
✅ Health check passed
✅ Root endpoint check passed

✅ ALL VERIFICATION CHECKS PASSED
```

---

## CI/CD Verification

**Workflow**: `.github/workflows/verify-production-image.yml`

**Triggers**:
- Pull requests to `main`
- Pushes to `main`

**What it verifies**:
1. Image builds successfully
2. Container starts without errors
3. Application becomes ready within 2 minutes
4. `/health` endpoint returns 200 OK
5. `/` root endpoint returns 200 OK

**On success**: Posts ✅ comment to PR
**On failure**: Posts ❌ comment and fails build

---

## Quick Commands

```bash
# Test locally
./scripts/verify_production_image.sh

# Build production image manually
docker build -f Dockerfile.web.prod -t players-web-prod .

# Run production image manually
docker run -p 3000:3000 \
  -e SECRET_KEY_BASE=your_secret \
  -e DATABASE_HOST=db \
  -e DATABASE_USER=postgres \
  -e DATABASE_PASSWORD=password \
  -e DATABASE_NAME=players_production \
  players-web-prod

# Test health endpoint
curl http://localhost:3000/health

# Check Docker health status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## Troubleshooting

### Health check fails locally
```bash
# Check if container is running
docker ps

# Check logs
docker logs <container-name>

# Check port mapping
docker port <container-name>
```

### CI verification fails
1. Check GitHub Actions logs
2. Run local verification: `./scripts/verify_production_image.sh`
3. Look for errors in container startup
4. Verify environment variables are set

### Health endpoint returns 404
1. Check routes: `docker exec <container> rails routes | grep health`
2. Verify health controller exists
3. Check application logs

---

## Files Reference

| File | Purpose |
|------|---------|
| `rails/app/controllers/health_controller.rb` | Health check controller |
| `rails/config/routes.rb` | Health check routes |
| `.github/workflows/verify-production-image.yml` | CI verification workflow |
| `scripts/verify_production_image.sh` | Local verification script |
| `Dockerfile.web.prod` | Production image with healthcheck |
| `HEALTHCHECK.md` | Complete documentation |

---

## Next Steps

1. **Test locally**: Run `./scripts/verify_production_image.sh`
2. **Create PR**: Push changes and create pull request
3. **Review CI**: Check GitHub Actions for verification results
4. **Deploy**: Merge PR and deploy verified image

---

For complete documentation, see [HEALTHCHECK.md](HEALTHCHECK.md)
