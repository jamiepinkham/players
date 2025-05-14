FROM ruby:3.1.2-slim

# Set working directory
WORKDIR /app

# Install system packages
RUN apt-get update -qq && \
    apt-get install -y build-essential libpq-dev curl gnupg2

# Install Node.js and Yarn
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update -qq && \
    apt-get install -y nodejs yarn

# Install Dart Sass (no @parcel/watcher dependency)
RUN curl -L https://github.com/sass/dart-sass/releases/download/1.70.0/dart-sass-1.70.0-linux-x64.tar.gz \
  | tar -xz -C /opt && \
  ln -s /opt/dart-sass/sass /usr/local/bin/sass


# Install Ruby and JS dependencies in separate steps to leverage Docker caching
COPY rails/Gemfile rails/Gemfile.lock ./
RUN gem install bundler foreman && bundle install

COPY rails/package.json rails/yarn.lock ./
RUN yarn install

RUN ls -l node_modules/.bin/esbuild && node_modules/.bin/esbuild --version

# Copy the rest of the app
COPY rails/ ./

# Force correct esbuild binary just in case
RUN node node_modules/esbuild/install.js

# Precompile assets
RUN if [ "$RAILS_ENV" = "production" ]; then bundle exec rails assets:precompile; fi

# Expose port for Rails server
EXPOSE 3000

# Start the app using foreman
CMD ["foreman", "start", "-f", "Procfile"]
