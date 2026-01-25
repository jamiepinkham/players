FROM players-players:latest

# Install cron
RUN apt-get update && apt-get install -y cron postgresql-client && rm -rf /var/lib/apt/lists/*

# Copy maintenance script
COPY docker/cron/maintenance.sh /usr/local/bin/maintenance.sh
RUN chmod +x /usr/local/bin/maintenance.sh

# Create crontab file
RUN echo "0 0 * * * /usr/local/bin/maintenance.sh >> /var/log/cron.log 2>&1" > /etc/cron.d/maintenance-cron
RUN chmod 0644 /etc/cron.d/maintenance-cron
RUN crontab /etc/cron.d/maintenance-cron

# Create log file
RUN touch /var/log/cron.log

# Start cron in foreground
CMD cron && tail -f /var/log/cron.log
