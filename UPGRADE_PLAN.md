# Dependency Upgrade Plan

This document outlines a comprehensive plan to upgrade the Players application from its current state to modern versions of Ruby, Rails, Node, and React.

## Current State

**Backend:**
- Ruby 3.1.2 (Dec 2021)
- Rails 6.1.7 (Dec 2020)
- PostgreSQL 16 ✅ (current)

**Frontend:**
- Node 18
- React 17.0.1 (Oct 2020)
- react-router-dom v5

## Target State

**Backend:**
- Ruby 3.3.7 (latest stable 3.3.x)
- Rails 7.2.x (latest stable)
- PostgreSQL 16 (no change needed)

**Frontend:**
- Node 20 LTS (or 22 if preferred)
- React 18.3.x (latest)
- react-router-dom v6.x (latest)

---

## Pre-Upgrade Checklist

Before starting any upgrades:

- [ ] **Create a backup branch**
  ```bash
  git checkout -b pre-upgrade-backup
  git push origin pre-upgrade-backup
  git checkout main
  ```

- [ ] **Backup production database**
  ```bash
  # In production
  docker compose exec db pg_dump -Fc --no-acl --no-owner \
    -U postgres -d players_development > backup_pre_upgrade.dump
  ```

- [ ] **Document current test results**
  ```bash
  docker compose exec players bundle exec rails test > test_results_before.txt
  ```

- [ ] **Verify application works locally**
  - [ ] Can log in
  - [ ] Can view teams
  - [ ] Can view players
  - [ ] Can create/view trades
  - [ ] Can access admin panel
  - [ ] GraphQL endpoint works

- [ ] **Create upgrade working branch**
  ```bash
  git checkout -b upgrade/dependencies
  ```

---

## Phase 1: Ruby & Gem Updates (excluding Rails)

**Estimated Time:** 4-6 hours
**Risk Level:** Low to Medium

### Step 1.1: Update Ruby Version

1. **Update Dockerfile**

   Edit `/Dockerfile`:
   ```dockerfile
   # Change line 2 from:
   FROM ruby:3.1.2 AS web
   # To:
   FROM ruby:3.3.7 AS web
   ```

2. **Update Gemfile**

   Edit `rails/Gemfile`:
   ```ruby
   # Change line 2 from:
   ruby "3.1.2"
   # To:
   ruby "3.3.7"
   ```

3. **Update .ruby-version** (if exists)
   ```bash
   echo "3.3.7" > rails/.ruby-version
   ```

4. **Rebuild and test**
   ```bash
   docker compose down
   docker compose build
   docker compose up
   ```

5. **Verify it starts successfully**
   - Check logs for errors
   - Access http://localhost:3000
   - Log in and test basic functionality

### Step 1.2: Update Security-Critical Gems

Update `rails/Gemfile` with specific version constraints:

```ruby
# Security updates
gem 'nokogiri', '~> 1.19'
gem 'devise', '~> 4.9'
gem 'devise-jwt', '~> 0.13'

# Other important updates
gem 'graphql', '~> 2.5'
gem 'puma', '~> 6.0'  # Note: Puma 7 is available but 6 is stable
gem 'pg', '~> 1.6'
gem 'httparty', '~> 0.24'
gem 'autoprefixer-rails', '~> 10.4'
gem 'rack-cors', '~> 2.0'  # Major version 3 may have breaking changes
gem 'rack-timeout', '~> 0.7'
gem 'dotenv-rails', '~> 3.2', groups: [:development, :test]
gem 'factory_bot_rails', '~> 6.5', group: :test
gem 'faker', '~> 3.5', group: :test
gem 'graphiql-rails', '~> 1.10', group: :development
gem 'byebug', '~> 13.0', groups: [:development, :test]
gem 'web-console', '~> 4.2', group: :development
```

**Note:** Keep `dry-configurable` and `dry-container` pinned for now - they have major version changes that need testing.

### Step 1.3: Bundle Update

