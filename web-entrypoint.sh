# !/bin/bash
set -e

# Environment setup
# This is where you define the environmental variables you will access from your app
export RAILS_MASTER_KEY=$(berglas access $RAILS_MASTER_KEY_LINK)
export PROD_DB_USERNAME=$(berglas access $DB_USERNAME_LINK)
export PROD_DB_PASSWORD=$(berglas access $DB_PW_LINK)

# Run deploy tasks in warmup mode. 
# These will be passed as environmental variables in the build step
#if [ "$WARMUP_DEPLOY" == "true" ]; then
#  # The traditional Rails migration. 
#  # As you deploy new versions, this will update the DB. 
#  echo "Warmup deploy: running migrations..."
#  bundle exec rake db:migrate
#  echo "Warmup deploy: migrations done"
#fi


# Precompile assets (can be skipped for an API)
RAILS_ENV=production bundle exec rails assets:precompile

# Start Puma
bundle exec puma -p 8080