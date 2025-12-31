# Players - Quick Start Guide

**Get up and running in 5 minutes!**

---

## 1️⃣ Prerequisites

- ✅ [Docker Desktop](https://www.docker.com/products/docker-desktop) installed and running
- ✅ 5GB free disk space
- ❌ No Ruby or Node.js needed

---

## 2️⃣ Clone & Setup

```bash
# Clone repository
git clone <repository-url>
cd players

# Run complete setup (one command!)
./bin/dev-setup
```

**This will:**
- Check Docker
- Create `.env` file
- Build images
- Start database
- Restore from `docker/db/restore/latest.restore`
- Install all dependencies

**Expected time:** 5-10 minutes (first time only)

---

## 3️⃣ Start Development

```bash
./bin/dev
```

**Access application:**
- 🌐 Web: http://localhost:3000
- 🔧 Admin: http://localhost:3000/admin

**Stop server:** Press `Ctrl+C`

---

## 🛠️ Essential Commands

```bash
# Rails console
./bin/console

# Database commands
./bin/rails db:migrate
./bin/restore              # Reset database

# Run tests
./bin/test

# View logs
docker compose logs -f

# Stop everything
docker compose down
```

---

## 🗄️ Database

### Restore from Dump

Place `.restore` file in `docker/db/restore/latest.restore`, then:

```bash
./bin/restore
```

### Manual PostgreSQL Access

```bash
docker compose exec db psql -U postgres -d players_development
```

---

## 🐛 Common Issues

### Docker not running
```bash
# Start Docker Desktop, then retry
./bin/dev-setup
```

### Port 3000 in use
```bash
# Stop whatever is using port 3000
lsof -i :3000
# Or stop all containers
docker compose down
```

### Database issues
```bash
# Reset database completely
docker compose down -v
./bin/restore
```

### Reset everything
```bash
docker compose down -v
docker compose rm -f
./bin/dev-setup
```

---

## 📁 Project Structure

```
players/
├── bin/dev-setup       ← Run this first
├── bin/dev             ← Start development
├── rails/              ← Rails application
├── docker/db/restore/  ← Place SQL dumps here
└── .env                ← Local configuration
```

---

## 📚 Full Documentation

- **[README.md](README.md)** - Complete guide
- **[ENV_VARS.md](ENV_VARS.md)** - Environment variables
- **[SECURITY.md](SECURITY.md)** - Security configuration
- **[deploy/README.md](deploy/README.md)** - Production deployment

---

## 🚀 Next Steps

1. ✅ Run `./bin/dev-setup`
2. ✅ Run `./bin/dev`
3. ✅ Open http://localhost:3000
4. ✅ Start coding!

---

**Need help?** See [README.md](README.md) for troubleshooting and detailed docs.
