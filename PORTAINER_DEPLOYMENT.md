# Portainer Deployment Guide (with Caddy Proxy)

This guide explains how to deploy the Players app using Portainer behind a Caddy reverse proxy.

## Prerequisites

- Portainer installed and running
- Access to Portainer UI
- Caddy reverse proxy installed and running
- Docker network named `web` created (or modify docker-compose.prod.yml accordingly)
- Caddy and your Portainer stack must be on the same `web` network
- GitHub Container Registry image: `ghcr.io/jamiepinkham/players:main`

## Quick Start Checklist

Before deploying, have these ready:

- [ ] Generate `SECRET_KEY_BASE`: Run `openssl rand -hex 64`
- [ ] Set a strong `DATABASE_PASSWORD`
- [ ] Configure Mailgun and get SMTP credentials
- [ ] Set `DISABLE_FORCE_SSL=true` (Caddy handles SSL)
- [ ] Set `RAILS_LOG_TO_STDOUT=true` (for container logs)
- [ ] Create Docker network: `docker network create web`
- [ ] Update your Caddyfile with domain and proxy config
- [ ] Point your domain's DNS to your server

## Deployment Steps

### 1. Create the Stack

1. Log in to Portainer
2. Navigate to **Stacks** > **Add stack**
3. Name your stack (e.g., `players-app`)
4. Choose **Repository** or **Git Repository** option if pulling from GitHub, or **Web editor** to paste the compose file

### 2. Set Docker Compose Configuration

If using Web editor, combine these files:
- `docker-compose.yml` (base configuration)
- `docker-compose.prod.yml` (production overrides)

Or configure to use your repository with the compose files.

### 3. Configure Environment Variables in Portainer UI

In the **Environment variables** section of the stack creation page, add the following variables:

#### Required Variables

| Variable | Description | Example Value |
|----------|-------------|---------------|
| `DATABASE_USER` | PostgreSQL username | `postgres` |
| `DATABASE_PASSWORD` | PostgreSQL password | `YOUR_SECURE_PASSWORD` |
| `DATABASE_NAME` | Database name | `players_production` |
| `DATABASE_HOST` | Database hostname | `db` (use service name from compose) |
| `SECRET_KEY_BASE` | Rails secret key | Generate with `openssl rand -hex 64` |
| `RAILS_ENV` | Rails environment | `production` |
| `MAILGUN_SMTP_ADDRESS` | Mailgun SMTP server | `smtp.mailgun.org` |
| `MAILGUN_SMTP_PORT` | SMTP port | `587` |
| `MAILGUN_SMTP_DOMAIN` | Your email domain | `billymartinplayersleague.com` |
| `MAILGUN_SMTP_USERNAME` | Mailgun username | `postmaster@mg.billymartinplayersleague.com` |
| `MAILGUN_SMTP_PASSWORD` | Mailgun password | Your Mailgun SMTP password |
| `DISABLE_FORCE_SSL` | Disable Rails SSL forcing | `true` (Caddy handles SSL) |
| `RAILS_LOG_TO_STDOUT` | Enable stdout logging | `true` (recommended) |

#### Optional Variables

| Variable | Description | Default/Notes |
|----------|-------------|---------------|
| `MAILGUN_SMTP_AUTHENTICATION` | SMTP auth method | `plain` (default) |
| `MAILER_FROM` | Default email sender | `no-reply@billymartinplayersleague.com` |
| `APP_HOST` | Application hostname | Your domain (e.g., `players.example.com`) |
| `RAILS_SERVE_STATIC_FILES` | Serve static files from Rails | Leave unset (let Caddy serve static files) |
| `ASSET_HOST` | CDN/asset server URL | Leave unset or set to CDN URL |

### 4. Generate SECRET_KEY_BASE

The `SECRET_KEY_BASE` must be a secure random string. Generate it using one of these methods:

```bash
# Using OpenSSL (recommended)
openssl rand -hex 64

# Using Rails (if you have Rails installed locally)
rails secret
```

Copy the output and use it as your `SECRET_KEY_BASE` value.

### 5. Configure Mailgun

1. Sign up for a Mailgun account at https://www.mailgun.com/
2. Add and verify your domain
3. Get your SMTP credentials from the Mailgun dashboard
4. Use these credentials for the `MAILGUN_*` environment variables

### 6. Network Configuration

The production compose file expects an external network named `web` that Caddy also uses. Ensure this network exists:

```bash
docker network create web
```

Both your Caddy container and this Portainer stack need to be on the `web` network so Caddy can proxy requests to the `players` service.

If Caddy is using a different network name, update `docker-compose.prod.yml` accordingly.

### 7. Deploy the Stack

1. Review all environment variables
2. Click **Deploy the stack**
3. Wait for the services to start
4. Check the logs for any errors

### 8. Verify Deployment

