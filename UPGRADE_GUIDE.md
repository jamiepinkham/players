# Players App Modernization Guide

Clean, stepwise upgrade plan for modernizing the Players application stack.

## Current → Target

- Ruby 3.1.2 → 3.3.7
- Rails 6.1.7 → 7.2.x
- Node 18 → 20
- React 17 → 18
- react-router-dom v5 → v6
- Devise + devise-jwt → Rodauth with JWT/refresh tokens
- Remove unused dependencies (Babel, webpack, Spring, etc.)

---

## Phase 1: Ruby & Security Updates

### 1.1 Update Ruby

**Dockerfile** (line 2):
```dockerfile
FROM ruby:3.3.7 AS web
```

**rails/Gemfile** (line 2):
```ruby
ruby "3.3.7"
```

### 1.2 Update Gemfile

```ruby
# Security-critical
gem 'nokogiri', '~> 1.19'
gem 'devise', '~> 4.9'
gem 'devise-jwt', '~> 0.13'

# Core updates
gem 'graphql', '~> 2.5'
gem 'puma', '~> 6.0'
gem 'pg', '~> 1.6'
gem 'httparty', '~> 0.24'
gem 'autoprefixer-rails', '~> 10.4'
gem 'rack-cors', '~> 2.0'
gem 'rack-timeout', '~> 0.7'
gem 'dotenv-rails', '~> 3.2', groups: [:development, :test]
gem 'factory_bot_rails', '~> 6.5', group: :test
gem 'faker', '~> 3.5', group: :test
gem 'graphiql-rails', '~> 1.10', group: :development
gem 'byebug', '~> 13.0', groups: [:development, :test]
gem 'web-console', '~> 4.2', group: :development

# Remove dry-* pins (lines 50-51)
# gem 'dry-configurable', '0.12.1'  # DELETE
# gem 'dry-container', '0.7.2'      # DELETE
```

### 1.3 Build & Test

```bash
docker compose down
docker compose build
docker compose up
bundle exec rails test
```

**Verify:**
- App starts
- Can log in
- Basic operations work

**Commit:** `Phase 1: Update Ruby to 3.3.7 and gems`

---

## Phase 2: Rails 6.1 → 7.0

### 2.1 Update Gemfile

```ruby
gem 'rails', '~> 7.0.0'

# Remove (built into Rails 7):
# gem 'rails_12factor', group: :production  # DELETE
```

### 2.2 Bundle Update

```bash
bundle update rails
bundle exec rails app:update
```

**When prompted:**
- Overwrite: `boot.rb`, `environment.rb`
- Diff & merge: `application.rb`, `environments/*.rb`
- Keep yours: `locales/en.yml`

### 2.3 Update config/application.rb

Add inside `Application` class:
```ruby
config.load_defaults 7.0
```

### 2.4 Test

```bash
docker compose restart players
bundle exec rails test
```

**Commit:** `Phase 2: Upgrade Rails 6.1 → 7.0`

---

## Phase 3: Rails 7.0 → 7.2

### 3.1 Update Gemfile

```ruby
gem 'rails', '~> 7.2'
```

### 3.2 Update & Configure

```bash
bundle update rails
bundle exec rails app:update
```

**config/application.rb:**
```ruby
config.load_defaults 7.2
```

### 3.3 Test

```bash
docker compose restart players
bundle exec rails test
```

**Commit:** `Phase 3: Upgrade Rails 7.0 → 7.2`

---

## Phase 4: Node & Frontend Dependencies

### 4.1 Update Node

**Dockerfile** (line ~17):
```dockerfile
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
```

**rails/package.json**:
```json
"engines": {
  "node": ">=20"
}
```

### 4.2 Remove Unused Dependencies

**rails/package.json** - Delete these lines:
```json
"@babel/core": "^7.13.10",
"@babel/preset-react": "^7.12.13",
"babel-plugin-transform-react-remove-prop-types": "^0.4.24",
"@svgr/webpack": "^5.5.0",
```

### 4.3 Update Build Tools

```json
"devDependencies": {
  "esbuild": "^0.24.0",
  "install-peers": "^1.0.4"
}
```

### 4.4 Update Dependencies

