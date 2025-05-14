FROM ruby:3.1.2

# Install system packages
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian stable main" | tee /etc/apt/sources.list.d/yarn.list && \
    apt-get update -qq && \
    apt-get install -y build-essential libpq-dev nodejs yarn

WORKDIR /app

# Install bundler and foreman
RUN gem install bundler foreman

# Copy Ruby dependency files and install gems
COPY Gemfile Gemfile.lock ./
RUN bundle install

COPY package.json yarn.lock ./
RUN yarn install

# Copy the full app
COPY . .

RUN bundle exec rails assets:precompile

EXPOSE 3000

CMD ["foreman", "start", "-f", "Procfile"]
