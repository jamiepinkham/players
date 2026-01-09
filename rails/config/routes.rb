Rails.application.routes.draw do

  # Health check endpoints (before catch-all routes)
  get '/health', to: 'health#show'
  get '/healthz', to: 'health#show'
  get '/health/ready', to: 'health#ready'
  get '/health/live', to: 'health#live'

  mount RailsAdmin::Engine => '/admin', as: 'rails_admin'
  if Rails.env.development?
    mount GraphiQL::Rails::Engine, at: '/graphiql', graphql_path: '/graphql'
  end
  post '/graphql', to: 'graphql#execute'

  # Admin redirect - creates session from JWT auth
  get '/admin_login', to: 'admin_redirect#index'

  devise_for :users,
    defaults: { format: :json },
    controllers: {
      sessions: 'sessions',
      passwords: 'passwords',
    }

  # Custom user endpoints
  put '/users/username', to: 'usernames#update'

  root 'static#index'
  get '*path', to: 'static#index', constraints: lambda { |req|
    !req.path.match?(/\A\/(assets|images|packs|favicon\.ico|robots\.txt)/) &&
    !req.path.match?(/\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot|map)\z/)
  }
end
