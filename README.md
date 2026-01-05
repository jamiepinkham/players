# Billy Martin Players League

A Rails application for managing the Billy Martin Players League, featuring player statistics, contracts, and league management.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Local Development](#-local-development)
- [Deployment](#-deployment)
- [Helper Scripts](#-helper-scripts)
- [Project Structure](#-project-structure)
- [Environment Configuration](#-environment-configuration)
- [Docker Commands](#-docker-commands)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop)
- **Minimum Requirements**: 4GB RAM, 5GB disk space

### First Time Setup

```bash
# Clone the repository
git clone <repository-url> edge
cd edge

# Run the setup script
./bin/dev-setup
```

The setup script will:
1. ✅ Verify Docker is running
2. ✅ Create `.env` from template
3. ✅ Build Docker images
4. ✅ Start database
5. ✅ Restore database from backup (if available)
6. ✅ Install dependencies

### Start Development

```bash
./bin/dev
```

Application runs at **http://localhost:3000**

---

## 💻 Local Development

### Helper Scripts

All helper scripts are in the `bin/` directory:

#### Core Scripts

**`./bin/dev-setup`** - Complete first-time setup
- Checks Docker installation
- Creates `.env` file
- Builds images
- Starts database
- Restores database
- Installs dependencies

**`./bin/dev`** - Start development server
- Starts all services (web, assets, database)
- Watches for file changes
- Press Ctrl+C to stop

**`./bin/console`** - Open Rails console
- Interactive Ruby console
- Full access to Rails environment and models

**`./bin/rails <command>`** - Run Rails commands
```bash
./bin/rails db:migrate          # Run migrations
./bin/rails routes              # Show routes
./bin/rails db:seed             # Seed database
./bin/rails generate model User # Generate model
```

#### Database Scripts

**`./bin/restore`** - Restore database from backup
- Looks for `docker/db/restore/latest.restore`
- Drops and recreates database
- Restores data from dump file
- Runs migrations

**`./bin/setup`** - Fresh database setup
- Creates database
- Runs migrations
- Seeds database

#### Testing

**`./bin/test`** - Run test suite
```bash
./bin/test                           # All tests
./bin/test test/models/user_test.rb  # Specific file
```

### Common Development Tasks

```bash
# View logs
docker compose logs -f              # All services
docker compose logs -f players      # Just Rails
docker compose logs -f assets       # Just assets

# Restart services
docker compose restart
docker compose restart players      # Just Rails

# Stop everything
docker compose down

# Clean restart (removes volumes/database)
docker compose down -v
./bin/dev-setup

# Rebuild images
docker compose build
docker compose build --no-cache     # Force clean build
```

---

## 🚀 Deployment

### Multi-Environment Setup

The project supports three environments:

- **Development** - Local with hot-reload
- **QA** - Testing with production settings
- **Production** - Full production configuration

### Quick Deploy

Use the deployment script:

```bash
./deploy.sh qa      # Deploy to QA
./deploy.sh prod    # Deploy to production (asks confirmation)
```

### Files Required on Servers

Servers only need these files (no source code):

**QA Server:**
```
<deployment-directory>/
├── docker-compose.yml
├── docker-compose.qa.yml
├── deploy.sh
└── .env
```

**Production Server:**
```
<deployment-directory>/
├── docker-compose.yml
├── docker-compose.prod.yml
├── deploy.sh
└── .env
```

Choose any directory you prefer (e.g., `/opt/edge/`, `/home/deploy/edge/`, `/srv/edge/`)

### Server Setup Steps

**1. Create deployment directory on server:**
```bash
ssh deploy@server
mkdir -p ~/edge  # or any directory you prefer
cd ~/edge
```

**2. Copy files to server:**
```bash
# From your local machine
# Replace ~/edge with your chosen directory

# QA
scp docker-compose.yml deploy@qa-server:~/edge/
scp docker-compose.qa.yml deploy@qa-server:~/edge/
scp deploy.sh deploy@qa-server:~/edge/
scp .env.qa deploy@qa-server:~/edge/.env.template

# Production
scp docker-compose.yml deploy@prod-server:~/edge/
scp docker-compose.prod.yml deploy@prod-server:~/edge/
scp deploy.sh deploy@prod-server:~/edge/
scp .env.prod deploy@prod-server:~/edge/.env.template
```

**3. Configure on server:**
```bash
ssh deploy@server
cd ~/edge  # or your chosen directory

# Create .env from template
cp .env.template .env

# Generate secrets
openssl rand -hex 64

# Edit with secure values
nano .env

# Make deploy script executable
chmod +x deploy.sh
```

**4. Login to GitHub Container Registry:**
```bash
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u USERNAME --password-stdin
```

**5. Deploy:**
```bash
./deploy.sh qa    # or prod
```

### Building and Publishing Images

Build locally and push to GitHub Container Registry:

```bash
# Build
docker build -t ghcr.io/jamiepinkham/players:main .

# Login (requires write:packages scope)
echo "YOUR_TOKEN" | docker login ghcr.io -u jamiepinkham --password-stdin

# Push
docker push ghcr.io/jamiepinkham/players:main

# Update servers (use your actual deployment directory)
ssh deploy@qa-server "cd ~/edge && ./deploy.sh qa"
```

### Health Checks

Verify deployment:

```bash
curl http://localhost:3000/health        # Basic health
curl http://localhost:3000/health/ready  # Database connection
curl http://localhost:3000/health/live   # Process alive
```

---

## 📂 Project Structure

```
edge/
├── bin/                           # Helper scripts
│   ├── console                    # Rails console
│   ├── dev                        # Start development
│   ├── dev-setup                  # First-time setup
│   ├── rails                      # Rails command wrapper
│   ├── restore                    # Restore database
│   ├── setup                      # Fresh database setup
│   └── test                       # Run tests
│
├── rails/                         # Rails application
│   ├── app/                       # Application code
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── views/
│   │   └── ...
│   ├── config/                    # Configuration
│   ├── db/                        # Migrations & schema
│   └── test/                      # Test suite
│
├── docker/                        # Docker configuration
│   ├── db/restore/                # Database backups
│   │   └── latest.restore         # Latest DB dump
│   └── postgres/                  # PostgreSQL init scripts
│
├── .github/workflows/             # CI/CD
│   └── ghcr-publish.yml           # Publish to GHCR
│
├── Dockerfile                     # Multi-stage image (assets + web)
├── docker-compose.yml             # Base configuration
├── docker-compose.override.yml    # Dev overrides (auto-loaded)
├── docker-compose.dev.yml         # Dev overrides (explicit)
├── docker-compose.qa.yml          # QA environment
├── docker-compose.prod.yml        # Production environment
│
├── deploy.sh                      # Deployment script
├── assets_entrypoint.sh           # Assets container entrypoint
├── web-entrypoint.sh              # Web container entrypoint
│
├── .env.example                   # Dev template
├── .env.qa                        # QA template
├── .env.prod                      # Production template
├── .env                           # Active config (gitignored)
│
├── DOCKER_SETUP.md                # Detailed deployment docs
├── DEPLOYMENT_CHECKLIST.md        # Quick deployment guide
└── README.md                      # This file
```

---

## ⚙️ Environment Configuration

### Environment Templates

- `.env.example` - Development defaults
- `.env.qa` - QA configuration template
- `.env.prod` - Production configuration template

### Development Environment

```bash
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=players_development
DATABASE_HOST=db
SECRET_KEY_BASE=123ChangeMe
RAILS_ENV=development

# Development settings
DISABLE_HOST_CHECK=true
DISABLE_FORCE_SSL=true
```

### QA Environment

```bash
DATABASE_USER=postgres
DATABASE_PASSWORD=<secure-password>
DATABASE_NAME=players_qa
DATABASE_HOST=db
SECRET_KEY_BASE=<generated-64-char-hex>
RAILS_ENV=production

# QA testing settings
DISABLE_HOST_CHECK=true      # Accept any IP/hostname
DISABLE_FORCE_SSL=true       # Allow HTTP
```

### Production Environment

```bash
DATABASE_USER=postgres
DATABASE_PASSWORD=<very-secure-password>
DATABASE_NAME=players_production
DATABASE_HOST=db
SECRET_KEY_BASE=<generated-64-char-hex>
RAILS_ENV=production

# Production security
APP_HOST=yourdomain.com
# Or for multiple hosts:
TRUSTED_HOSTS=yourdomain.com,www.yourdomain.com
```

**Generate secrets:**
```bash
openssl rand -hex 64
```

---

## 🐳 Docker Commands

### Service Management

```bash
# Start all services
docker compose up

# Start in background
docker compose up -d

# Stop all services
docker compose down

# Stop and remove volumes (deletes database)
docker compose down -v

# Restart services
docker compose restart
docker compose restart players      # Single service
```

### Logs

```bash
# View logs
docker compose logs

# Follow logs (real-time)
docker compose logs -f

# Specific service
docker compose logs -f players
docker compose logs -f assets
docker compose logs -f db

# Last N lines
docker compose logs --tail=50
```

### Container Status

```bash
# List running containers
docker compose ps

# Detailed status
docker compose ps -a

# Check health
docker compose ps --format "table {{.Name}}\t{{.Status}}"
```

### Cleanup

```bash
# Remove stopped containers
docker compose rm

# Remove all project images
docker rmi $(docker images -q players*)

# Clean up Docker system
docker system prune -a

# Check disk usage
docker system df
```

---

## 🐛 Troubleshooting

### Docker Not Running

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
1. Start Docker Desktop
2. Wait for it to fully start (whale icon)
3. Try again

### Port Already in Use

**Error:** `port is already allocated`

**Solution:**
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process or stop conflicting service
docker compose down
```

### Database Connection Failed

**Error:** `could not connect to server`

**Solution:**
```bash
# Restart database
docker compose restart db

# Check database logs
docker compose logs db

# Verify database is healthy
docker compose ps db

# Complete database reset
docker compose down -v
./bin/restore
```

### Assets Not Loading

**Error:** CSS/JS not loading or 404 errors

**Solution:**
```bash
# Restart asset service
docker compose restart assets

# Check asset logs
docker compose logs assets

# Rebuild assets
docker compose run --rm assets yarn build
```

### Permission Errors

**Error:** `Permission denied`

**Solution:**
```bash
# Fix file ownership
sudo chown -R $USER:$USER .

# Restart containers
docker compose restart
```

### Out of Disk Space

**Error:** `no space left on device`

**Solution:**
```bash
# Clean Docker
docker system prune -a --volumes

# Remove old images
docker image prune -a

# Check usage
docker system df
df -h
```

### 403 Forbidden on Server

**Error:** `HTTP 403 Forbidden` when accessing via IP

**Solution:**

Add your IP to `.env`:
```bash
DISABLE_HOST_CHECK=true      # QA only
# or
TRUSTED_HOSTS=100.127.123.80,yourdomain.com
```

Restart:
```bash
docker compose restart
```

### SSL Redirect on QA

**Error:** HTTP redirects to HTTPS in QA environment

**Solution:**

Add to `.env`:
```bash
DISABLE_FORCE_SSL=true
```

Restart:
```bash
docker compose restart
```

Clear browser cache or use incognito mode.

---

## 📚 Additional Documentation

- **[DOCKER_SETUP.md](DOCKER_SETUP.md)** - Detailed Docker configuration and deployment guide
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Step-by-step deployment checklist

---

## 🎯 Quick Reference

### Local Development

```bash
./bin/dev-setup      # First time setup
./bin/dev            # Start development
./bin/console        # Rails console
./bin/rails <cmd>    # Rails commands
./bin/test           # Run tests
./bin/restore        # Reset database
```

### Deployment

```bash
./deploy.sh qa       # Deploy to QA
./deploy.sh prod     # Deploy to production

# Build and push
docker build -t ghcr.io/jamiepinkham/players:main .
docker push ghcr.io/jamiepinkham/players:main
```

### Health Checks

```bash
curl http://localhost:3000/health
curl http://localhost:3000/health/ready
curl http://localhost:3000/health/live
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Docker not running | Start Docker Desktop |
| Port in use | `lsof -i :3000`, kill process |
| Database error | `docker compose restart db` |
| Assets not loading | `docker compose restart assets` |
| Permission error | `sudo chown -R $USER:$USER .` |
| Out of space | `docker system prune -a` |
| 403 Forbidden | Add `DISABLE_HOST_CHECK=true` |
| SSL redirect | Add `DISABLE_FORCE_SSL=true` |

---

## 🤝 Contributing

### CI/CD Pipeline

The project uses GitHub Actions:
- **ghcr-publish.yml** - Publishes Docker images to GitHub Container Registry

### Running Tests

```bash
./bin/test                           # All tests
./bin/test test/models/user_test.rb  # Specific file
```

### Pull Request Guidelines

- ✅ Ensure tests pass
- ✅ Follow existing code style
- ✅ Update documentation if needed
- ✅ Use clear commit messages

---

## 📄 License

[Your License Here]
