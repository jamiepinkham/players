# Use a base image that supports both Ruby and Node (multi-stage not needed unless optimizing size)
FROM ruby:3.1.2

# Install system dependencies
RUN apt-get update -qq && \
    apt-get install -y build-essential libpq-dev curl gnupg2

# Install Node.js and Yarn from Debian packages (optional if you want precise versions)
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g yarn

# Install Dart Sass using architecture-aware release (see below)
RUN curl -L https://github.com/sass/dart-sass/releases/download/1.70.0/dart-sass-1.70.0-linux-arm64.tar.gz \
  | tar -xz -C /opt && \
  ln -s /opt/dart-sass/sass /usr/local/bin/sass

# Set working directory
WORKDIR /app

# Install Ruby and JS dependencies
COPY rails/Gemfile rails/Gemfile.lock ./
RUN gem install bundler foreman && bundle install

COPY rails/package.json rails/yarn.lock ./
RUN yarn install

# Copy the app
COPY rails/ ./

# Ensure esbuild binary is correct for platform
RUN node node_modules/esbuild/install.js

# Precompile assets (will skip if not in production)
RUN if [ "$RAILS_ENV" = "production" ]; then bundle exec rails assets:precompile; fi

EXPOSE 3000

CMD ["foreman", "start", "-f", "Procfile"]
