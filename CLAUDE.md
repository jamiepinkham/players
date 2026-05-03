# Claude Context - BMPL Players App

## Project Overview

This is a fantasy baseball league management application for the **Billy Martin Players League (BMPL)**. It manages players, teams, contracts, trades, and free agency bidding.

### Core Functionality
- Team roster management with contract system
- Free agency bidding system with automated leading bid conversion
- Trade proposals between teams
- Season management with annual transitions
- Real MLB player stats integration
- Commissioner admin tools

## Tech Stack

### Backend
- **Ruby 3.3.7**, **Rails 8.1.2**
- **PostgreSQL 16** database
- **GraphQL** API (with GraphiQL in dev)
- **Devise + JWT** authentication
- **RailsAdmin** for administration
- **Redis** for caching stats

### Frontend
- **React 18** with **React Router 6**
- **esbuild** for bundling
- **styled-components** for CSS
- **Node 20.x**

### Infrastructure
- **Docker + Docker Compose** for development
- **GitHub Actions** CI/CD → **GHCR** (GitHub Container Registry)
- **Portainer** for production deployment

### Stats System
- **Development**: Mock stats (automatic, no external service needed)
- **Production/Staging**: Real MLB stats via `bmpl-stats` microservice
  - Fetches from MLB Stats API
  - Three-tier caching: Redis → PostgreSQL → MLB API
  - First request triggers async fetch (~5-10s), subsequent requests instant

## Key Domain Models

### Core Models

```ruby
Player
  - MLB players with stats
  - has_one :contract (active contract)
  - has_many :contracts (historical)
  - Fields: name, bbrefid (Baseball Reference ID), positions, is_free_agent
  - Stats fetched on-demand via StatsClient

Team
  - Fantasy league teams
  - has_many :contracts
  - has_many :players (through contracts)
  - has_many :users (owners)
  - has_many :team_emails

Season
  - BMPL seasons (e.g., "BMPL 2026")
  - target_stat_year: MLB season used for eligibility (e.g., 2025 stats)
  - belongs_to :next_season (linked list for progression)
  - has_one :free_agency_period

Contract
  - Player-Team relationship
  - belongs_to :player, :team, :season (start/end)
  - Fields: salary, active, created_at (for trade eligibility)
  - Trade eligibility: must be >3 months old

Bid
  - Free agency bids from teams
  - belongs_to :player, :team, :free_agency_period
  - Fields: salary, years, is_leading, is_active
  - Auto-converts to Contract if leading >24 hours (nightly job)

Trade
  - Trade proposals between teams
  - has_many :contract_trades (join table)
  - Fields: proposing_team, receiving_team, status (pending/accepted/rejected)

FreeAgencyPeriod
  - Bidding windows
  - belongs_to :season
  - Fields: is_active (toggles bidding availability)
```

### Relationships

```
Season
  └── FreeAgencyPeriod
  └── Contracts (start_season, last_season)

Team
  └── Contracts
      └── Player
  └── Users (owners)
  └── Bids
  └── Trades (proposing/receiving)

Player
  └── Contract (active)
  └── Bids
  └── Stats (via StatsClient, cached in Redis)
```

## Project Structure

```
rails/
├── app/
│   ├── models/           # Player, Team, Season, Contract, Trade, Bid, etc.
│   ├── graphql/          # GraphQL schema, types, queries, mutations
│   │   ├── types/        # GraphQL type definitions
│   │   ├── queries/      # Fetch operations
│   │   └── mutations/    # Create/update operations
│   ├── controllers/      # API and admin controllers
│   ├── javascript/       # React frontend (components, pages)
│   ├── mailers/          # Email notifications (bids, trades)
│   └── lib/              # StatsClient, utilities
├── config/
│   ├── initializers/     # App config (requires restart on change)
│   ├── routes.rb         # URL routing
│   └── crontab           # Scheduled tasks (convert_bids)
├── db/
│   ├── migrate/          # Database migrations
│   └── schema.rb         # Current DB structure
├── lib/tasks/            # Rake tasks (season management, stats, etc.)
├── Gemfile               # Ruby dependencies
├── package.json          # JS dependencies
└── Procfile              # Dev processes (Rails + asset watchers)

Root files:
├── docker-compose.yml                  # Local development
├── docker-compose.with-stats.yml       # Optional: real stats API locally
├── docker-compose.portainer.yml        # Production deployment config
├── Dockerfile                          # Multi-stage build
├── web-entrypoint.sh                   # Container startup
├── README.md                           # Full setup docs
└── COMMISSIONER_RUNBOOK.md             # Season management guide
```

## Development Workflow

### Starting the App

```bash
docker compose up              # Start app (auto-uses mock stats)
# Access: http://localhost:3000
# GraphiQL: http://localhost:3000/graphiql
# Admin: http://localhost:3000/admin
```