```json
"dependencies": {
  "axios": "^1.7.9",
  "@fontsource/fira-sans": "^5.3.0",
  "@popperjs/core": "^2.11.8",
  "graphql-hooks": "^6.2.0",
  "grommet": "^2.40.0",
  "grommet-controls": "^4.2.1",
  "grommet-icons": "^4.13.1",
  "jwt-decode": "^4.0.0",
  "moment-timezone": "^0.5.46",
  "prop-types": "^15.8.1",
  "styled-components": "^6.1.14",

  // Keep React 17 for now
  "react": "^17.0.1",
  "react-dom": "^17.0.1",
  "react-router-dom": "^5.3.4",
  // ... other react-* packages stay at current versions
}
```

### 4.5 Rebuild

```bash
docker compose exec players rm -rf node_modules yarn.lock
docker compose exec players yarn install
docker compose down && docker compose build && docker compose up
```

**Commit:** `Phase 4: Update Node 20, remove Babel, update dependencies`

---

## Phase 5: React 17 → 18

### 5.1 Update React Packages

**rails/package.json:**
```json
"dependencies": {
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-moment": "^3.1.0",
  "styled-components": "^6.1.14",
  "grommet": "^2.40.0",
  "grommet-controls": "^4.2.1",
  "grommet-icons": "^4.13.1",
  "react-router-dom": "^5.3.4",  // Keep v5 for now
  // ... rest stay same
}
```

### 5.2 Update React Root API

Find your React entry point (likely `rails/app/javascript/application.jsx`).

**Before:**
```jsx
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));
```

**After:**
```jsx
import { createRoot } from 'react-dom/client';
const root = createRoot(document.getElementById('root'));
root.render(<App />);
```

Search for other `ReactDOM.render` calls:
```bash
grep -r "ReactDOM.render" app/javascript/
```

### 5.3 Rebuild & Test

```bash
yarn install
docker compose restart players
```

**Commit:** `Phase 5: Upgrade React 17 → 18`

---

## Phase 6: React Router v5 → v6

### 6.1 Audit Current Routes

```bash
grep -r "Switch\|Route\|useHistory\|useRouteMatch" app/javascript/
```

### 6.2 Update Package

```json
"react-router-dom": "^6.28.0"
```

### 6.3 Update Route Syntax

**v5 → v6 changes:**

```jsx
// OLD
import { BrowserRouter, Switch, Route } from 'react-router-dom';
<Switch>
  <Route exact path="/" component={Home} />
  <Route path="/teams/:id" component={TeamDetail} />
</Switch>

// NEW
import { BrowserRouter, Routes, Route } from 'react-router-dom';
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/teams/:id" element={<TeamDetail />} />
</Routes>
```

**Navigation hooks:**
```jsx
// OLD
import { useHistory } from 'react-router-dom';
const history = useHistory();
history.push('/teams');

// NEW
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();
navigate('/teams');
```

**Match hooks:**
```jsx
// OLD
import { useRouteMatch } from 'react-router-dom';
const match = useRouteMatch('/teams/:id');

// NEW
import { useMatch } from 'react-router-dom';
const match = useMatch('/teams/:id');
```

### 6.4 Test

```bash
yarn install
docker compose restart players
```

Test all routes, navigation, back button, URL params.

**Commit:** `Phase 6: Upgrade React Router v5 → v6`

---

## Phase 7: Authentication Rewrite (Rodauth)

### 7.1 Add Rodauth

**rails/Gemfile:**
```ruby
# Remove
# gem 'devise'
# gem 'devise-jwt'

# Add
gem 'rodauth-rails', '~> 1.14'
gem 'bcrypt', '~> 3.1'
gem 'jwt', '~> 2.7'
```

```bash
bundle install
rails generate rodauth:install --json
```

### 7.2 Configure Rodauth for JWT

**app/lib/rodauth_main.rb:**
```ruby
class RodauthMain < Rodauth::Rails::Auth
  configure do
    # No signup - users created by admin only
    enable :login, :logout, :reset_password, :change_password

    enable :jwt, :jwt_refresh

    jwt_secret ENV.fetch('DEVISE_JWT_SECRET_KEY') { ENV['SECRET_KEY_BASE'] }
    jwt_access_token_period 15 * 60  # 15 minutes
    jwt_refresh_token_period 30 * 24 * 60 * 60  # 30 days

    use_refresh_tokens? true
    refresh_token_cookie_options {
      {
        httponly: true,
        secure: Rails.env.production?,
        same_site: :lax,
        path: '/jwt-refresh'
      }
    }

    require_login_confirmation? false
    login_column :username
    login_label 'Username'
    password_hash_cost 12

    account_model ::User
    accounts_table :users

    json_response_success_key 'success'
    json_response_error_key 'error'

    login_redirect '/'
    logout_redirect '/login'

    # Email configuration for password resets
    email_from ENV.fetch('SMTP_FROM_EMAIL', 'noreply@yourapp.com')

    # Customize email subjects/bodies if needed
    reset_password_email_subject 'Reset Your Password'
  end
end
```

