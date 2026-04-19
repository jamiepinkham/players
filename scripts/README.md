# Database Utility Scripts

Helper scripts for working with production databases.

## Scripts

### check-prod-db.sh

Check production database configuration and available databases.

**Usage:**
```bash
# Direct arguments
./scripts/check-prod-db.sh user@hostname [container]

# Using environment variables
export PROD_SERVER=ortiz@fenway
export PROD_CONTAINER=players-db-1
./scripts/check-prod-db.sh
```

**Examples:**
```bash
# Check fenway production database
./scripts/check-prod-db.sh ortiz@fenway players-db-1
```

### sync-prod-db.sh

Sync production database to local Docker environment for testing/development.

**⚠️ Warning:** This will REPLACE your local database with production data!

**Usage:**
```bash
# Direct arguments
./scripts/sync-prod-db.sh user@hostname container [db_name]

# Using environment variables
export PROD_SERVER=ortiz@fenway
export PROD_CONTAINER=players-db-1
export PROD_DB_NAME=players_production
./scripts/sync-prod-db.sh
```

**Examples:**
```bash
# Sync from fenway (will prompt for confirmation)
./scripts/sync-prod-db.sh ortiz@fenway players-db-1

# Sync with custom database name
./scripts/sync-prod-db.sh ortiz@fenway players-db-1 players_production
```

**What it does:**
1. Dumps production database via SSH
2. Saves dump to `db-restore/` directory (gitignored)
3. Stops local Docker containers
4. Removes local database volume
5. Starts fresh database
6. Restores production dump
7. Runs pending migrations
8. Starts all services

**Time estimate:** 2-5 minutes depending on database size

## Environment Variables

For convenience, create a `.env.local` file (gitignored) with your server details:

```bash
# Production database configuration
export PROD_SERVER=ortiz@fenway
export PROD_CONTAINER=players-db-1
export PROD_DB_NAME=players_production
export PROD_DB_USER=postgres
```

Then source it before running scripts:
```bash
source .env.local
./scripts/sync-prod-db.sh
```

## Safety Notes

- Database dumps are saved to `db-restore/` (gitignored)
- sync-prod-db.sh prompts for confirmation before replacing local database
- Original local data is destroyed and cannot be recovered
- Production database is never modified (read-only operation)
- Scripts require SSH access to production server
- Scripts require Docker and docker-compose locally

## Troubleshooting

**SSH connection fails:**
- Verify SSH access: `ssh ortiz@fenway`
- Check SSH keys are set up correctly

**Container not found:**
- Run check-prod-db.sh to see available containers
- Verify container name matches production

**Database restore fails:**
- Check local disk space: `df -h`
- Verify postgres user has permissions
- Check docker-compose logs: `docker-compose logs db`

**Migrations fail:**
- Your local branch may be behind/ahead of production
- Check migration status: `docker-compose exec web rails db:migrate:status`
- May need to rollback migrations before syncing
