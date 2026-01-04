# Players - Billy Martin Players League

A Rails application for managing the Billy Martin Players League, featuring player statistics, contracts, and league management.

## 📋 Table of Contents

- [Local Development Setup](#-local-development-setup)
- [Quick Start](#-quick-start)
- [Development Commands](#-development-commands)
- [Database Management](#-database-management)
- [Project Structure](#-project-structure)
- [Production Deployment](#-production-deployment)
- [Environment Variables](#-environment-variables)
- [Troubleshooting](#-troubleshooting)
- [Quick Reference](#-quick-reference)

---

## 🚀 Local Development Setup

### Prerequisites

- **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop)
  - macOS: Docker Desktop for Mac
  - Windows: Docker Desktop for Windows (with WSL2)
  - Linux: Docker Engine + Docker Compose
- **No Ruby or Node.js required** - Everything runs in Docker containers

### System Requirements

- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 5GB free space
- **OS**: macOS 10.15+, Windows 10+, or Linux

---

## ⚡ Quick Start

### First Time Setup (Complete)

Run the all-in-one setup script:

```bash
./bin/dev-setup
```

**This script will:**
1. ✅ Check Docker is installed and running
2. ✅ Create `.env` file from template
3. ✅ Build Docker images
4. ✅ Start PostgreSQL database
5. ✅ Restore database from `docker/db/restore/latest.restore`
6. ✅ Install Ruby gems and JavaScript packages

**Expected output:**
```
=============================================
   Players Local Development Setup
=============================================

[1/6] Checking Docker...
✓ Docker is installed and running

[2/6] Setting up environment variables...
✓ Created .env file

[3/6] Building Docker images...
✓ Docker images built successfully

[4/6] Starting PostgreSQL database...
✓ Database is ready

[5/6] Setting up database...
✓ Database restored from dump

[6/6] Installing dependencies...
✓ Ruby gems installed
✓ JavaScript packages installed

=============================================
   ✓ Development Environment Ready!
=============================================

To start the application:
  ./bin/dev

The application will be available at:
  http://localhost:3000
```

### Start Development Server

```bash
./bin/dev
```

The application will start on **http://localhost:3000**

Press `Ctrl+C` to stop the server.

---

## 🛠️ Development Commands

### Common Commands

```bash
# Start development server
./bin/dev

# Open Rails console
./bin/console

# Run Rails commands
./bin/rails db:migrate
./bin/rails routes
./bin/rails db:seed

# Run tests
./bin/test
./bin/test test/models/user_test.rb

# Reset database
./bin/restore

# Stop all services
docker compose down
```

### Docker Commands

```bash
# View logs
docker compose logs
docker compose logs players     # Rails app logs
docker compose logs db          # Database logs
docker compose logs -f          # Follow logs

# Restart services
docker compose restart
docker compose restart players  # Restart just Rails

# View running containers
docker compose ps

# Clean everything (including database)
docker compose down -v

# Rebuild images
docker compose build
docker compose build --no-cache  # Force fresh build
```

---

## 🗄️ Database Management

### Restore from Dump File

The project includes a database dump file at `docker/db/restore/latest.restore`.

**Restore database:**
```bash
./bin/restore
```

This will:
1. Wait for PostgreSQL to be ready
2. Create database if it doesn't exist
3. Restore from `latest.restore` file
4. Run migrations

### Fresh Database Setup

If no restore file exists, the setup will:
```bash
./bin/rails db:create db:migrate db:seed
```

### Reset Database

To completely reset the database:
```bash
docker compose down -v  # Delete database volume
./bin/restore          # Restore from dump
```

### Manual Database Access

```bash
# Access PostgreSQL directly
docker compose exec db psql -U postgres -d players_development

# Create a backup
docker compose exec db pg_dump -U postgres players_development > backup.sql

# Import a backup
cat backup.sql | docker compose exec -T db psql -U postgres -d players_development
```

### Add New Restore File

1. Place your `.restore` file in `docker/db/restore/`
2. Rename it to `latest.restore` (or update `bin/restore` script)
3. Run `./bin/restore`

---

## 📁 Project Structure

```
players/
├── bin/                        # Development helper scripts
│   ├── dev-setup              # Complete setup script
│   ├── dev                    # Start development server
│   ├── setup                  # Legacy setup script
│   ├── restore                # Database restore script
│   ├── rails                  # Rails command wrapper
│   ├── console                # Quick console access
│   └── test                   # Run tests
├── rails/                     # Rails application
│   ├── app/                   # Application code
│   ├── config/                # Configuration
│   ├── db/                    # Database migrations
│   ├── test/                  # Test suite
│   └── ...
├── docker/                    # Docker-related files
│   ├── db/restore/            # Database dump files
│   │   └── latest.restore     # Latest database backup
│   └── postgres/              # PostgreSQL initialization
├── .github/workflows/         # CI/CD workflows
│   ├── pr-docker-build.yml    # PR build verification
│   ├── ghcr-publish.yml       # GHCR image publishing
│   └── verify-production-image.yml
├── scripts/                   # Utility scripts
├── Dockerfile                 # Multi-stage Docker image (assets + web)
├── docker-compose.yml         # Base configuration (all environments)
├── docker-compose.override.yml # Dev overrides (auto-loaded)
├── docker-compose.dev.yml     # Dev overrides (explicit)
├── docker-compose.qa.yml      # QA environment overrides
├── docker-compose.prod.yml    # Production environment overrides
├── deploy.sh                  # Deployment script for all environments
├── assets_entrypoint.sh       # Assets container entrypoint
├── web-entrypoint.sh          # Web container entrypoint
├── .env.example               # Environment template (development)
├── .env.qa                    # Environment template (QA)
├── .env.prod                  # Environment template (production)
├── .env                       # Your local config (gitignored)
├── DOCKER_SETUP.md            # Detailed Docker deployment guide
├── DEPLOYMENT_CHECKLIST.md    # Quick deployment reference
└── README.md                  # This file
```

---

## 🚀 Production Deployment

### Multi-Environment Architecture

The project supports three environments with optimized configurations:

- **Development** - Local development with hot-reload and volume mounts
- **QA** - Testing environment with production settings but relaxed security
- **Production** - Production-ready with strict security and reverse proxy support

**Documentation:**
- [DOCKER_SETUP.md](DOCKER_SETUP.md) - Detailed deployment guide
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Quick reference checklist

### Quick Deployment

Use the deployment script for any environment:

```bash
# Deploy to QA
./deploy.sh qa

# Deploy to Production (with confirmation)
./deploy.sh prod
```

### Files Required on Host Machine

Each deployment server needs only these files:

#### QA Server Files
```
/opt/players/              # or your deployment directory
├── docker-compose.yml     # Base configuration
├── docker-compose.qa.yml  # QA overrides
├── deploy.sh              # Deployment script
└── .env                   # QA environment variables (from .env.qa template)
```

#### Production Server Files
```
/opt/players/              # or your deployment directory
├── docker-compose.yml     # Base configuration
├── docker-compose.prod.yml # Production overrides
├── deploy.sh              # Deployment script
└── .env                   # Production environment variables (from .env.prod template)
```

**Note:** No source code, Dockerfile, or build dependencies needed on servers - they pull pre-built images from GitHub Container Registry.

### Initial Server Setup

**1. Copy files to server:**
```bash
# For QA server
scp docker-compose.yml deploy@qa-server:/opt/players/
scp docker-compose.qa.yml deploy@qa-server:/opt/players/
scp deploy.sh deploy@qa-server:/opt/players/
scp .env.qa deploy@qa-server:/opt/players/.env.template

# For Production server
scp docker-compose.yml deploy@prod-server:/opt/players/
scp docker-compose.prod.yml deploy@prod-server:/opt/players/
scp deploy.sh deploy@prod-server:/opt/players/
scp .env.prod deploy@prod-server:/opt/players/.env.template
```

**2. Configure environment on server:**
```bash
ssh deploy@server
cd /opt/players

# Copy template
cp .env.template .env

# Generate secure secrets
openssl rand -hex 64

# Edit .env with secure values
nano .env
```

Required environment variables:
- `DATABASE_PASSWORD` - Secure database password
- `SECRET_KEY_BASE` - Generated secret (from openssl command)
- `DATABASE_NAME` - `players_qa` or `players_production`
- `RAILS_ENV` - `production` for both QA and prod

**QA-specific settings:**
```bash
DISABLE_HOST_CHECK=true     # Allow any IP/hostname
DISABLE_FORCE_SSL=true      # Allow HTTP (for testing)
```

**Production settings:**
```bash
# Do NOT set DISABLE_HOST_CHECK or DISABLE_FORCE_SSL
# Use APP_HOST or TRUSTED_HOSTS for allowed domains
APP_HOST=yourdomain.com
```

**3. Make deploy script executable:**
```bash
chmod +x deploy.sh
```

**4. Login to GitHub Container Registry:**
```bash
# You need a GitHub Personal Access Token with read:packages scope
echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

**5. Deploy:**
```bash
# QA
./deploy.sh qa

# Production
./deploy.sh prod
```

### Building and Publishing Images

Images are built locally and pushed to GitHub Container Registry:

```bash
# Build image
docker build -t ghcr.io/jamiepinkham/players:main .

# Login to GHCR (needs write:packages scope)
echo "YOUR_TOKEN" | docker login ghcr.io -u jamiepinkham --password-stdin

# Push to registry
docker push ghcr.io/jamiepinkham/players:main
```

After pushing, update servers:
```bash
# On QA server
./deploy.sh qa

# On production server
./deploy.sh prod
```

### CI/CD Pipeline

The project includes GitHub Actions workflows:
- **pr-docker-build.yml** - Validates Docker builds on pull requests
- **ghcr-publish.yml** - Publishes images to GitHub Container Registry
- **verify-production-image.yml** - Verifies production image integrity

### Production Features

- ✅ Multi-stage Docker build (assets + web)
- ✅ Asset precompilation with esbuild and Dart Sass
- ✅ Non-root container users for security
- ✅ Health checks for database and application
- ✅ Environment-specific configurations
- ✅ Automated deployments with validation
- ✅ GitHub Container Registry integration
- ✅ Host authorization and SSL enforcement (production)
- ✅ Reverse proxy support (production)

---

## 🐛 Troubleshooting

### Docker Not Running

**Error:** `Cannot connect to the Docker daemon`

**Fix:**
1. Start Docker Desktop
2. Wait for it to fully start (whale icon in menu bar)
3. Try again

### Port Already in Use

**Error:** `port is already allocated`

**Fix:**
```bash
# Check what's using port 3000
lsof -i :3000

# Stop the conflicting process or use different port
docker compose down
```

### Database Connection Failed

**Error:** `could not connect to server: Connection refused`

**Fix:**
```bash
# Restart database
docker compose restart db

# Check database logs
docker compose logs db

# Verify database is running
docker compose ps db
```

### Assets Not Loading

**Error:** Assets (CSS/JS) not loading or 404 errors

**Fix:**
```bash
# Restart asset compilation
docker compose restart assets

# Check asset logs
docker compose logs assets

# Rebuild assets manually
docker compose run --rm assets yarn build
```

### Permission Errors

**Error:** `Permission denied` errors

**Fix:**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .

# Restart containers
docker compose restart
```

### Out of Disk Space

**Error:** `no space left on device`

**Fix:**
```bash
# Clean up Docker
docker system prune -a --volumes

# Remove old images
docker image prune -a

# Check disk usage
docker system df
```

### Reset Everything

If nothing else works:
```bash
# Stop all containers
docker compose down -v

# Remove all project containers and images
docker compose rm -f
docker rmi $(docker images -q players*)

# Start fresh
./bin/dev-setup
```

### Common Issues

| Issue | Solution |
|-------|----------|
| Slow build times | Use Docker BuildKit: `export DOCKER_BUILDKIT=1` |
| Container won't start | Check logs: `docker compose logs <service>` |
| Database locked | Stop all containers: `docker compose down` |
| Gems not installing | Clear bundle cache: `docker compose run --rm players bundle clean --force` |
| Assets not compiling | Restart assets: `docker compose restart assets` |

---

## 🤝 Contributing

### Pull Request Requirements

- ✅ Docker build must succeed
- ✅ Tests must pass
- ✅ Linear git history (squash or rebase)
- ✅ Conventional commit messages

### Running Tests

```bash
# Run all tests
./bin/test

# Run specific test file
./bin/test test/models/user_test.rb

# Run tests with coverage
docker compose run --rm -e RAILS_ENV=test players bundle exec rails test
```

### Code Quality

```bash
# Check Ruby syntax
docker compose run --rm players bundle exec rubocop

# Check for security issues
docker compose run --rm players bundle exec brakeman
```

---

## 📝 Environment Variables

The application uses environment variables for configuration with templates for each environment:

- `.env.example` - Development template
- `.env.qa` - QA environment template
- `.env.prod` - Production environment template

### Development Environment Variables

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

### QA Environment Variables

```bash
DATABASE_USER=postgres
DATABASE_PASSWORD=<secure-password>
DATABASE_NAME=players_qa
DATABASE_HOST=db
SECRET_KEY_BASE=<generated-secret>
RAILS_ENV=production

# QA-specific settings (allow testing from any IP/host)
DISABLE_HOST_CHECK=true
DISABLE_FORCE_SSL=true
```

### Production Environment Variables

```bash
DATABASE_USER=postgres
DATABASE_PASSWORD=<very-secure-password>
DATABASE_NAME=players_production
DATABASE_HOST=db
SECRET_KEY_BASE=<generated-secret>
RAILS_ENV=production

# Production host authorization
APP_HOST=yourdomain.com
# Or for multiple hosts:
TRUSTED_HOSTS=yourdomain.com,www.yourdomain.com
```

**Generate secure secrets:**
```bash
# Generate SECRET_KEY_BASE
openssl rand -hex 64

# Or use Rails (if available)
rails secret
```

**Important:** Never commit `.env` files with real secrets. Only the templates (`.env.example`, `.env.qa`, `.env.prod`) are committed to git.

---

## 🆘 Getting Help

### Check Status

```bash
# View all services
docker compose ps

# Check if services are healthy
docker compose ps --format "table {{.Name}}\t{{.Status}}"

# View recent logs
docker compose logs --tail=50
```

### Useful Links

- [Docker Documentation](https://docs.docker.com/)
- [Rails Guides](https://guides.rubyonrails.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Project Maintainers

For issues or questions, create an issue in the repository.

---

## 📄 License

[Your License Here]

---

## 🎯 Quick Reference

### Local Development

**Start development:**
```bash
./bin/dev-setup  # First time only
./bin/dev        # Every time
```

**Access application:**
- Web: http://localhost:3000
- Database: localhost:5432 (from host)
- Admin: http://localhost:3000/admin

**Common tasks:**
```bash
./bin/console              # Rails console
./bin/rails db:migrate     # Run migrations
./bin/rails routes         # View routes
./bin/test                 # Run tests
./bin/restore              # Reset database
docker compose down        # Stop everything
```

### Deployment

**Deploy to environments:**
```bash
./deploy.sh dev   # Development
./deploy.sh qa    # QA
./deploy.sh prod  # Production (asks for confirmation)
```

**Build and push images:**
```bash
docker build -t ghcr.io/jamiepinkham/players:main .
docker push ghcr.io/jamiepinkham/players:main
```

**Files needed on servers:**
- QA: `docker-compose.yml`, `docker-compose.qa.yml`, `deploy.sh`, `.env`
- Prod: `docker-compose.yml`, `docker-compose.prod.yml`, `deploy.sh`, `.env`

**Health checks:**
```bash
curl http://localhost:3000/health        # Basic health
curl http://localhost:3000/health/ready  # Database connection
curl http://localhost:3000/health/live   # Process alive
```

**Need help?**
```bash
./bin/rails --help
docker compose --help
./deploy.sh          # Shows usage
```

**Documentation:**
- [DOCKER_SETUP.md](DOCKER_SETUP.md) - Detailed Docker configuration and deployment
- [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - Quick deployment checklist