### When Changes Auto-Reload

**No restart needed:**
- Ruby code (models, controllers, GraphQL, lib)
- JavaScript/CSS (watchers auto-rebuild via Procfile)
- Database migrations (just run `db:migrate`)
- Routes

**Restart required:**
- After `bundle install` (new gems)
- After `yarn add` (new packages)
- Changes to `config/initializers/*`
- Changes to `Procfile`

```bash
docker compose restart players     # Quick restart
docker compose down && docker compose up  # Full restart
```

### Common Commands

```bash
# Rails console
docker compose exec players bundle exec rails console

# Database
docker compose exec players bundle exec rails db:migrate
docker compose exec players bundle exec rails db:rollback

# Tests
docker compose exec players bundle exec rails test

# View logs
docker compose logs -f players

# Exec into container
docker compose exec players bash

# Add Ruby gem
# 1. Edit rails/Gemfile
# 2. docker compose exec players bundle install
# 3. docker compose restart players

# Add JS package
docker compose exec players yarn add <package>
docker compose restart players
```

## Important Files & Patterns

### Stats System

```ruby
# rails/app/lib/stats_client.rb
# Fetches player stats from mock or real API based on environment

# Development (automatic):
STATS_API_MOCK=true  # Returns consistent mock data

# Production:
# Calls bmpl-stats microservice → MLB API
# First call returns {}, triggers async fetch
# Subsequent calls return cached data
```

### Scheduled Jobs

```ruby
# config/crontab
# Runs in production via scheduler sidecar container

# Nightly at midnight ET:
# - Converts leading bids >24hrs to contracts
# - Updates bid statuses
bin/rails convert_bids:convert_leading
```

### Commissioner Tasks

```bash
# Season management (see COMMISSIONER_RUNBOOK.md)
bin/rails season:status              # Current season info
bin/rails season:preview             # Preview season switch
bin/rails season:switch              # Switch to next season

# Free agent management
bin/rails free_agents:recalculate    # Recalc all FA statuses
bin/rails free_agents:stats          # Show counts

# Stats cache
bin/rails cache:warmup_quick         # Top 100 FAs (fast)
bin/rails cache:warmup               # All players (slow)
bin/rails cache:clear                # Clear Redis
```

### Dev Testing Helpers

```bash
# Trade testing (contracts must be >3 months old)
bin/rails dev:age_contracts          # Make contracts trade-eligible
bin/rails dev:reset_passwords        # Set all passwords to 'password'
bin/rails dev:list_users             # Show users and teams
```

## GraphQL API

### Endpoints
- **Production**: `/graphql`
- **Development**: `/graphiql` (browser UI)

### Authentication

```bash
# Sign in
POST /users/sign_in
{
  "user": {
    "email": "user@example.com",
    "password": "password"
  }
}
# Returns JWT in Authorization header

# Use JWT
Authorization: Bearer <token>
```

### Key Queries

```graphql
query {
  fetchCurrentUser { ... }
  fetchSeasons { ... }
  fetchTeams { ... }
  fetchTrades { ... }
}
```

### Key Mutations

```graphql
mutation {
  createBid(input: { ... })
  createTrade(input: { ... })
  acceptTrade(input: { ... })
  rejectTrade(input: { ... })
}
```

## Important Patterns & Gotchas

### Free Agency System

1. **Free Agent Eligibility**:
   - Player must have NO active contract
   - Player must have stats in current season's `target_stat_year`
   - Check via: `bin/rails free_agents:recalculate`

2. **Bidding Flow**:
   - FreeAgencyPeriod must be `is_active: true`
   - Teams place bids via GraphQL mutation
   - Highest bid becomes `is_leading: true`
   - Nightly job converts bids >24 hours old to contracts

### Trade System

1. **Eligibility Rules**:
   - Contracts must be >3 months old (checks `created_at`)
   - Users must be team owner
   - UI disables ineligible players (red "No")

2. **Trade Flow**:
   - Team A proposes trade (selects contracts)
   - Trade status: `pending`
   - Team B accepts/rejects
   - On accept: contracts swap teams, trade status: `accepted`

### Season Management

1. **Annual Workflow** (see COMMISSIONER_RUNBOOK.md):
   ```
   Create Next Season → Import Stats → Switch Season → Activate Free Agency
   ```

2. **Season Switch Effects**:
   - Deactivates expiring contracts
   - Deactivates current FA period
   - Deactivates all bids
   - Marks new season active
   - Creates new FA period (INACTIVE)

3. **Target Stat Year**:
   - BMPL 2026 uses `target_stat_year: 2025` (2025 MLB stats)
   - Used for FA eligibility checks

### Stats Caching