```bash
# Inside container
docker compose exec players bundle update --conservative

# If that has conflicts, try:
docker compose exec players bundle update

# Restart to load new gems
docker compose restart players
```

### Step 1.4: Test Phase 1

Run full test suite:
```bash
docker compose exec players bundle exec rails test
```

**Manual Testing Checklist:**
- [ ] User authentication (sign in/out)
- [ ] GraphQL queries work
- [ ] Admin panel accessible
- [ ] Teams page loads
- [ ] Player data displays
- [ ] Trade functionality
- [ ] Free agency bidding

**If tests pass, commit:**
```bash
git add Dockerfile rails/Gemfile rails/Gemfile.lock
git commit -m "Phase 1: Update Ruby to 3.3.7 and security-critical gems"
```

---

## Phase 2: Rails 6.1 → 7.0

**Estimated Time:** 6-10 hours
**Risk Level:** Medium

### Step 2.1: Prepare for Rails 7.0

1. **Check deprecation warnings**
   ```bash
   docker compose exec players bundle exec rails app:update:upgrade_guide_info
   ```

2. **Update Gemfile**

   Edit `rails/Gemfile`:
   ```ruby
   # Change from:
   gem 'rails', '~> 6.1'
   # To:
   gem 'rails', '~> 7.0.0'

   # Remove rails_12factor (built into Rails 7)
   # gem 'rails_12factor', group: :production  # DELETE THIS LINE
   ```

3. **Bundle update**
   ```bash
   docker compose exec players bundle update rails
   docker compose restart players
   ```

### Step 2.2: Run Rails Update Generator

```bash
docker compose exec players bundle exec rails app:update
```

This will prompt you to overwrite config files. **Recommendations:**

