### PR Checks
* docker build
* linear history (squash or rebase)

### Getting Started
1. Clone the repo
2. [Ensure op cli is installed](https://developer.1password.com/docs/cli/get-started/)
3. Have secrets server url and token handy
   - `OP_CONNECT_HOST`
   - `OP_CONNECT_TOKEN`
4. `bin/setup`
5. `bin/run`
6. 🤞

### 📁 File Structure
```
.
├── docker-compose.yml
├── docker-compose.production.yml
├── .env.dev.template
├── .env.production.template
├── .dockerignore //supposed to skip node_modules, it doesn't
├── Dockerfile.web
├── Dockerfile.assets
├── rails/
│   ├── app/
│   ├── config/
│   └── Dockerfile
├── bin/
```

### 🧰 Services
#### web

The main Rails application container.
```
web:
  build:
    context: .
    dockerfile: Dockerfile.web
  volumes:
    - ./rails:/app
    - ./rails/app/assets/builds:/app/app/assets/builds
  ports:
    - "3000:3000"
  depends_on:
    - db
```
* Builds from Dockerfile.web in the project root
* Mounts the rails/ directory into the container at /app for live code syncing
* Exposes port 3000 (accessible at http://localhost:3000)
* Depends on db, ensuring the database starts first

#### assets

A container dedicated to building front-end assets (e.g., JS/CSS via esbuild, Dart Sass, etc.)

```
assets:
  platform: linux/amd64
  build:
    context: .
    dockerfile: Dockerfile.assets
  volumes:
    - ./rails:/app
    - ./rails/app/assets/builds:/app/app/assets/builds
```

* Uses Dockerfile.assets to build assets (esbuild/sass)
* Shares source code and the builds directory with the web service
* platform: linux/amd64 ensures compatibility on Apple Silicon (M1/M2)

#### db

A PostgreSQL 13 container for the Rails database.

```
db:
  image: postgres:13
  volumes:
    - pgdata:/var/lib/postgresql/data
```
* Stores database data in a named volume (pgdata) to persist across runs
* Credentials and DB config should be managed via environment variables (POSTGRES_USER, etc.)

### 🗃️ Volumes

```
volumes:
  pgdata:
  assets:
```
* pgdata: Stores Postgres data
* assets: (Declared but unused here — could be used for persistent asset caching or CDN uploads)



## 🛠 Script Overview

This project includes a set of environment-aware automation scripts for deploying, running, and managing a Dockerized Rails application with secrets from 1Password Connect.

### ⚙️ Prerequisites
This script assumes:
* You have 1Password CLI (op) installed and authenticated
* An environment template at .env.dev.template or .env.production.template

### 🚀 start.sh
This script securely starts your Docker Compose stack with environment-specific secrets managed via 1Password Connect.

#### 📜 Usage

`bin/start [dev|production] [--background] [docker-compose args...]`

#### 🔧 Examples:

```
bin/start dev
bin/start production --background
bin/start dev --background players db
```
* Uses .env.dev.template or .env.production.template
* Logs are stored in logs/<env>_start_<timestamp>.log
* If run in background mode, .env file is not deleted automatically

#### 🧠 What It Does

1. **Chooses the environment**:
   - Defaults to `dev`
   - Supports `dev` and `production` as environment names

2. **Injects secrets from 1Password**:
   - Uses `op inject` to create an `.env` file from an `.env.template`
   - Requires `OP_CONNECT_HOST` and `OP_CONNECT_TOKEN` to be set ahead of time or via helper functions

3. **Validates required secrets**:
   - Uses `bin/validate-env` to confirm all required secrets exist

4. **Starts the Docker Compose stack**:
   - In foreground by default
   - In background if `--background` is passed

5. **Logs**:
   - Logs all background output to `logs/ENVIRONMENT_start_TIMESTAMP.log`

6. **Cleans up**:
   - Deletes the generated `.env` file on exit (foreground only)

---

#### 📂 File Naming Convention

| Purpose              | Filename Format                                   |
|----------------------|----------------------------------------------------|
| Env template         | `.env.dev.template` or `.env.production.template`  |
| Final injected file  | `.env.dev` or `.env.production`                   |
| Compose file         | `docker-compose.dev.yml`, `docker-compose.production.yml` |
| Logs                 | `logs/dev_start_YYYYMMDD_HHMMSS.log`              |



#### Example Output:
```
bin/start         
🔧 Environment: dev
📄 Using env template: .env.dev.template
📦 Using compose file: docker-compose.yml
📂 Logging to: logs/dev_start_20250520_111805.log
🔐 Exporting OP_CONNECT_* from 1Password...
✅ OP_CONNECT_* exported successfully.
🔐 Injecting secrets from 1Password...
🔐 OP_CONNECT_* already set. Skipping fetch.
Using OP_CONNECT_HOST: https://connect-api.cuscus-morpho.ts.net
🔍 Validating secrets in .env.dev.template...
✅ bmpl/github → pat
✅ bmpl/postgres-dev → db
✅ bmpl/postgres-dev → password
✅ bmpl/postgres-dev → username
✅ bmpl/rails-secret-base-key-dev → value
✅ All secrets validated!
/Users/jp/dev/players/.env.dev
🚀 Starting dev stack in foreground...
[+] Running 3/0
 ✔ Container players-assets-1  Created                                                                      0.0s 
 ✔ Container players-db-1      Created                                                                      0.0s 
 ✔ Container players-web-1     Created                                                                      0.0s 
Attaching to assets-1, db-1, web-1
db-1      | 
db-1      | PostgreSQL Database directory appears to contain a database; Skipping initialization
db-1      | 
db-1      | 2025-05-20 15:18:09.363 UTC [1] LOG:  starting PostgreSQL 13.21 (Debian 13.21-1.pgdg120+1) on aarch64-unknown-linux-gnu, compiled by gcc (Debian 12.2.0-14) 12.2.0, 64-bit
db-1      | 2025-05-20 15:18:09.366 UTC [1] LOG:  listening on IPv4 address "0.0.0.0", port 5432
db-1      | 2025-05-20 15:18:09.367 UTC [1] LOG:  listening on IPv6 address "::", port 5432
db-1      | 2025-05-20 15:18:09.370 UTC [1] LOG:  listening on Unix socket "/var/run/postgresql/.s.PGSQL.5432"
db-1      | 2025-05-20 15:18:09.376 UTC [27] LOG:  database system was shut down at 2025-05-20 15:16:51 UTC
db-1      | 2025-05-20 15:18:09.385 UTC [1] LOG:  database system is ready to accept connections
web-1     | 15:18:09 web.1  | started with pid 7
assets-1  | [watch] build finished, watching for changes...
web-1     | 15:18:11 web.1  | => Booting Puma
web-1     | 15:18:11 web.1  | => Rails 6.1.7 application starting in development 
web-1     | 15:18:11 web.1  | => Run `bin/rails server --help` for more startup options
web-1     | 15:18:12 web.1  | Puma starting in single mode...
web-1     | 15:18:12 web.1  | * Puma version: 6.0.0 (ruby 3.1.2-p20) ("Sunflower")
web-1     | 15:18:12 web.1  | *  Min threads: 5
web-1     | 15:18:12 web.1  | *  Max threads: 5
web-1     | 15:18:12 web.1  | *  Environment: development
web-1     | 15:18:12 web.1  | *          PID: 7
web-1     | 15:18:12 web.1  | * Listening on http://0.0.0.0:3000
web-1     | 15:18:12 web.1  | Use Ctrl-C to stop
assets-1  | Sass is watching for changes. Press Ctrl-C to stop.
assets-1  | 
^CGracefully stopping... (press Ctrl+C again to force)
[+] Stopping 3/3
 ✔ Container players-web-1     Stopped                                                                      0.8s 
 ✔ Container players-assets-1  Stopped                                                                     10.1s 
 ✔ Container players-db-1      Stopped 
```


### 🔁 restart.sh

This script stops and restarts a Docker Compose stack for the specified environment. It supports both foreground and background operation modes.

---

### 📜 Usage

`bin/restart.sh [dev|production] [--background] [docker-compose args...]`
* dev or production: Target environment (defaults to dev)
* --background: (Optional) Run the stack in background mode
* Additional arguments will be passed to docker-compose up
#### 🧠 What It Does
1. **Parses Arguments**
  - Defaults to dev environment
  - Supports optional --background flag to run docker-compose via nohup
  - Passes any remaining arguments directly to docker-compose up
2. **Validates Environment**
  - Fails fast if the environment is not dev or production
3. **Stops the Existing Stack**
  - Calls `bin/stop [env]` to shut down the current environment and clean up
4. **Starts the Stack Again**
  - Calls `bin/start.sh [env] [--background]` with any remaining arguments
#### 🛠 Example Commands
```
bin/restart.sh dev
bin/restart.sh production --background
bin/restart.sh dev -- players web
```

### 🛑 stop.sh

This script gracefully stops a running Docker Compose stack for a given environment, including backgrounded processes launched via `nohup`. It also cleans up the injected `.env` file and logs the shutdown process.

---

#### 📜 Usage

`bin/stop.sh [dev|production]`
* dev or production: Target environment (defaults to dev if not specified)
#### 🔐 What It Does
1. **Validates Inputs**
  - Ensures the environment is either `dev` or `production`
  - Confirms `docker-compose` is installed
2. **Selects Compose and Env Files**
  - Uses `docker-compose.[env].yml` if it exists, otherwise falls back to `docker-compose.yml`
  - Looks for the corresponding `.env.[env]` file
3. **Logs Actions**
  - `logs/dev_stop_YYYYMMDD_HHMMSS.log`
4. **Kills Backgrounded Compose Processes**
  - Searches for any docker-compose processes matching the environment’s compose file and attempts to terminate them
5. **Stops the Stack**
  - Runs `docker-compose down -v` with the appropriate compose and env files
6. **Cleans Up Env File**
  - Removes the injected `.env.[env]` file if it exists
#### 🛠 Example Output
```
🛑 Stopping dev stack using docker-compose.dev.yml...
🔍 Checking for backgrounded docker-compose processes...
🚫 Found background docker-compose PIDs: 12345 12346
✅ No matching background processes found.
Removing network dev_default
🧹 Removed .env.dev
✅ dev stack stopped and cleaned up.
```


### 🚀 deploy.sh (UNTESTED)

This script deploys the application by injecting secrets, cloning or updating the repo, and restarting the stack. It supports both `dev` and `production` environments.

### ⚙️ Prerequisites
* Your 1Password vault contains:
  * GITHUB_PAT

---

### 📜 Usage

`bash bin/deploy.sh /path/to/app [dev|production]`
* /path/to/app: Absolute or relative path where the app should be deployed
* dev or production: Target environment (defaults to dev)
#### 🔐 What It Does
1. **Tool Check**
  - Verifies required CLI tools are installed: docker-compose, git, and op
2. **Input Validation**
  - Confirms valid path and environment are provided
  - Fails fast if missing or invalid
3. **Secrets Injection**
  - Uses op inject with a `.env.[env].template` file
  - Writes a temporary `.env.[env]` file and removes it after execution
4. **Git Repository Sync**
  - Clones the repo if not present
  - Pulls latest changes if it already exists
  - Uses a GitHub personal access token (PAT) injected via 1Password
5. **Script Permissions**
  - Ensures start.sh, stop.sh, and restart.sh are executable
6. **Stack Restart**
  - Calls `bin/restart.sh [env]` to bring up the environment


### 🧪 generate-dev-env.sh

This script generates a fallback `.env` file for local development or testing environments. It should **not** be used in production.

#### 📜 Usage

`bin/generate-env [dev|production]`

#### 🔧 Examples:

```
./generate-default-env dev
./generate-default-env production
```

#### 🔐 What It Does

1. Accepts a single argument for the environment (`dev` or `production`)
2. Validates the environment name
3. Checks if `.env.dev` or `.env.production` already exists — and exits if so
4. Generates a fallback `.env.[env]` file with safe placeholder values for local use

---

#### ⚠️ Warning

- This script is intended **only for local development**
- The `.env` file it creates includes dummy secrets such as `SECRET_KEY_BASE` and a sample `GITHUB_PAT`
- **Never commit this file with real secrets to version control**

#### 🔐 Values Used:
```
RAILS_ENV=development
SECRET_KEY_BASE=dev-placeholder-secret-key
DATABASE_HOST=db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
GITHUB_PAT=ghp_exampletokenfortestingonly
```

⚠️ Do not use these values in production. They are insecure and intended for local use only.

### 🛠 `bin/seed_from_heroku`

This script pulls a backup of your Heroku Postgres database and restores it into your local Dockerized Postgres container. It supports multiple environments by reading credentials from 1Password based on the environment (`dev` or `production`).

---

#### 📜 Usage

`bin/seed_from_heroku` <heroku-app-name> <local-db-name> [environment=dev] [pg-container-name=db]`
* `<heroku-app-name>`: (Required) The name of your Heroku app.
* `<local-db-name>`: (Required) The name of your local Postgres database.
* `[environment]`: (Optional) dev or production. Defaults to dev.
* `[pg-container-name]`: (Optional) The Docker container name for Postgres. Defaults to db.
#### What It Does
1. Fetches Postgres credentials from 1Password:
2. Ensures Postgres container is running:
   - Starts it via Docker Compose if not already running.
3. Waits until Postgres is ready via `pg_isready`.
4. Captures and downloads the latest Heroku Postgres backup.
5. Drops and recreates your local Postgres database.
6. Restores the downloaded backup into the local database using `pg_restore`.
#### 🔐 Required 1Password Secrets
Stored in your 1Password vault under bmpl:
* For dev:
   - `op://bmpl/secrets/postgres-dev/username`
   - `op://bmpl/secrets/postgres-dev/password`
* For production:
   - `op://bmpl/secrets/postgres-production/username`
   - `op://bmpl/secrets/postgres-production/password`
#### 🧪 Example
```
bin/pull-from-heroku.sh myapp-staging players_development
bin/pull-from-heroku.sh myapp-prod players_production production
bin/pull-from-heroku.sh myapp-prod players_production production pg_container_name
```
