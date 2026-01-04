## Assets Stage
FROM node:18-slim AS assets

# Install system dependencies (curl for Dart Sass)
RUN apt-get update && apt-get install -y curl

# Install Dart Sass
RUN curl -L https://github.com/sass/dart-sass/releases/download/1.70.0/dart-sass-1.70.0-linux-x64.tar.gz \
  | tar -xz -C /opt && ln -s /opt/dart-sass/sass /usr/local/bin/sass

# Create a non-root user
RUN groupadd --system appgroup && useradd --system --gid appgroup --create-home appuser

# Set working directory
WORKDIR /app

# Copy package files and install deps as root
COPY rails/package.json rails/yarn.lock ./
RUN yarn install && \
    yarn global add esbuild && \
    yarn global add @parcel/watcher-linux-x64-glibc

# Copy rest of the app
COPY rails/ ./

# Adjust permissions so non-root user can access everything
RUN chown -R appuser:appgroup /app

# Make sure yarn binaries are available in PATH
ENV PATH="./node_modules/.bin:$PATH"

# Copy script as root
COPY assets_entrypoint.sh /usr/local/bin/entrypoint.sh

# Set ownership and permissions: only appuser can read/execute
RUN chown appuser:appgroup /usr/local/bin/entrypoint.sh && \
    chmod 500 /usr/local/bin/entrypoint.sh

USER appuser

# Use JSON form of CMD for proper signal handling
CMD ["/usr/local/bin/entrypoint.sh"]

## Main Rails app
FROM ruby:3.1.2 AS web

RUN apt-get update -qq && apt-get install -y build-essential libpq-dev curl gnupg2 postgresql-client

# Install Node.js so ExecJS works
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs
RUN npm install -g yarn

# Create a non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

COPY rails/Gemfile rails/Gemfile.lock ./
RUN gem install bundler foreman && bundle install

# Copy the full app from rails/
COPY rails/ ./

# Set ownership and switch to non-root
RUN chown -R appuser:appgroup /app

# Copy entrypoint script
COPY web-entrypoint.sh /usr/local/bin/web-entrypoint.sh
RUN chmod +x /usr/local/bin/web-entrypoint.sh

# Switch to non-root user
USER appuser

EXPOSE 3000

# Run the web service on container startup
CMD ["/usr/local/bin/web-entrypoint.sh"]

