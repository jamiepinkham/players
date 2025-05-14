### Installation
* install [brew](https://brew.sh)
* install [rbenv](https://github.com/rbenv/rbenv)
    * `rbenv install`
    * `gem install bundler` (no sudo!)
    * `bundle install`
* install [nvm](https://github.com/nvm-sh/nvm) 
    * `nvm install`
    * `yarn install`
* install postgres (brew install postgres)
    * `brew services start/stop/restart postgres`

### Running
* `foreman start -f Procfile.dev`

### Clone Heroku Database 
```
heroku pg:backups:capture --app bmpl-finances
heroku pg:backups:download --app bmpl-finances
pg_restore --verbose --clean --no-acl --no-owner -h localhost -d bmpl_finances latest.dump
```
