# Modernize Docker Development Setup & Add Production Deployment

## Summary

This PR comprehensively updates the Players application with an improved Docker-based local development workflow, production-ready deployment configuration, and extensive documentation. The changes make it significantly easier for new developers to get started while providing a robust path to production deployment.

## Key Changes

### 🚀 Local Development Experience
- **One-command setup**: New `./bin/dev-setup` script handles complete environment setup
- **Simplified helper scripts** (all can be run from any directory):
  - `./bin/console` - Quick Rails console access
  - `./bin/rails` - Rails command wrapper
  - `./bin/test` - Test runner
  - All scripts auto-navigate to project root using `cd "$(dirname "$0")/.."`
- **Improved Docker configuration**:
  - Added health checks for database service
  - Better dependency management between services
  - Optimized Dockerfile builds with multi-stage caching
  - Fixed asset compilation with proper node_modules handling

### 📚 Documentation Overhaul
- **QUICKSTART.md** - Get running in 5 minutes guide
- **README.md** - Completely rewritten with comprehensive troubleshooting
- **ENV_VARS.md** - Complete environment variables reference
- **ENV_SETUP.md** - Quick environment setup guide
- **SECURITY.md** - Security configuration and best practices
- **HEALTHCHECK.md** - Health check endpoints documentation

### 🏗️ Production Deployment
- **Production Dockerfile** (`Dockerfile.web.prod`) with multi-stage builds
- **Complete deployment setup** in `deploy/` directory:
  - Production docker-compose configuration
  - Caddy reverse proxy setup
  - Cloudflare Tunnel support
  - Deployment and verification scripts
  - Architecture documentation
- **Security hardening**:
  - Host authorization configuration
  - HTTPS enforcement
  - Required environment variable validation
  - Health check endpoints

### 🔧 Technical Improvements
- **Asset pipeline**: Fixed asset compilation with proper paths and watch mode
- **Docker optimizations**:
  - Removed unnecessary dependencies
  - Added tini for proper signal handling
  - Non-root user security
  - Smaller image sizes with multi-stage builds
- **Database improvements**:
  - Added `pg_stat_statements` extension for query monitoring
  - Changed `bbref_stats` from json to jsonb for better performance
  - Removed unused indexes on bids table
- **CI/CD**: Added GitHub Actions workflow for production image verification

### 📝 Configuration Management
- `.env.template` updates with clear documentation
- Separate production environment example (`.env.production.example`)
- Environment variable validation on startup
- Scripts for environment verification

## Migration Notes

### For Developers
1. Pull this branch
2. Run `./bin/dev-setup` for first-time setup
3. Use `./bin/dev` to start development server
4. All existing data and workflows remain compatible

### For Production Deployment
1. Review `deploy/README.md` for deployment instructions
2. Copy `deploy/.env.example` to `deploy/.env` and configure
3. Generate secure secrets (instructions in SECURITY.md)
4. Run `./deploy/deploy.sh` to deploy

## Testing Checklist

- [x] Docker images build successfully
- [x] Development environment starts with `./bin/dev`
- [x] Database restores from dump file
- [x] Assets compile correctly
- [x] Health check endpoints respond
- [x] Production image builds and passes verification
- [x] All helper scripts work as expected
- [x] Documentation is accurate and complete

## Breaking Changes

None - this is backward compatible with existing development workflows. Developers can continue using `docker compose up` if preferred.

## Files Changed

### Modified
- `Dockerfile.assets` - Simplified and optimized
- `Dockerfile.web` - Improved multi-stage build
- `assets_entrypoint.sh` - Better asset watching
- `docker-compose.yml` - Added health checks and dependencies
- `bin/dev` - Updated compose command
- `bin/setup` - Simplified (legacy)
- `rails/db/schema.rb` - Database optimizations
- `.env.template`, `.gitignore`, `README.md` - Documentation updates
- `rails/config/environments/production.rb` - Security hardening
- `rails/config/routes.rb` - Health check routes

### Added
- `bin/dev-setup` - All-in-one setup script
- `bin/console`, `bin/rails`, `bin/test` - Helper scripts
- `deploy/` - Complete production deployment setup
- `scripts/` - Verification and utility scripts
- `Dockerfile.web.prod` - Production-optimized build
- Documentation files (QUICKSTART.md, ENV_VARS.md, SECURITY.md, etc.)
- `rails/app/controllers/health_controller.rb` - Health checks
- `rails/config/initializers/` - Security and validation
- `.github/workflows/verify-production-image.yml` - CI/CD

## Related Issues

Addresses the need for:
- Easier developer onboarding
- Production deployment capability
- Better documentation
- Improved Docker configuration
- Security hardening

---

**Ready for review!** This represents a significant improvement to the development and deployment experience while maintaining full backward compatibility.