### 7.3 Configure RailsAdmin Auth

**app/lib/rodauth_admin.rb:**
```ruby
class RodauthAdmin < Rodauth::Rails::Auth
  configure do
    enable :login, :logout, :remember

    prefix '/admin/auth'
    login_route 'login'
    logout_route 'logout'

    login_redirect '/admin'
    logout_redirect '/admin/auth/login'

    require_login_confirmation? false
    login_column :username
    account_model ::User
    accounts_table :users

    before_login do
      unless account[:is_admin]
        set_error_flash 'Only administrators can access this area'
        return_response login_view
      end
    end
  end
end
```

### 7.4 Database Migration

Review the generated migration and modify (remove account creation tables since no signup):

```ruby
class CreateRodauth < ActiveRecord::Migration[7.2]
  def change
    # Add to existing users table
    add_column :users, :password_hash, :string unless column_exists?(:users, :password_hash)
    add_column :users, :status, :integer, null: false, default: 2

    # Password reset support
    create_table :account_password_reset_keys do |t|
      t.foreign_key :users, column: :id
      t.string :key, null: false
      t.datetime :deadline, null: false
      t.datetime :email_last_sent, null: false, default: -> { 'CURRENT_TIMESTAMP' }
    end

    # JWT refresh tokens
    create_table :account_jwt_refresh_keys do |t|
      t.references :user, foreign_key: true, null: false
      t.string :key, null: false, unique: true
      t.datetime :deadline, null: false
      t.timestamps
    end

    add_index :account_jwt_refresh_keys, :key
    add_index :account_jwt_refresh_keys, [:user_id, :deadline]
  end
end
```

### 7.5 Migrate Users Table

```ruby
class PrepareUsersForRodauth < ActiveRecord::Migration[7.2]
  def up
    add_column :users, :status, :integer, default: 2 unless column_exists?(:users, :status)

    # Nullify all passwords - users will need to reset
    # This is the SAFEST approach to avoid Devise/Rodauth compatibility issues
    if column_exists?(:users, :encrypted_password)
      # Clear existing passwords
      execute "UPDATE users SET encrypted_password = NULL"
      rename_column :users, :encrypted_password, :password_hash
    end

    # Remove Devise columns
    remove_column :users, :reset_password_token if column_exists?(:users, :reset_password_token)
    remove_column :users, :reset_password_sent_at if column_exists?(:users, :reset_password_sent_at)
    remove_column :users, :remember_created_at if column_exists?(:users, :remember_created_at)
    remove_column :users, :sign_in_count if column_exists?(:users, :sign_in_count)
    remove_column :users, :current_sign_in_at if column_exists?(:users, :current_sign_in_at)
    remove_column :users, :last_sign_in_at if column_exists?(:users, :last_sign_in_at)
    remove_column :users, :current_sign_in_ip if column_exists?(:users, :current_sign_in_ip)
    remove_column :users, :last_sign_in_ip if column_exists?(:users, :last_sign_in_ip)
  end
end
```

```bash
rails db:migrate
```

### 7.6 Verify Email Configuration

Password resets require email delivery. Ensure your SMTP settings are configured:

**config/environments/production.rb:**
```ruby
config.action_mailer.delivery_method = :smtp
config.action_mailer.smtp_settings = {
  address: ENV['SMTP_HOST'],
  port: ENV['SMTP_PORT'],
  user_name: ENV['SMTP_USERNAME'],
  password: ENV['SMTP_PASSWORD'],
  authentication: :plain,
  enable_starttls_auto: true
}
config.action_mailer.default_url_options = { host: ENV['APP_HOST'] }
```

**Test email delivery:**
```bash
rails console
UserMailer.test_email('your@email.com').deliver_now
```

### 7.7 Notify Users About Password Reset

All users need new passwords. Send notification:

