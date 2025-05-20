### 📁 File Structure
```
.
├── docker-compose.yml
├── docker-compose.production.yml
├── .env.template
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


### 🚀 Deployment Scripts

This project includes a suite of environment-aware scripts for deploying and managing Docker Compose services using secrets from 1Password Connect.

#### 📦 deploy.sh
Deploys a given environment (dev or production) to a target path.

`./deploy.sh /path/to/app [dev|production]`

Examples:

```
./deploy.sh ~/apps/players dev
./deploy.sh /opt/players production
```

#### 🟢 start.sh
Starts the app stack with secrets injected from 1Password, logs output, and runs in the background via nohup.

`./start.sh [dev|production] [docker-compose args...]`

Examples:

```
./start.sh dev               # start dev stack
./start.sh production -d     # start production in detached mode
./start.sh dev web           # start only 'web' service
```
Logs are stored in `logs/<env>_start_<timestamp>.log.`

#### 🔴 stop.sh
Stops the app stack, kills backgrounded nohup processes, removes volumes, and deletes the .env file.

`./stop.sh [dev|production]`

Examples:

```
./stop.sh dev
./stop.sh production
```
Logs are saved in `logs/<env>_stop_<timestamp>.log.`

#### 🔁 restart.sh
Convenience script to stop and start a given environment.

`./restart.sh [dev|production] [docker-compose args...]`

Examples:

```
./restart.sh dev
./restart.sh production -d
```

#### 🧹 logs/rotate.sh (TODO)
Compresses and archives logs older than 14 days into logs/archive/.

`./logs/rotate.sh`
Run periodically via cron or manually to manage disk usage.

#### 🔐 Secrets Management

These scripts assumes you:
* Use 1Password Connect CLI (op)
* Store secrets as template references in .env.template or .env.production.template
* DATABASE_URL=op://my-vault/db/dev-url
* GITHUB_PAT=op://my-vault/github/pat
* Do not include OP_CONNECT_TOKEN in the template. It is securely exported via op read.
