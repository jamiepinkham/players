FROM ruby:3.1.2

# Install system dependencies
RUN apt-get update -qq && \
    apt-get install -y build-essential libpq-dev curl gnupg2

# Install Node.js and Yarn
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g yarn

# Dart Sass for x86_64
RUN curl -L https://github.com/sass/dart-sass/releases/download/1.70.0/dart-sass-1.70.0-linux-x64.tar.gz \
  | tar -xz -C /opt && \
  ln -s /opt/dart-sass/sass /usr/local/bin/sass

# 🔒 Create non-root user and group
RUN groupadd --system appgroup && useradd --system --gid appgroup --create-home appuser

# Set working directory
WORKDIR /app

# Install Ruby deps (still as root)
COPY rails/Gemfile rails/Gemfile.lock ./
RUN gem install bundler foreman && bundle install

# Install JS deps
COPY rails/package.json rails/yarn.lock ./
RUN yarn install

# Copy application code
COPY rails/ ./

# Ensure esbuild binary is present
RUN node node_modules/esbuild/install.js

# Optional: confirm binary works
RUN node_modules/.bin/esbuild --version

# Fix permissions so appuser owns the app directory
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Conditionally precompile only in production (still allowed as non-root if app dir is writable)
RUN if [ "$RAILS_ENV" = "production" ]; then bundle exec rails assets:precompile; fi

EXPOSE 3000

# Use JSON CMD form
CMD ["foreman", "start", "-f", "Procfile"]