**Option A: Direct notification** (recommended):
Message all users directly (Slack, email, etc.):
> "We're upgrading authentication. Please use 'Forgot Password' on your next login to reset your password."

**Option B: Automated email** (if you have mailer):
```ruby
# Rails console
User.find_each do |user|
  UserMailer.password_reset_required(user).deliver_later
end
```

**Option C: Set temporary passwords** (for testing/development):
```ruby
# Rails console - only for dev/testing
User.find_each do |user|
  user.password = SecureRandom.hex(16)
  user.save!
  puts "#{user.username}: temporary password set, needs reset"
end
```

### 7.8 Update Routes

**rails/config/routes.rb:**
```ruby
Rails.application.routes.draw do
  # Main API authentication (JWT)
  rodauth_route = RodauthMain

  # Admin authentication (sessions)
  scope '/admin' do
    rodauth_route :admin, RodauthAdmin
  end

  # ... rest of routes
end
```

### 7.9 Update RailsAdmin Config

**rails/config/initializers/rails_admin.rb:**
```ruby
RailsAdmin.config do |config|
  config.authenticate_with do
    redirect_to '/admin/auth/login' unless rodauth(:admin).logged_in?
  end

  config.current_user_method do
    rodauth(:admin).rails_account
  end

  config.authorize_with do
    unless current_user&.is_admin?
      flash[:error] = 'You must be an administrator to access this section.'
      redirect_to main_app.root_path
    end
  end

  # ... rest of config
end
```

### 7.10 Update GraphQL Controller

**rails/app/controllers/graphql_controller.rb:**
```ruby
class GraphqlController < ApplicationController
  def execute
    variables = prepare_variables(params[:variables])
    query = params[:query]
    operation_name = params[:operationName]

    authenticate_with_jwt

    context = {
      current_user: current_user,
      rodauth: rodauth
    }

    result = PlayersSchema.execute(query, variables: variables, context: context, operation_name: operation_name)
    render json: result
  rescue => e
    handle_error_in_development(e)
  end

  private

  def authenticate_with_jwt
    rodauth.require_authentication
  rescue Rodauth::JWTRefreshNotRequested
    render json: { errors: ['Authentication required'] }, status: :unauthorized
  end

  def current_user
    rodauth.rails_account
  end
end
```

### 7.11 Create Frontend Auth Client

**rails/app/javascript/lib/auth.js:**
```javascript
import axios from 'axios';

const API_BASE = '';

class AuthClient {
  constructor() {
    this.accessToken = localStorage.getItem('access_token');
    this.setupInterceptors();
  }

  setupInterceptors() {
    axios.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            this.logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(username, password) {
    try {
      const response = await axios.post(`${API_BASE}/login`, {
        login: username,
        password: password
      });

      this.accessToken = response.data.access_token;
      localStorage.setItem('access_token', this.accessToken);

      return {
        success: true,
        user: response.data.account
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  }

  async refreshToken() {
    try {
      const response = await axios.post(`${API_BASE}/jwt-refresh`);
      this.accessToken = response.data.access_token;
      localStorage.setItem('access_token', this.accessToken);
      return true;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  logout() {
    this.accessToken = null;
    localStorage.removeItem('access_token');
    axios.post(`${API_BASE}/logout`).catch(() => {});
  }

  isAuthenticated() {
    return !!this.accessToken;
  }

  getAccessToken() {
    return this.accessToken;
  }
}

export const auth = new AuthClient();
export default auth;
```

### 7.12 Update GraphQL Client

Update your GraphQL client to use the auth client:

```javascript
import { GraphQLClient } from 'graphql-hooks';
import { auth } from './lib/auth';

const client = new GraphQLClient({
  url: '/graphql',
  fetchOptions: () => {
    const token = auth.getAccessToken();
    return {
      headers: {
        Authorization: token ? `Bearer ${token}` : ''
      }
    };
  }
});

export default client;
```

### 7.13 Update User Model

**rails/app/models/user.rb:**
```ruby
class User < ApplicationRecord
  # Remove Devise
  # devise :database_authenticatable, ...

  validates :username, presence: true, uniqueness: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }

  has_one :team
  has_many :bids, through: :team
  has_many :contracts, through: :team
  has_many :trades_proposed, through: :team, source: :trades_from
  has_many :trades_received, through: :team, source: :trades_to

  def self.ransackable_attributes(auth_object = nil)
    ["created_at", "email", "id", "is_admin", "name", "team_id", "updated_at", "username"]
  end

  def self.ransackable_associations(auth_object = nil)
    ["team"]
  end
end
```