- **Cache key format**: `stats:#{bbrefid}:#{year}`
- **TTL**: 24 hours in Redis
- **Warmup**: Run after container restart or cache clear
- **Production**: Cached in bmpl-stats service (Redis + PostgreSQL)

### Database Backups

```bash
# Create backup
docker compose exec db pg_dump -Fc --no-acl --no-owner \
  -U postgres -d players_development > backup.dump

# Restore (development)
# 1. Place backup at db-restore/db.restore
# 2. docker compose down -v
# 3. docker compose up (auto-restores)

# Production: Manual restore only (see README.md)
```

## Deployment

### CI/CD Pipeline
- **Trigger**: Push to any branch
- **Builds**: Multi-arch Docker image (amd64, arm64)
- **Publishes**: GitHub Container Registry
  - `ghcr.io/jamiepinkham/players:main`
  - `ghcr.io/jamiepinkham/players:branch-name`
  - `ghcr.io/jamiepinkham/players:sha-abc123`

### Production Stack
- **Portainer** deploys via `docker-compose.portainer.yml`
- **Services**:
  - `players` - Rails web app
  - `scheduler` - Cron sidecar (nightly bid conversion)
  - `db` - PostgreSQL
  - `stats-api` - Shared microservice (separate stack)

### Key Environment Variables
```bash
DATABASE_PASSWORD           # PostgreSQL password
SECRET_KEY_BASE            # Rails secret (openssl rand -hex 64)
DEVISE_SECRET_KEY          # Auth secret
DEVISE_JWT_SECRET_KEY      # JWT secret
MAILGUN_SMTP_PASSWORD      # Email delivery
STATS_API_URL              # Stats service URL
STATS_API_MOCK             # true/false (dev only)
```

## RailsAdmin

**URL**: `/admin`
**Auth**: User must have `is_admin: true`

**Common Tasks**:
- Edit player positions, FA status
- View/deactivate contracts
- Activate free agency periods
- Import summer draft picks
- Reset passwords
- Manage users and teams

## Common Issues

### Stats not showing
```bash
# Check if Redis is running
docker compose ps redis

# Warm cache from database
bin/rails cache:warmup_quick

# Clear and rebuild (last resort)
bin/rails cache:clear
bin/rails cache:warmup_quick
```

### Assets not rebuilding
```bash
# Check watchers are running
docker compose logs players | grep "yarn watch"

# Manual rebuild
docker compose exec players yarn build
docker compose exec players yarn build:css
docker compose restart players
```

### Port 3000 in use
```bash
lsof -ti:3000 | xargs kill -9
# Or change port in docker-compose.yml
```

## Testing Guidelines

```bash
# Run all tests
docker compose exec players bundle exec rails test

# Specific test
docker compose exec players bundle exec rails test test/models/player_test.rb

# With verbose output
docker compose exec players bundle exec rails test -v
```

## Git Workflow

```bash
# Main branch: main
# Deployment: Push to main → GitHub Actions → GHCR → Portainer

# Creating commits
git status
git add <files>  # Prefer specific files over git add .
git commit -m "Descriptive message

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Creating PRs
gh pr create --title "Short title" --body "## Summary
- Bullet points

## Test plan
- Testing steps"
```

## Quick Reference

### Model Associations Cheat Sheet
```ruby
# Find active contracts for a team
team.contracts.where(active: true)

# Find team's players
team.players  # via active contracts

# Check if player is under contract
player.contract.present?  # active contract
player.is_free_agent      # boolean flag

# Get current season
Season.current

# Get active free agency period
FreeAgencyPeriod.find_by(is_active: true)

# Leading bids for a player
player.bids.where(is_leading: true, is_active: true)
```

### File Locations Cheat Sheet
- **Models**: `rails/app/models/*.rb`
- **GraphQL Types**: `rails/app/graphql/types/*_type.rb`
- **GraphQL Queries**: `rails/app/graphql/queries/*_query.rb`
- **GraphQL Mutations**: `rails/app/graphql/mutations/*_mutation.rb`
- **React Components**: `rails/app/javascript/components/*.jsx`
- **Rake Tasks**: `rails/lib/tasks/*.rake`
- **Stats Client**: `rails/app/lib/stats_client.rb`
- **Mailers**: `rails/app/mailers/*.rb`
- **Routes**: `rails/config/routes.rb`
- **Schema**: `rails/db/schema.rb`

### URLs
- **Local App**: http://localhost:3000
- **GraphiQL**: http://localhost:3000/graphiql
- **Admin Panel**: http://localhost:3000/admin
- **Health Check**: http://localhost:3000/health

## Additional Documentation

- **Full setup guide**: `README.md`
- **Season management**: `COMMISSIONER_RUNBOOK.md`
- **CI/CD**: `.github/workflows/`
- **Docker configs**: `docker-compose*.yml`
- **Environment template**: `.env.example`
