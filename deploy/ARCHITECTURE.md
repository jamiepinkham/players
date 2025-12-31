# Production Architecture

## Network Topology

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  Cloudflare     │
                  │  Tunnel         │
                  │  (tunnel)       │
                  └────────┬────────┘
                           │
                           │ frontend network
                           ▼
                  ┌─────────────────┐
                  │  Caddy Proxy    │
                  │  (proxy)        │
                  │  :80, :443      │
                  └────────┬────────┘
                           │
                           │ frontend network
                           ▼
                  ┌─────────────────┐
                  │  Rails App      │
                  │  (web)          │
                  │  :3000          │
                  └────────┬────────┘
                           │
                           │ backend network
                           ▼
                  ┌─────────────────┐
                  │  PostgreSQL     │
                  │  (db)           │
                  │  :5432          │
                  └─────────────────┘
```

## Service Details

### DB Service (PostgreSQL 13)
- **Image**: `postgres:13`
- **Networks**: `backend` only
- **Volumes**: `pgdata_prod` (persistent storage)
- **Healthcheck**: pg_isready every 10s
- **Restart Policy**: unless-stopped
- **Exposed**: No (internal only)

### Web Service (Rails/Puma)
- **Build**: `../Dockerfile.web.prod`
- **Networks**: `backend` + `frontend`
- **Environment**: production
- **Restart Policy**: unless-stopped
- **Exposed**: No (accessed via proxy)
- **Dependencies**: db (healthy)

### Proxy Service (Caddy)
- **Image**: `caddy:2-alpine`
- **Networks**: `frontend` only
- **Ports**: 80, 443 (published to host)
- **Volumes**:
  - `./Caddyfile` (config)
  - `caddy_data` (SSL certs)
  - `caddy_config` (cache)
- **Restart Policy**: unless-stopped
- **Dependencies**: web

### Tunnel Service (Cloudflare)
- **Image**: `cloudflare/cloudflared:latest`
- **Networks**: `frontend` only
- **Restart Policy**: unless-stopped
- **Dependencies**: proxy
- **Authentication**: CLOUDFLARE_TUNNEL_TOKEN

## Network Isolation

### Backend Network
- Purpose: Database ↔ Application communication
- Members: `db`, `web`
- Isolation: Not accessible from internet or proxy

### Frontend Network
- Purpose: Internet ↔ Proxy ↔ Application
- Members: `web`, `proxy`, `tunnel`
- Isolation: Database not accessible

## Security Features

1. **No Direct Database Access**
   - Database only on backend network
   - No ports published to host

2. **No Direct Rails Access**
   - Rails not published to host
   - Only accessible through proxy

3. **HTTPS Everywhere**
   - Caddy handles SSL/TLS termination
   - Automatic certificate management

4. **DDoS Protection**
   - Cloudflare Tunnel provides protection
   - Rate limiting available

5. **Non-Root Containers**
   - Web service runs as appuser
   - Reduced attack surface

## Data Persistence

### PostgreSQL Data
- **Volume**: `pgdata_prod`
- **Location**: Docker managed volume
- **Backup**: Manual pg_dump recommended

### SSL Certificates
- **Volume**: `caddy_data`
- **Managed**: Automatically by Caddy
- **Renewal**: Automatic

## Port Mapping

| Service | Internal Port | Host Port | Public Access |
|---------|---------------|-----------|---------------|
| db      | 5432          | None      | No            |
| web     | 3000          | None      | No            |
| proxy   | 80, 443       | 80, 443   | Yes (via Caddy) |
| tunnel  | None          | None      | Yes (via Cloudflare) |

## Environment Variables

### Required
- `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`
- `SECRET_KEY_BASE` (Rails secret)
- `CLOUDFLARE_TUNNEL_TOKEN`

### Optional
- `DOMAIN` (default: localhost)
- `RAILS_MAX_THREADS` (default: 5)
- `RAILS_LOG_LEVEL` (default: debug)

## Restart Policies

All services use `restart: unless-stopped`:
- Services restart on failure
- Services restart on system reboot
- Services stay stopped if manually stopped

## Health Checks

### Database
- Command: `pg_isready`
- Interval: 10s
- Timeout: 5s
- Start period: 30s

### Web (via Caddy)
- Caddy health checks proxy to `/`
- Interval: 10s
- Timeout: 5s

## Build Process

1. **Build Stage** (Dockerfile.web.prod)
   - Install Node.js 18 + system dependencies
   - Install Ruby gems (production only)
   - Install JavaScript dependencies
   - Precompile assets (esbuild + sass)

2. **Runtime Stage**
   - Minimal runtime dependencies only
   - Copy gems + precompiled assets
   - Run as non-root user
   - Start Puma web server

## Deployment Flow

```
Code Push → Build Image → Start Services → Health Check → Live
            (web)         (all)           (db, web)     (proxy)
```

## Monitoring

### View All Logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### View Service Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Resource Usage
```bash
docker stats
```

## Backup Strategy

### Database Backup
```bash
docker-compose -f docker-compose.prod.yml exec db \
  pg_dump -U postgres players_production > backup.sql
```

### Volume Backup
```bash
docker run --rm -v deploy_pgdata_prod:/data -v $(pwd):/backup \
  alpine tar czf /backup/pgdata-backup.tar.gz /data
```
