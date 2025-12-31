# Players - Billy Martin Players League

A Rails application for managing the Billy Martin Players League, featuring player statistics, contracts, and league management.

## 📋 Table of Contents

- [Local Development Setup](#-local-development-setup)
- [Quick Start](#-quick-start)
- [Development Commands](#-development-commands)
- [Database Management](#-database-management)
- [Project Structure](#-project-structure)
- [Production Deployment](#-production-deployment)
- [Troubleshooting](#-troubleshooting)

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
├── deploy/                    # Production deployment
│   ├── docker-compose.prod.yml
│   └── README.md
├── scripts/                   # Utility scripts
│   ├── verify_env.sh          # Verify environment setup
│   ├── verify_security.sh     # Security checks
│   └── verify_production_image.sh
├── Dockerfile.web             # Development Rails image
├── Dockerfile.web.prod        # Production Rails image
├── Dockerfile.assets          # Asset compilation image
├── docker-compose.yml         # Development services
├── .env.template              # Environment template
├── .env                       # Your local config (gitignored)
└── README.md                  # This file
```

---

## 🚀 Production Deployment

### Production Setup

See detailed production deployment documentation:
- [deploy/README.md](deploy/README.md) - Complete deployment guide
- [SECURITY.md](SECURITY.md) - Security configuration
- [ENV_VARS.md](ENV_VARS.md) - Environment variables reference

**Quick production deploy:**
```bash
cd deploy
cp .env.example .env
# Edit .env with production values
docker-compose -f docker-compose.prod.yml up -d
```

### Production Features

- ✅ Multi-stage Docker build
- ✅ Asset precompilation
- ✅ HTTPS enforcement (force_ssl)
- ✅ Host authorization (no wildcards)
- ✅ Health check endpoints
- ✅ Automated CI verification
- ✅ Caddy reverse proxy
- ✅ Cloudflare Tunnel support

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

## 📚 Additional Documentation

- **[ENV_VARS.md](ENV_VARS.md)** - Complete environment variables reference
- **[ENV_SETUP.md](ENV_SETUP.md)** - Environment setup quick start
- **[SECURITY.md](SECURITY.md)** - Security configuration and best practices
- **[HEALTHCHECK.md](HEALTHCHECK.md)** - Health check endpoints documentation
- **[deploy/README.md](deploy/README.md)** - Production deployment guide
- **[deploy/ARCHITECTURE.md](deploy/ARCHITECTURE.md)** - System architecture

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

The application uses environment variables for configuration. See `.env.template` for available options.

**Development defaults:**
```bash
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=players_development
DATABASE_HOST=db
SECRET_KEY_BASE=123ChangeMe
RAILS_ENV=development
```

**Required for production:**
- `SECRET_KEY_BASE` - Generate with: `openssl rand -hex 64`
- `DATABASE_PASSWORD` - Secure password
- `APP_HOST` - Your domain name

See [ENV_VARS.md](ENV_VARS.md) for complete documentation.

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

**Need help?**
```bash
./bin/rails --help
docker compose --help
```