1. Go to **Stacks** > **players-app** (or your stack name)
2. Check that all services are running:
   - `players` (Rails app)
   - `assets` (Asset compilation/serving)
   - `db` (PostgreSQL database)
3. View logs for each service to ensure no errors

### 9. Configure Caddy

Add a reverse proxy configuration to your Caddyfile to route traffic to the players app:

```caddyfile
players.yourdomain.com {
    reverse_proxy players:3000
}
```

Or if Caddy is not running in Docker:

```caddyfile
players.yourdomain.com {
    reverse_proxy 172.17.0.1:3000  # Adjust IP based on your Docker bridge
}
```

**Important Notes:**
- Replace `players.yourdomain.com` with your actual domain
- The service name `players` should match the service name in your stack
- If your stack is named `players-app`, the service will be `players-app_players_1` or similar (check container names)
- Caddy will automatically obtain and renew SSL certificates via Let's Encrypt

### 10. Reload Caddy Configuration

After updating your Caddyfile:

```bash
# If Caddy is a Docker container
docker exec -w /etc/caddy caddy_container_name caddy reload

# If Caddy is installed directly
caddy reload
```

## Troubleshooting

### Application Won't Start

Check the logs for the `players` service. Common issues:

1. **Missing environment variables**: The app validates required env vars on startup
2. **Database connection**: Ensure `DATABASE_*` variables are correct
3. **SECRET_KEY_BASE**: Must be properly generated and not contain placeholder text

### Database Issues

- Verify the `db` service is healthy
- Check database credentials match between services
- Ensure the database volume has proper permissions

### Email Not Sending

- Verify all `MAILGUN_*` credentials are correct
- Check Mailgun dashboard for sending limits/blocks
- Review application logs for SMTP errors

### Caddy Cannot Connect to App

- Verify both Caddy and the stack are on the same Docker network (`web`)
- Check the service name matches in Caddyfile (use `docker ps` to verify)
- Ensure port 3000 is exposed in the compose file
- Test connectivity: `docker exec caddy_container ping players`

### SSL Certificate Issues

- Ensure your domain DNS A record points to your server's public IP
- Check Caddy logs: `docker logs caddy_container_name`
- Verify ports 80 and 443 are open and accessible from the internet
- Let's Encrypt requires public domain access for certificate issuance

### 502 Bad Gateway

- App container might not be running - check `docker ps`
- App might be starting up - check logs for database connection issues
- Wrong port in Caddyfile - Rails runs on port 3000 by default
- Network connectivity issue between Caddy and app container

## Updating the Application

To update to a new version:

1. Go to your stack in Portainer
2. Click **Editor**
3. The stack will pull the latest `ghcr.io/jamiepinkham/players:main` image
4. Click **Update the stack**
5. Portainer will pull the new image and restart services

## Data Persistence

The database data is stored in a Docker volume named `{stackname}_pgdata`. This volume persists across stack updates and restarts.

To backup the database, see the backup documentation or use:

```bash
docker exec {stackname}_db_1 pg_dump -U postgres players_production > backup.sql
```

## Caddy Configuration Examples

### Basic Configuration

```caddyfile
players.yourdomain.com {
    reverse_proxy players:3000
}
```

### With Portainer Stack Name

If your stack is named `players-app`, the service name will include the stack prefix:

```caddyfile
players.yourdomain.com {
    # Format: stackname_servicename_instancenumber
    reverse_proxy players-app_players_1:3000
}
```

Or use Docker DNS to target all replicas:

```caddyfile
players.yourdomain.com {
    reverse_proxy players-app_players:3000
}
```

### Advanced Configuration with Headers

```caddyfile
players.yourdomain.com {
    reverse_proxy players:3000 {
        header_up X-Forwarded-Proto {scheme}
        header_up X-Forwarded-For {remote}
        header_up X-Real-IP {remote}
    }

    # Optional: serve static files directly from Caddy for better performance
    # handle_path /assets/* {
    #     root * /path/to/assets
    #     file_server
    # }
}
```

### Multiple Domains

```caddyfile
players.yourdomain.com, www.players.yourdomain.com {
    # Redirect www to non-www
    @www host www.players.yourdomain.com
    handle @www {
        redir https://players.yourdomain.com{uri} permanent
    }

    reverse_proxy players:3000
}
```

## Security Notes

1. Use strong, unique passwords for `DATABASE_PASSWORD`
2. Never commit the actual `stack.env` file with real credentials to version control
3. Consider using Portainer secrets for sensitive values
4. Caddy handles SSL automatically via Let's Encrypt - ensure your domain DNS points to your server
5. Keep the `SECRET_KEY_BASE` secure and never change it after deployment (sessions will be invalidated)
6. Ensure `DISABLE_FORCE_SSL=true` is set since Caddy terminates SSL