### 7.14 Remove Devise

```bash
rm config/initializers/devise.rb
# Remove any devise_for routes
# Delete JwtDenylist model if it exists
```

### 7.15 Create Token Cleanup Task

**rails/lib/tasks/auth.rake:**
```ruby
namespace :auth do
  desc "Clean up expired JWT refresh tokens"
  task cleanup_tokens: :environment do
    AccountJwtRefreshKey.where('deadline < ?', Time.now).delete_all
    puts "Cleaned up expired refresh tokens"
  end
end
```

Run periodically via cron or scheduler:
```bash
rails auth:cleanup_tokens
```

### 7.16 Test Authentication

**CRITICAL - Test password reset FIRST:**
- [ ] Request password reset for a user
- [ ] Verify email is received with reset link
- [ ] Click reset link and set new password
- [ ] Login with new password

**Frontend (JWT):**
- [ ] Login via frontend with reset password
- [ ] Make authenticated GraphQL query
- [ ] Wait 15+ minutes, verify token refresh works automatically
- [ ] Create trade/bid to test auth on mutations
- [ ] Logout and login again
- [ ] Verify old passwords DON'T work (confirm forced reset)

**Change Password:**
- [ ] Login as user
- [ ] Change password via /change-password route
- [ ] Logout and login with new password

**Admin (Sessions):**
- [ ] RailsAdmin login independently at /admin/auth/login
- [ ] Create new user via admin panel
- [ ] Set password for new user
- [ ] Verify admin-only access restrictions work

**Commit:** `Phase 7: Replace Devise with Rodauth + JWT/refresh tokens`

---

## Phase 8: Final Cleanup

### 8.1 Verify Versions

```bash
bundle outdated --only-explicit
yarn outdated
```

### 8.2 Update README

Update tech stack section:
```markdown
## Tech Stack

- **Backend**: Ruby 3.3.7, Rails 7.2
- **Database**: PostgreSQL 16
- **API**: GraphQL with GraphiQL (development)
- **Authentication**: Rodauth with JWT tokens
- **Admin**: RailsAdmin
- **Frontend**: React 18 with esbuild
- **Deployment**: Docker + Portainer
- **CI/CD**: GitHub Actions → GitHub Container Registry
```

### 8.3 Test Everything

```bash
bundle exec rails test
yarn build
yarn build:css
```

Manual testing checklist:
- Authentication flow
- All main features (teams, players, trades, bids)
- Admin panel
- GraphQL queries

### 8.4 Production Build Test

```bash
RAILS_ENV=production bundle exec rails assets:precompile
```

**Commit:** `Phase 8: Final cleanup and documentation`

---

## Deployment

### Update Production

1. GitHub Actions will build new image automatically on push to `main`
2. In Portainer:
   - Go to Stacks → `players`
   - Click **Update the stack**
   - Enable **Re-pull image and redeploy**
   - Click **Update**
3. Monitor logs for successful startup
4. Test production deployment

---

## Rollback

If issues occur:

```bash
# Local
git reset --hard <previous-commit>
docker compose down -v
docker compose build
docker compose up

# Production (Portainer)
# Update stack with previous image tag
```

---

## Notes

- **All users MUST reset passwords** - Migration nullifies all existing passwords for safety
- **Email required** - Password resets sent via email (verify SMTP config in Phase 7.6)
- **Test password reset FIRST** - Don't deploy until email reset flow works
- **No public signup** - Users created by admin only (via RailsAdmin or console)
- **Refresh tokens in httpOnly cookies** - More secure than localStorage
- **Access tokens expire after 15 min** - Auto-refresh on 401 responses
- **RailsAdmin uses separate session auth** - Independent from JWT
- **Two auth systems** - JWT for frontend API, sessions for admin panel

---

## Reference

- **Rails Upgrade Guide**: https://edgeguides.rubyonrails.org/upgrading_ruby_on_rails.html
- **React 18 Upgrade**: https://react.dev/blog/2022/03/08/react-18-upgrade-guide
- **React Router v6**: https://reactrouter.com/en/main/upgrading/v5
- **Rodauth**: https://github.com/jeremyevans/rodauth
- **Rodauth Rails**: https://github.com/janko/rodauth-rails
