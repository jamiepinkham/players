## Main Rails app
FROM ruby:3.3.7 AS web

RUN apt-get update -qq && apt-get install -y build-essential libpq-dev curl gnupg2 postgresql-client python3 python3-pip

# Install supercronic (cron for containers)
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "amd64" ]; then \
      SUPERCRONIC_URL=https://github.com/aptible/supercronic/releases/latest/download/supercronic-linux-amd64; \
    elif [ "$ARCH" = "arm64" ]; then \
      SUPERCRONIC_URL=https://github.com/aptible/supercronic/releases/latest/download/supercronic-linux-arm64; \
    fi && \
    curl -fsSLO "$SUPERCRONIC_URL" && \
    chmod +x "$(basename ${SUPERCRONIC_URL})" && \
    mv "$(basename ${SUPERCRONIC_URL})" "/usr/local/bin/supercronic"

# Install Dart Sass based on architecture
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "amd64" ]; then \
      curl -L https://github.com/sass/dart-sass/releases/download/1.70.0/dart-sass-1.70.0-linux-x64.tar.gz \
        | tar -xz -C /opt && ln -s /opt/dart-sass/sass /usr/local/bin/sass; \
    elif [ "$ARCH" = "arm64" ]; then \
      curl -L https://github.com/sass/dart-sass/releases/download/1.70.0/dart-sass-1.70.0-linux-arm64.tar.gz \
        | tar -xz -C /opt && ln -s /opt/dart-sass/sass /usr/local/bin/sass; \
    fi

# Install Node.js so ExecJS works
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs
RUN npm install -g yarn

# Create a non-root user with a home directory
RUN addgroup --system appgroup && adduser --system --ingroup appgroup --home /home/appuser appuser

WORKDIR /app

COPY rails/Gemfile rails/Gemfile.lock ./
RUN gem install bundler foreman && bundle install

# Install Python dependencies
COPY requirements.txt ./
RUN pip3 install --break-system-packages --root-user-action=ignore -r requirements.txt

# Copy the full app from rails/
COPY rails/ ./

# Copy crontab for scheduler sidecar
COPY config/crontab /app/config/crontab

# Set ownership and switch to non-root
RUN chown -R appuser:appgroup /app

# Copy entrypoint script
COPY web-entrypoint.sh /usr/local/bin/web-entrypoint.sh
RUN chmod +x /usr/local/bin/web-entrypoint.sh

# Switch to non-root user
USER appuser

# Set HOME environment variable
ENV HOME=/home/appuser

EXPOSE 3000

# Run the web service on container startup
CMD ["/usr/local/bin/web-entrypoint.sh"]

