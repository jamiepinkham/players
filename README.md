# Players

A fantasy sports league management application built with Rails and GraphQL. This application manages players, teams, contracts, trades, and free agency periods for the Billy Martin Players League.

## Tech Stack

- **Backend**: Ruby 3.1.2, Rails 6.1
- **Database**: PostgreSQL 16
- **API**: GraphQL with GraphiQL (development)
- **Authentication**: Devise with JWT tokens
- **Admin**: RailsAdmin
- **Frontend**: React with esbuild
- **Deployment**: Docker + Portainer
- **CI/CD**: GitHub Actions → GitHub Container Registry

## Project Structure

```
.
├── rails/                  # Rails application
│   ├── app/
│   │   ├── models/        # Player, Team, Season, Contract, Trade, Bid, etc.
│   │   ├── graphql/       # GraphQL schema and types
│   │   ├── controllers/   # API and admin controllers
│   │   └── javascript/    # React frontend code
│   ├── config/            # Rails configuration
│   ├── db/                # Database migrations and schema
│   ├── Gemfile            # Ruby dependencies
│   ├── package.json       # JavaScript dependencies
│   └── Procfile           # Process manager (Rails + asset watchers)
├── docker-compose.yml          # Local development setup
├── docker-compose.portainer.yml # Production deployment config
├── Dockerfile             # Multi-stage Docker build
├── web-entrypoint.sh      # Container startup script
├── db-restore/            # Auto-restore database backups
└── .github/workflows/     # CI/CD pipelines
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd players
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables**

   Edit `.env` and update these values:
   ```bash
   # Database
   DATABASE_USER=postgres
   DATABASE_PASSWORD=your_secure_password
   DATABASE_NAME=players_development
   DATABASE_HOST=db

   # Rails
   SECRET_KEY_BASE=$(openssl rand -hex 64)
   RAILS_ENV=development

   # Development flags
   DISABLE_HOST_CHECK=true
   DISABLE_FORCE_SSL=true
   ```

4. **Start the application**
   ```bash
   docker compose up
   ```

   The application will:
   - Install Ruby gems and JavaScript dependencies
   - Build assets initially
   - Start Rails server on port 3000
   - Start asset watchers for auto-rebuild

5. **Access the application**
   - Main app: http://localhost:3000
   - GraphiQL: http://localhost:3000/graphiql (development only)
   - Admin: http://localhost:3000/admin
   - Health check: http://localhost:3000/health

## Development Workflow

### Making Code Changes

The development setup uses volume mounts and asset watchers to provide a seamless development experience:

#### Rails/Ruby Changes (No Restart Needed)

Changes to these files are automatically reflected:
```bash
# Edit any Ruby code
rails/app/models/player.rb
rails/app/controllers/graphql_controller.rb
rails/config/routes.rb
rails/lib/**/*.rb

# Changes are immediately available - just refresh your browser
```

Rails development mode automatically reloads code on each request.

#### JavaScript Changes (Auto-Rebuild)

Changes to JavaScript/CSS are automatically rebuilt by watchers:
```bash
# Edit any JavaScript/CSS
rails/app/javascript/components/Player.jsx
rails/app/assets/stylesheets/application.scss

# The Procfile watchers (yarn watch, yarn watch:css) automatically rebuild
# Just refresh your browser to see changes
```

**How it works:**
- `yarn watch` monitors JS files and rebuilds with esbuild
- `yarn watch:css` monitors CSS/SCSS files and rebuilds
- Both run continuously in the container via Foreman

**Check build output:**
```bash
# View live logs to see rebuild messages
docker compose logs -f players
```

#### Adding Ruby Dependencies

When you need to add or update Ruby gems:

```bash
# 1. Edit rails/Gemfile locally
vim rails/Gemfile

# 2. Install inside container
docker compose exec players bundle install

# 3. Restart the container to load new gems
docker compose restart players
```

**Alternative: Rebuild container**
```bash
# If bundle install fails or you want a clean state
docker compose down
docker compose up --build
```

#### Adding JavaScript Dependencies

When you need to add or update npm packages:

```bash
# 1. Edit rails/package.json locally (or use yarn add)
docker compose exec players yarn add react-router-dom

# 2. Restart to ensure everything loads correctly
docker compose restart players
```

**Note:** The `rails/node_modules` directory exists only inside the container and is not mounted to your local machine.

#### Database Migrations

```bash
# Create a new migration
docker compose exec players bundle exec rails generate migration AddFieldToPlayers

# Run migrations
docker compose exec players bundle exec rails db:migrate

