# Portainer Deployment Guide

This guide explains how to deploy the Players app using Portainer.

## Prerequisites

- Portainer installed and running
- Access to Portainer UI
- Docker network named `web` created (or modify docker-compose.prod.yml accordingly)
- GitHub Container Registry image: `ghcr.io/jamiepinkham/players:main`

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

#### Optional Variables

| Variable | Description | Default/Notes |
|----------|-------------|---------------|
| `MAILGUN_SMTP_AUTHENTICATION` | SMTP auth method | `plain` (default) |
| `MAILER_FROM` | Default email sender | `no-reply@billymartinplayersleague.com` |
| `RAILS_LOG_TO_STDOUT` | Enable stdout logging | `true` (recommended for containers) |
| `RAILS_SERVE_STATIC_FILES` | Serve static files from Rails | Leave unset if using nginx/proxy |
| `DISABLE_FORCE_SSL` | Disable SSL forcing | Only set to `true` if SSL is handled by proxy |
| `APP_HOST` | Application hostname | Your domain (e.g., `app.example.com`) |
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

The production compose file expects an external network named `web`. Ensure this network exists:

```bash
docker network create web
```

Or modify `docker-compose.prod.yml` to use your existing network name.

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

### 9. Access the Application

If you're using Traefik or another reverse proxy on the `web` network, configure it to route traffic to the `players` service.

If accessing directly, the app will be available on the port exposed by the `players` service.

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

## Security Notes

1. Use strong, unique passwords for `DATABASE_PASSWORD`
2. Never commit the actual `stack.env` file with real credentials to version control
3. Consider using Portainer secrets for sensitive values
4. Ensure SSL is enabled (set `DISABLE_FORCE_SSL` only if SSL is terminated by your reverse proxy)
5. Keep the `SECRET_KEY_BASE` secure and never change it after deployment (sessions will be invalidated)
