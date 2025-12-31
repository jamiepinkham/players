# Health Check Endpoints

This document describes the health check endpoints available in the Players application.

## Available Endpoints

### `/health` or `/healthz`

**Purpose**: Basic liveness check
**Use Case**: Verify the application process is running
**Database**: Does NOT check database connection
**Authentication**: No authentication required

**Response (200 OK)**:
```json
{
  "status": "ok",
  "service": "players",
  "timestamp": "2025-12-30T12:00:00Z"
}
```

**When to use**:
- Docker/Kubernetes liveness probes
- Load balancer health checks
- CI/CD verification
- Quick process health check

**Example**:
```bash
curl http://localhost:3000/health
```

---

### `/health/ready`

**Purpose**: Readiness check including database
**Use Case**: Verify application is ready to serve traffic
**Database**: Checks database connection
**Authentication**: No authentication required

**Response (200 OK)**:
```json
{
  "status": "ready",
  "service": "players",
  "database": "connected",
  "timestamp": "2025-12-30T12:00:00Z"
}
```

**Response (503 Service Unavailable)**:
```json
{
  "status": "not_ready",
  "service": "players",
  "database": "disconnected",
  "error": "connection refused",
  "timestamp": "2025-12-30T12:00:00Z"
}
```

**When to use**:
- Kubernetes readiness probes
- Pre-deployment verification
- Database connectivity check
- Before running migrations

**Example**:
```bash
curl http://localhost:3000/health/ready
```

---

### `/health/live`

**Purpose**: Liveness check (alias for basic health)
**Use Case**: Verify the application process is alive
**Database**: Does NOT check database connection
**Authentication**: No authentication required

**Response (200 OK)**:
```json
{
  "status": "alive",
  "service": "players",
  "timestamp": "2025-12-30T12:00:00Z"
}
```

**When to use**:
- Kubernetes liveness probes
- Process monitoring
- Auto-restart triggers

**Example**:
```bash
curl http://localhost:3000/health/live
```

---

## CI/CD Integration

### GitHub Actions

The application includes a GitHub Actions workflow that verifies the production image before deployment:

**Workflow**: `.github/workflows/verify-production-image.yml`

**Verification Steps**:
1. ✅ Build production Docker image
2. ✅ Start test database
3. ✅ Start application container
4. ✅ Wait for application to be ready
5. ✅ Test `/health` endpoint returns 200
6. ✅ Test `/` root endpoint returns 200
7. ❌ Fail build if any check fails

**Runs on**:
- Pull requests to `main`
- Pushes to `main`

---

## Local Verification

Test the production image locally before pushing:

```bash
./scripts/verify_production_image.sh
```

This script:
- Builds the production image
- Starts test database and application
- Waits for application to be ready
- Tests health endpoints
- Reports success/failure
- Cleans up containers

**Expected output**:
```
=============================================
Production Image Verification
=============================================

Step 1: Building production image...
✅ Build succeeded

Step 2: Starting test database...
✅ Database is ready

Step 3: Starting application container...
✅ Container started

Step 4: Waiting for application to be ready...
✅ Application is responding

Step 5: Testing health endpoint...
HTTP Status: 200
✅ Health check passed

Step 6: Testing root endpoint...
HTTP Status: 200
✅ Root endpoint check passed

=============================================
✅ ALL VERIFICATION CHECKS PASSED
=============================================
```

---

## Docker/Kubernetes Configuration

### Docker Healthcheck

Add to your Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

### Docker Compose

```yaml
services:
  web:
    image: players-web-prod
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 60s
```

### Kubernetes Probes

```yaml
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: web
    image: players-web-prod
    livenessProbe:
      httpGet:
        path: /health/live
        port: 3000
      initialDelaySeconds: 60
      periodSeconds: 10
      timeoutSeconds: 3
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /health/ready
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 3
```

---

## Troubleshooting

### Health check returns 404

**Cause**: Health routes not loaded or application not started

**Fix**:
1. Verify routes are configured: `docker exec <container> bundle exec rails routes | grep health`
2. Check application logs: `docker logs <container>`
3. Ensure application started successfully

### Health check times out

**Cause**: Application not running or not listening on expected port

**Fix**:
1. Check container is running: `docker ps`
2. Check port mapping: `docker port <container>`
3. Check application logs: `docker logs <container>`
4. Verify environment variables are set

### `/health/ready` returns 503

**Cause**: Database connection failed

**Fix**:
1. Verify database is running: `docker ps | grep postgres`
2. Check DATABASE_HOST environment variable
3. Test database connection: `docker exec <container> psql -h $DATABASE_HOST -U $DATABASE_USER`
4. Check database logs: `docker logs <db-container>`

### CI verification fails

**Cause**: Multiple possible issues

**Fix**:
1. Check GitHub Actions logs for specific failure
2. Run local verification: `./scripts/verify_production_image.sh`
3. Check Dockerfile.web.prod for errors
4. Verify all required environment variables are set

---

## Monitoring

Recommended monitoring setup:

1. **Uptime Monitoring**
   - Monitor `/health` every 30 seconds
   - Alert on 3 consecutive failures
   - Track uptime percentage

2. **Database Monitoring**
   - Monitor `/health/ready` every 60 seconds
   - Alert on database disconnection
   - Track database connection time

3. **Response Time**
   - Track health endpoint response time
   - Alert on response time > 1 second
   - Track p50, p95, p99 percentiles

4. **Application Metrics**
   - Use health check responses to verify deployment success
   - Correlate health checks with application errors
   - Track application restart events

---

## Security Considerations

1. **No Authentication**: Health endpoints do not require authentication
   - Safe to expose to load balancers
   - Safe to call from monitoring tools
   - Should NOT expose sensitive information

2. **Rate Limiting**: Consider rate limiting health endpoints
   - Prevent abuse from external monitoring
   - Allow higher limits for internal health checks

3. **Information Disclosure**: Health endpoints only expose minimal information
   - Service name
   - Status
   - Timestamp
   - No version numbers, IPs, or sensitive data

---

## References

- [Kubernetes Liveness, Readiness, and Startup Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Docker HEALTHCHECK](https://docs.docker.com/engine/reference/builder/#healthcheck)
- [12 Factor App - Disposability](https://12factor.net/disposability)