- **config/boot.rb** - Yes (overwrite)
- **config/application.rb** - Diff (d) and merge manually
- **config/environment.rb** - Yes (overwrite)
- **config/environments/development.rb** - Diff (d) and review
- **config/environments/production.rb** - Diff (d) and review carefully
- **config/environments/test.rb** - Diff (d) and review
- **config/initializers/*** - Review each, generally safe to overwrite
- **config/locales/en.yml** - Keep your version (n)

**Key config changes to make manually in `config/application.rb`:**

```ruby
# Add this inside the Application class
config.load_defaults 7.0

# Optionally, to ease transition:
config.active_support.cache_format_version = 7.0
```

### Step 2.3: Update Production Config

Edit `rails/config/environments/production.rb`:

**Remove** (no longer needed in Rails 7):
```ruby
# DELETE these lines if they exist:
config.public_file_server.enabled = ENV['RAILS_SERVE_STATIC_FILES'].present?
```

Rails 7 handles this automatically.

### Step 2.4: Update RailsAdmin

Edit `rails/config/initializers/rails_admin.rb`:

```ruby
# Change line 10 from:
config.asset_source = :sprockets
# To:
config.asset_source = :importmap  # or remove this line entirely

# If removal causes issues, try:
# config.asset_source = :webpacker
```

### Step 2.5: Check for Common Issues

**ActiveStorage:** If you use ActiveStorage (you might not), check for variant API changes.

**Autoloading:** Zeitwerk is now mandatory. Ensure:
```ruby
# In config/application.rb
config.autoloader = :zeitwerk  # This should be default
```

**CORS:** Check `config/initializers/cors.rb` if it exists.

### Step 2.6: Test Rails 7.0

```bash
# Run tests
docker compose exec players bundle exec rails test

# Check for deprecation warnings
docker compose logs players | grep -i deprecat
```

**Manual Testing Checklist:**
- [ ] Sign in/out still works
- [ ] GraphQL endpoint responds
- [ ] Admin panel loads and works
- [ ] All main pages load
- [ ] Database queries work
- [ ] Mailers work (if used)
- [ ] Background jobs work (if used)

**If tests pass, commit:**
```bash
git add .
git commit -m "Phase 2: Upgrade Rails 6.1 → 7.0"
```

---

## Phase 3: Rails 7.0 → 7.2

**Estimated Time:** 2-4 hours
**Risk Level:** Low

Rails 7.0 → 7.2 is much smoother than 6.1 → 7.0.

### Step 3.1: Update Rails Version

Edit `rails/Gemfile`:
```ruby
# Change from:
gem 'rails', '~> 7.0.0'
# To:
gem 'rails', '~> 7.2'
```

### Step 3.2: Bundle Update

```bash
docker compose exec players bundle update rails
docker compose restart players
```

### Step 3.3: Update Load Defaults

Edit `rails/config/application.rb`:
```ruby
# Change from:
config.load_defaults 7.0
# To:
config.load_defaults 7.2
```

### Step 3.4: Run Update Generator

```bash
docker compose exec players bundle exec rails app:update
```

Review and merge any config changes carefully.

### Step 3.5: Test Rails 7.2

```bash
docker compose exec players bundle exec rails test
```

Run same manual testing checklist as Phase 2.

**If tests pass, commit:**
```bash
git add .
git commit -m "Phase 3: Upgrade Rails 7.0 → 7.2"
```

---

## Phase 4: Node & Frontend Dependency Updates

**Estimated Time:** 4-6 hours
**Risk Level:** Medium

### Step 4.1: Update Node Version

1. **Update Dockerfile**

   Edit `/Dockerfile`:
   ```dockerfile
   # Change line ~17 from:
   RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
   # To:
   RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
   ```

2. **Update package.json engines**

   Edit `rails/package.json`:
   ```json
   "engines": {
     "node": ">=20"
   }
   ```

### Step 4.2: Update Build Tools

Edit `rails/package.json` devDependencies:
```json
"devDependencies": {
  "esbuild": "^0.24.0",
  "install-peers": "^1.0.4"
}
```

### Step 4.3: Update Babel Dependencies

```json
"dependencies": {
  "@babel/core": "^7.26.0",
  "@babel/preset-react": "^7.25.9",
  // ... rest unchanged for now
}
```

### Step 4.4: Update Critical Security Packages

```json
"dependencies": {
  // ... keep existing babel ones ...
  "axios": "^1.7.9",  // Critical security fix
  "bootstrap": "^5.3.6",  // Already current ✓
  "sass": "^1.88.0",  // Already current ✓
  // ... continue with rest
}
```

### Step 4.5: Rebuild and Test

```bash
docker compose down
docker compose build
docker compose up
```

**Test:**
- [ ] JavaScript builds without errors
- [ ] CSS builds without errors
- [ ] App loads in browser
- [ ] No console errors

**If successful, commit:**
```bash
git add Dockerfile rails/package.json rails/yarn.lock
git commit -m "Phase 4: Update Node to 20 and build tools"
```

---

## Phase 5: React 17 → 18

**Estimated Time:** 3-5 hours
**Risk Level:** Medium

### Step 5.1: Update React and Related Packages

Edit `rails/package.json`:
```json
"dependencies": {
  // React core
  "react": "^18.3.1",
  "react-dom": "^18.3.1",

  // Update React ecosystem packages
  "react-moment": "^3.1.0",  // Updated for React 18
  "styled-components": "^6.1.14",  // React 18 compatible

  // These should work with React 18 but may need updates:
  "grommet": "^2.40.0",  // Check compatibility
  "grommet-controls": "^4.2.1",  // May need version bump
  "grommet-icons": "^4.13.1",

  // Keep react-router v5 for now (upgrade separately in Phase 6)
  "react-router-dom": "^5.3.4",

  // Rest of packages...
  "@fontsource/fira-sans": "^5.3.0",
  "@popperjs/core": "^2.11.8",
  "@svgr/webpack": "^8.1.0",
  "babel-plugin-transform-react-remove-prop-types": "^0.4.24",
  "graphql-hooks": "^7.2.0",
  "jwt-decode": "^4.0.0",
  "locale-currency": "^0.0.2",
  "moment-timezone": "^0.5.46",
  "normalize.css": "^8.0.1",
  "prop-types": "^15.8.1",
  "rails_admin": "3.3.0",
  "react-currency-format": "^1.1.0",
  "react-currency-input-field": "^3.8.1",
  "react-currency-masked-input": "^2.5.0"
}
```

### Step 5.2: Update to React 18 Root API

Find your main React entry point (likely `rails/app/javascript/application.jsx` or similar).

**Before (React 17):**
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

ReactDOM.render(
  <App />,
  document.getElementById('root')
);
```

**After (React 18):**
```jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);
```

### Step 5.3: Search for Other ReactDOM.render Calls

```bash
docker compose exec players grep -r "ReactDOM.render" app/javascript/
```

Update any found instances to use the new `createRoot` API.

### Step 5.4: Install and Test

```bash
docker compose exec players yarn install
docker compose restart players
```

**Testing:**
- [ ] App builds successfully
- [ ] No console errors in browser
- [ ] No warnings about deprecated APIs
- [ ] All React components render
- [ ] Interactive features work (forms, buttons, etc.)

**Common React 18 Issues:**

1. **Automatic Batching:** State updates are now batched automatically. This is usually beneficial but may change timing.

2. **Strict Mode:** More aggressive in development. May log warnings about deprecated lifecycle methods.

3. **Hydration Errors:** If you do SSR (you probably don't), hydration is stricter.

**If successful, commit:**
```bash
git add rails/package.json rails/yarn.lock rails/app/javascript/
git commit -m "Phase 5: Upgrade React 17 → 18"
```

---

## Phase 6: React Router v5 → v6 (Optional but Recommended)

**Estimated Time:** 4-8 hours
**Risk Level:** Medium-High

This is a significant API change. You can defer this if needed.

### Step 6.1: Audit Current Routes

```bash
docker compose exec players grep -r "Switch\|Route\|useHistory\|useRouteMatch" app/javascript/
```

Document all route definitions and navigation logic.

### Step 6.2: Update Package

```json
"react-router-dom": "^6.28.0"
```

### Step 6.3: Update Route Syntax

**React Router v5:**
```jsx
import { BrowserRouter, Switch, Route } from 'react-router-dom';

<BrowserRouter>
  <Switch>
    <Route exact path="/" component={Home} />
    <Route path="/teams" component={Teams} />
    <Route path="/teams/:id" component={TeamDetail} />
  </Switch>
</BrowserRouter>
```

**React Router v6:**
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/teams" element={<Teams />} />
    <Route path="/teams/:id" element={<TeamDetail />} />
  </Routes>
</BrowserRouter>
```

**Key Changes:**
- `Switch` → `Routes`
- `component={Component}` → `element={<Component />}`
- No more `exact` prop (exact by default)
- Nested routes work differently

### Step 6.4: Update Navigation Hooks

**v5:**
```jsx
import { useHistory } from 'react-router-dom';

const history = useHistory();
history.push('/teams');
```

**v6:**
```jsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/teams');
```

**v5 useRouteMatch → v6 useMatch:**
```jsx
// v5
import { useRouteMatch } from 'react-router-dom';
const match = useRouteMatch('/teams/:id');

// v6
import { useMatch } from 'react-router-dom';
const match = useMatch('/teams/:id');
```

### Step 6.5: Update Link Components

Links mostly work the same, but check for any `component` prop usage.

### Step 6.6: Test Thoroughly

```bash
docker compose restart players
```

**Test every route:**
- [ ] All pages load
- [ ] Navigation between pages works
- [ ] Back button works
- [ ] URL parameters work
- [ ] Nested routes work
- [ ] Redirects work

**If successful, commit:**
```bash
git add rails/package.json rails/yarn.lock rails/app/javascript/
git commit -m "Phase 6: Upgrade React Router v5 → v6"
```

---

## Phase 7: Final Cleanup & Optimization

**Estimated Time:** 2-3 hours

### Step 7.1: Update Remaining Packages

Check for any remaining outdated packages:

```bash
docker compose exec players yarn outdated
```

Update remaining packages that are safe:
```json
"@fontsource/fira-sans": "^5.3.0",
"moment-timezone": "^0.5.46",
"prop-types": "^15.8.1"
```

### Step 7.2: Update Gemfile (Remove Pins)

If `dry-configurable` and `dry-container` work well, consider updating:

```ruby
# Test removing version constraints:
gem 'dry-configurable'  # Remove '0.12.1'
gem 'dry-container'     # Remove '0.7.2'
```

Only if tests pass.

### Step 7.3: Update README

Update `README.md` with new versions:

```markdown
## Tech Stack

- **Backend**: Ruby 3.3.7, Rails 7.2
- **Database**: PostgreSQL 16
- **API**: GraphQL with GraphiQL (development)
- **Authentication**: Devise with JWT tokens
- **Admin**: RailsAdmin
- **Frontend**: React 18 with esbuild
- **Deployment**: Docker + Portainer
- **CI/CD**: GitHub Actions → GitHub Container Registry
```

### Step 7.4: Final Testing

Run comprehensive tests:

```bash
# Backend tests
docker compose exec players bundle exec rails test

# Check for deprecation warnings
docker compose logs players | grep -i deprecat

# Build for production mode
docker compose exec players yarn build
docker compose exec players yarn build:css
```

**Full Manual Test:**
- [ ] Sign in/out
- [ ] All pages load
- [ ] GraphQL queries work
- [ ] Admin panel fully functional
- [ ] Forms submit correctly
- [ ] Data displays correctly
- [ ] Trades work end-to-end
- [ ] Free agency works
- [ ] Email notifications work (if applicable)

### Step 7.5: Update GitHub Actions

Verify the CI/CD pipeline works with new versions:

```yaml
# .github/workflows/ghcr-publish.yml should still work
# But may want to add tests:
- name: Run tests
  run: |
    docker compose exec -T players bundle exec rails test
```

---

## Rollback Procedures

If anything goes wrong in any phase:

### Quick Rollback (Local Development)

```bash
# Discard all changes
git checkout main
git branch -D upgrade/dependencies

# Rebuild from clean state
docker compose down -v
docker compose build
docker compose up
```

### Restore Database

If database migrations caused issues:

```bash
docker compose down -v
cp backup_pre_upgrade.dump db-restore/db.restore
docker compose up
```

### Rollback Specific Phase

```bash
# View commits
git log --oneline

# Reset to before specific phase
git reset --hard <commit-hash-before-phase>

# Rebuild
docker compose down
docker compose build
docker compose up
```

---

## Post-Upgrade Tasks

After successful upgrade:

- [ ] **Merge to main**
  ```bash
  git checkout main
  git merge upgrade/dependencies
  git push origin main
  ```

- [ ] **Update production** via Portainer
  - GitHub Actions will build new image
  - Update stack in Portainer
  - Monitor logs carefully

- [ ] **Monitor production**
  - Check error rates
  - Monitor performance
  - Watch for unusual behavior

- [ ] **Update documentation**
  - Update any internal wikis
  - Update deployment guides
  - Document any new issues found

- [ ] **Clean up branches**
  ```bash
  git branch -D pre-upgrade-backup  # After confirming everything works
  git push origin --delete pre-upgrade-backup
  ```

---

## Common Issues & Solutions

### Issue: Bundle install fails with native extension errors

**Solution:**
```bash
docker compose down
docker compose build --no-cache
docker compose up
```

### Issue: JavaScript won't build after updates

**Solution:**
```bash
# Clear node_modules
docker compose exec players rm -rf node_modules
docker compose exec players yarn install
docker compose restart players
```

### Issue: Database migrations fail

**Solution:**
```bash
# Rollback migration
docker compose exec players bundle exec rails db:rollback

# Fix migration file
# Re-run
docker compose exec players bundle exec rails db:migrate
```

### Issue: Assets not loading after Rails upgrade

**Solution:**
Check `config/environments/production.rb`:
```ruby
# Ensure this is set:
config.public_file_server.enabled = true
# Or handled by reverse proxy
```

### Issue: Devise JWT errors after upgrade

**Solution:**
Check `config/initializers/devise.rb` and verify JWT secret keys are set in environment variables.

### Issue: RailsAdmin styling broken

**Solution:**
Try changing asset source in `config/initializers/rails_admin.rb`:
```ruby
config.asset_source = :importmap
# or
config.asset_source = :webpacker
# or remove the line entirely
```

### Issue: React components not rendering

**Solution:**
1. Check browser console for errors
2. Verify all components updated to React 18 API
3. Check for `ReactDOM.render` → should be `createRoot`
4. Look for deprecated lifecycle methods

### Issue: GraphQL queries failing

**Solution:**
Check GraphQL schema definitions for deprecated syntax. GraphQL 2.x has some API changes from 1.x.

---

## Testing Checklist Template

Use this for each phase:

### Automated Tests
- [ ] `bundle exec rails test` passes
- [ ] No deprecation warnings in logs
- [ ] Build completes without errors

### Authentication
- [ ] Sign in with valid credentials
- [ ] Sign out
- [ ] Sign in with invalid credentials (should fail)
- [ ] JWT token generation works
- [ ] Protected routes require authentication

### Main Features
- [ ] Teams page loads and displays all teams
- [ ] Player list loads and displays correctly
- [ ] Player detail page works
- [ ] Search functionality works
- [ ] Pagination works (if applicable)

### Trades
- [ ] View trade history
- [ ] Create new trade proposal
- [ ] Accept trade
- [ ] Reject trade
- [ ] Trade notifications sent (if applicable)

### Free Agency
- [ ] View free agents
- [ ] Place bid
- [ ] View active bids
- [ ] Bid acceptance works

### Admin Panel
- [ ] Access admin at /admin
- [ ] Can view all models
- [ ] Can edit records
- [ ] Can delete records
- [ ] Custom actions work (import, deactivate)

### GraphQL
- [ ] GraphiQL loads at /graphiql (development)
- [ ] Sample query works
- [ ] Mutations work
- [ ] Authentication required for protected queries

### UI/UX
- [ ] No console errors in browser
- [ ] Styles load correctly
- [ ] Responsive design works
- [ ] Forms validate properly
- [ ] Buttons clickable and functional

---

## Timeline Estimate

**Aggressive (full-time focus):**
- Day 1: Phases 1-2 (Ruby + Rails 6.1→7.0)
- Day 2: Phases 3-4 (Rails 7.0→7.2 + Node)
- Day 3: Phases 5-6 (React + Router)
- Day 4: Phase 7 + testing

**Conservative (part-time, careful):**
- Week 1: Phase 1
- Week 2: Phase 2
- Week 3: Phases 3-4
- Week 4: Phases 5-6
- Week 5: Phase 7 + production deployment

---

## Success Criteria

Upgrade is complete when:

- [ ] All phases completed
- [ ] All automated tests pass
- [ ] All manual tests pass
- [ ] No deprecation warnings
- [ ] Performance is same or better
- [ ] Production deployment successful
- [ ] No issues reported for 1 week

---

## Support & Resources

- **Rails Upgrade Guide:** https://edgeguides.rubyonrails.org/upgrading_ruby_on_rails.html
- **React 18 Upgrade:** https://react.dev/blog/2022/03/08/react-18-upgrade-guide
- **React Router v6:** https://reactrouter.com/en/main/upgrading/v5
- **Ruby Changelog:** https://www.ruby-lang.org/en/news/
- **Devise:** https://github.com/heartcombo/devise
- **GraphQL Ruby:** https://graphql-ruby.org/

---

**Good luck with the upgrade! Take it slow, test thoroughly, and don't skip phases.**
