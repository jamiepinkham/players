## Assets 

FROM node:18-slim

# Install system dependencies (curl for Dart Sass)
RUN apt-get update && apt-get install -y curl

# ✅ Install Dart Sass
RUN curl -L https://github.com/sass/dart-sass/releases/download/1.70.0/dart-sass-1.70.0-linux-x64.tar.gz \
  | tar -xz -C /opt && ln -s /opt/dart-sass/sass /usr/local/bin/sass

# 🔒 Create a non-root user
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

# 🔒 Adjust permissions so non-root user can access everything
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

# End Assets

## Main Rails app

FROM ruby:3.1.2

RUN apt-get update -qq && apt-get install -y build-essential libpq-dev curl gnupg2 postgresql-client

# Get berglas
COPY --from=gcr.io/berglas/berglas:latest /bin/berglas /bin/berglas

# ✅ Install Node.js so ExecJS works
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs
RUN npm install -g yarn
RUN yarn install && \
    yarn global add esbuild

# 🔒 Create a non-root user
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

COPY rails/Gemfile rails/Gemfile.lock ./
RUN gem install bundler foreman && bundle install

# Copy the full app from rails/
COPY rails/ ./

# Set ownership and switch to non-root
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser


ENV DB_USERNAME_LINK bmpl-secrets/prod-db-username
ENV DB_PW_LINK bmpl-secrets/prod-db-password
ENV RAILS_MASTER_KEY_LINK bmpl-secrets/master.key

ENV PORT 3000
ENV RAILS_ENV "production"
ENV DB_HOST "/cloudsql/cellardoordotcom:us-central1:billy-db"

# Add a script to be executed every time the container starts. Fixes a glitch with the pids directory by removing the server.pid file on execute.
COPY web-entrypoint.sh /usr/local/bin/
#RUN chmod +x /bin/web-entrypoint.sh

EXPOSE 3000
# Run the web service on container startup.
CMD ["bash", "web-entrypoint.sh"]