# Rollback
docker compose exec players bundle exec rails db:rollback
```

#### When to Restart the Container

**Restart needed:**
- ✅ After `bundle install` (new Ruby gems)
- ✅ After `yarn add/remove` (new JavaScript packages)
- ✅ Changes to `Gemfile` or `package.json`
- ✅ Changes to `config/initializers/*`
- ✅ Changes to `Procfile`

**No restart needed:**
- ✅ Ruby code changes (models, controllers, views, lib)
- ✅ JavaScript/CSS changes (auto-rebuild via watchers)
- ✅ Database migrations (just run `db:migrate`)
- ✅ Route changes

```bash
# Quick restart (preserves database)
docker compose restart players

# Full restart (if having issues)
docker compose down
docker compose up
```

### Running Tests

```bash
# Run all tests
docker compose exec players bundle exec rails test

# Run specific test file
docker compose exec players bundle exec rails test test/models/player_test.rb

# Run with verbose output
docker compose exec players bundle exec rails test -v
```

### Rails Console

```bash
# Open Rails console
docker compose exec players bundle exec rails console

# Run Rails commands
docker compose exec players bundle exec rails routes
docker compose exec players bundle exec rails db:seed
```

### Viewing Logs

```bash
# Follow all logs
docker compose logs -f

# Only Rails logs
docker compose logs -f players

# Only database logs
docker compose logs -f db
```

## Database Management

### Auto-Restore from Backup

See [db-restore/README.md](db-restore/README.md) for automatic database restoration on first startup.

Quick example:
```bash
# Place backup file
cp your-backup.dump db-restore/db.restore

# Reset and restore
docker compose down -v
docker compose up
```

### Manual Database Operations

```bash
# Access PostgreSQL directly
docker compose exec db psql -U postgres -d players_development

# Create a backup
docker compose exec db pg_dump -Fc --no-acl --no-owner \
  -U postgres -d players_development > backup.dump

# Reset database (WARNING: destroys data)
docker compose down -v
docker compose up
```

## Deployment

### CI/CD Pipeline

On every push to any branch, GitHub Actions:
1. Builds a Docker image for both amd64 and arm64
2. Publishes to GitHub Container Registry (GHCR)
3. Tags with:
   - Branch name: `ghcr.io/jamiepinkham/players:branch-name`
   - Commit SHA: `ghcr.io/jamiepinkham/players:sha-abc123...`
   - `main` tag for main branch: `ghcr.io/jamiepinkham/players:main`

### Portainer Deployment

The application is deployed to production using Portainer with `docker-compose.portainer.yml`.

**Key differences from development:**
- Uses prebuilt image from GHCR (no local code mounts)
- Connects to external `web` network (for reverse proxy)
- Runs with production environment variables
- Includes restart policies
- No asset watchers (assets precompiled in image)

**To deploy/update:**
1. Push to main branch (triggers image build)
2. In Portainer, update the stack with new image
3. Portainer pulls latest `:main` tag and restarts

### Environment Variables for Production

Configure these in Portainer's environment section:

```bash
# Database
DATABASE_USER=postgres
DATABASE_PASSWORD=<secure-password>
DATABASE_NAME=players_production
DATABASE_HOST=db

# Rails
SECRET_KEY_BASE=<generate-with-rails-secret>
RAILS_ENV=production

# Email (Mailgun)
MAILGUN_SMTP_ADDRESS=smtp.mailgun.org
MAILGUN_SMTP_PORT=587
MAILGUN_SMTP_DOMAIN=billymartinplayersleague.com
MAILGUN_SMTP_USERNAME=postmaster@mg.billymartinplayersleague.com
MAILGUN_SMTP_PASSWORD=<mailgun-password>
MAILER_FROM=no-reply@billymartinplayersleague.com

# Proxy settings
DISABLE_FORCE_SSL=true
RAILS_LOG_TO_STDOUT=true
RAILS_SERVE_STATIC_FILES=true
DISABLE_HOST_CHECK=true

# Optional
APP_HOST=billymartinplayersleague.com
ASSET_HOST=https://billymartinplayersleague.com
```

## API

### GraphQL

The application provides a GraphQL API at `/graphql`.

**Development:** Use GraphiQL at http://localhost:3000/graphiql

**Key Types:**
- `Player` - Player information and statistics
- `Team` - Team management
- `Season` - Season configuration
- `Contract` - Player contracts
- `Trade` - Trade transactions
- `Bid` - Free agency bids
- `FreeAgencyPeriod` - Free agency periods

### Authentication

Uses Devise with JWT tokens:

```bash
# Sign in (returns JWT in Authorization header)
POST /users/sign_in
{
  "user": {
    "email": "user@example.com",
    "password": "password"
  }
}

# Include JWT in subsequent requests
Authorization: Bearer <token>
```

### Health Checks

- `/health` - Basic health check
- `/health/ready` - Readiness probe
- `/health/live` - Liveness probe

## Data Models

Core models in the application:

- **Player** - Individual players with stats and info
- **Team** - Teams that own players
- **Season** - League seasons with configuration
- **Contract** - Player contracts with teams
- **Trade** - Trade transactions between teams
- **Bid** - Free agency bid system
- **FreeAgencyPeriod** - Time periods for free agency
- **User** - Authentication and authorization

## Admin Panel

RailsAdmin is available at `/admin` for administrative tasks:
- Manage players, teams, seasons
- View contracts and trades
- Configure free agency periods
- User management

Access requires admin authentication.

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose logs players

# Rebuild if Dockerfile changed
docker compose down
docker compose build
docker compose up
```

### Database connection issues

```bash
# Check database is healthy
docker compose ps

# View database logs
docker compose logs db

# Ensure DATABASE_HOST=db in .env
```

### Assets not loading or not rebuilding

```bash
# Check if watchers are running
docker compose logs players | grep -i "yarn watch"

# Manually rebuild assets
docker compose exec players yarn build
docker compose exec players yarn build:css

# Restart watchers
docker compose restart players
```

### Changes not appearing

```bash
# For Ruby changes: Rails should auto-reload, check logs for errors
docker compose logs -f players

# For JS/CSS changes: Check if watchers are running
docker compose exec players ps aux | grep yarn

# If still stuck, restart
docker compose restart players
```

### Port 3000 already in use

```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9

# Or change port in docker-compose.yml
ports:
  - "3001:3000"
```

### Permission issues

```bash
# If you get permission errors with files
# The container runs as non-root user 'appuser'
# But volume mounts use your host user permissions

# Fix ownership (run on host)
sudo chown -R $USER:$USER rails/
```

## Contributing

1. Create a feature branch
2. Make your changes (code auto-reloads for development)
3. Test locally with `docker compose up`
4. Push to trigger CI/CD build
5. Create a pull request

The CI/CD pipeline will automatically:
- Build your Docker image
- Publish to GHCR with your branch name
- Comment on the PR with pull instructions

## License

[Add license information]

## Contact

[Add contact information or maintainer details]
