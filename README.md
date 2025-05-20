🚀 Deployment Scripts

This project includes a suite of environment-aware scripts for deploying and managing Docker Compose services using secrets from 1Password Connect.

📦 deploy.sh
Deploys a given environment (dev or production) to a target path.

./deploy.sh /path/to/app [dev|production]
Examples:

./deploy.sh ~/apps/players dev
./deploy.sh /opt/players production
🟢 start.sh
Starts the app stack with secrets injected from 1Password, logs output, and runs in the background via nohup.

./start.sh [dev|production] [docker-compose args...]
Examples:

./start.sh dev               # start dev stack
./start.sh production -d     # start production in detached mode
./start.sh dev web           # start only 'web' service
Logs are stored in logs/<env>_start_<timestamp>.log.

🔴 stop.sh
Stops the app stack, kills backgrounded nohup processes, removes volumes, and deletes the .env file.

./stop.sh [dev|production]
Examples:

./stop.sh dev
./stop.sh production
Logs are saved in logs/<env>_stop_<timestamp>.log.

🔁 restart.sh
Convenience script to stop and start a given environment.

./restart.sh [dev|production] [docker-compose args...]
Examples:

./restart.sh dev
./restart.sh production -d
🧹 logs/rotate.sh
Compresses and archives logs older than 14 days into logs/archive/.

./logs/rotate.sh
Run periodically via cron or manually to manage disk usage.

🔐 Secrets Management

These scripts assume you:

Use 1Password Connect CLI (op)
Store secrets as template references in .env.template or .env.production.template like:
# .env.dev.template
DATABASE_URL=op://my-vault/db/dev-url
GITHUB_PAT=op://my-vault/github/pat
Do not include OP_CONNECT_TOKEN in the template. It is securely exported via op read.