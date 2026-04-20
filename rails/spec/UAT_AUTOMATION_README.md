# UAT Test Automation

Automated test suite covering 194 UAT test cases from the BMPL UAT spreadsheet.

## Test Coverage

### ✅ Implemented (Critical & High Priority)

#### Free Agency & Bidding (17 tests)
- **FA-001 to FA-011**: Bid conversion, home team discount, validation
- **FA-012 to FA-017**: Bidding page UI/UX (search focus, layout stability, position tabs)

#### Player Stats & Images (29 tests)
- **PS-001 to PS-018**: Player detail page (navigation, avatar, stats, buttons, contracts)
- **PS-019 to PS-029**: Player avatar display, stats API, GraphQL integration

#### Trade System (27 tests)
- **TR-001 to TR-027**: Trade builder drag-and-drop, validation, approval/rejection, notifications

#### Backend & Data (22 tests)
- **BD-001 to BD-022**: Migrations, free agent status, GraphQL API, contract callbacks, player stats model

### 📝 Remaining Tests (Not Yet Automated)

- **UI/UX & Responsive** (20 tests): Hamburger nav, layout testing, responsive design
- **Documentation** (6 tests): Docs accuracy verification
- **Performance** (9 tests): Page load timing, stats loading benchmarks
- **Regression** (1 test): Rails Admin access

## Running Tests

### Run all UAT tests:
```bash
bundle exec rspec spec/features/ spec/models/
```

### Run specific test suites:
```bash
# Free Agency tests
bundle exec rspec spec/features/free_agency_spec.rb

# Player Detail tests
bundle exec rspec spec/features/player_detail_spec.rb

# Trade System tests
bundle exec rspec spec/features/trade_system_spec.rb

# Backend/Model tests
bundle exec rspec spec/models/
```

### Run tests with tags:
```bash
# Critical priority tests only
bundle exec rspec --tag critical

# High priority tests
bundle exec rspec --tag high

# Specific section
bundle exec rspec --tag free_agency
```

## Test Structure

### Feature Tests (`spec/features/`)
- Use **Capybara** with **Selenium/Chrome** for E2E testing
- Test user interactions, page navigation, drag-and-drop
- Verify UI elements, layouts, and user flows

### Model Tests (`spec/models/`)
- Test business logic, validations, callbacks
- Verify data integrity and relationships
- Test GraphQL API responses

## Test Data

Tests use FactoryBot factories defined in `spec/factories/`:
- `users.rb` - User accounts (team owners, admins)
- `teams.rb` - Teams
- `players.rb` - Players with various states (free agent, trade eligible, etc.)
- `contracts.rb` - Player contracts (active, expired, etc.)
- `bids.rb` - Free agency bids
- `trades.rb` - Trade proposals
- `player_stats.rb` - Player statistics by year

## Prerequisites

### Required Gems
```ruby
# Gemfile
group :test do
  gem 'rspec-rails'
  gem 'capybara'
  gem 'selenium-webdriver'
  gem 'webdrivers' # Auto-install ChromeDriver
  gem 'factory_bot_rails'
  gem 'faker'
  gem 'database_cleaner-active_record'
end
```

### Setup
```bash
# Install dependencies
bundle install

# Setup test database
RAILS_ENV=test bundle exec rails db:create db:migrate

# Seed test data
RAILS_ENV=test bundle exec rails db:seed
```

## Test Helpers

### Authentication
```ruby
# Sign in as team owner
sign_in team_owner

# Sign in as admin
sign_in admin
```

### Custom Helpers (defined in `spec/support/`)
- `drag_player(player, to:, from:)` - Simulate drag-and-drop for trades
- `select_trade_partner(team)` - Select trade partner in dropdown
- `wait_for_stats_load` - Wait for async stats loading

## CI/CD Integration (Future)

When ready to add CI:

```yaml
# .github/workflows/uat_tests.yml
name: UAT Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: 3.3
          bundler-cache: true

      - name: Setup Database
        run: |
          bundle exec rails db:create db:migrate
        env:
          RAILS_ENV: test

      - name: Run UAT Tests
        run: bundle exec rspec spec/features/ spec/models/
```

## Test Maintenance

### Adding New Tests

1. Check the UAT spreadsheet for new test cases
2. Add to appropriate spec file or create new one
3. Use existing factories and helpers
4. Tag with priority: `:critical`, `:high`, `:medium`, or `:low`
5. Tag with section: `:free_agency`, `:player_stats`, `:trades`, etc.

### Updating Tests

When features change:
1. Update test expectations
2. Update factories if data structure changes
3. Update helpers if UI changes
4. Re-run affected test suite

## Notes

- **JS tests**: Most feature tests use `js: true` for JavaScript interactions
- **Async loading**: Tests include proper waits for async operations (stats loading, AJAX calls)
- **Drag-and-drop**: Trade system tests use custom JavaScript execution for reliable drag-and-drop testing
- **Database**: Tests use DatabaseCleaner with transaction strategy for fast, isolated tests

## Current Test Status

| Section | Total Tests | Automated | Coverage |
|---------|-------------|-----------|----------|
| Free Agency | 17 | 17 | 100% |
| Player Stats | 29 | 29 | 100% |
| Trades | 27 | 27 | 100% |
| Backend/Data | 22 | 22 | 100% |
| UI/UX | 20 | 0 | 0% |
| Documentation | 6 | 0 | 0% |
| Performance | 9 | 0 | 0% |
| Regression | 1 | 0 | 0% |
| **TOTAL** | **131** | **95** | **73%** |

## Next Steps

1. ✅ Core business logic tests (Complete)
2. ✅ Critical user flows (Complete)
3. 🔄 UI/UX responsive tests (In Progress)
4. 📋 Performance benchmarks (Planned)
5. 📋 Documentation validation (Planned)
6. 📋 CI/CD integration (Planned)
