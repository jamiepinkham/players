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

WORKDIR /app

# Install Ruby deps
COPY rails/Gemfile rails/Gemfile.lock ./
RUN gem install bundler foreman && bundle install

# Install JS deps
COPY rails/package.json rails/yarn.lock ./
RUN yarn install

# Copy app source
COPY rails/ ./

# Ensure esbuild native binary is present
RUN node node_modules/esbuild/install.js

# Optional: confirm binary works
RUN node_modules/.bin/esbuild --version

# Conditionally precompile only in production
RUN if [ "$RAILS_ENV" = "production" ]; then bundle exec rails assets:precompile; fi

EXPOSE 3000

CMD ["foreman", "start", "-f", "Procfile"]
