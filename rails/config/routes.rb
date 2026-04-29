Rails.application.routes.draw do

  # Health check endpoints (before catch-all routes)
  get '/health', to: 'health#show'
  get '/healthz', to: 'health#show'
  get '/health/ready', to: 'health#ready'
  get '/health/live', to: 'health#live'

  mount RailsAdmin::Engine => '/admin', as: 'rails_admin'
  if Rails.env.development? && defined?(GraphiQL::Rails)
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
  get '/users/validate', to: 'users/validations#show'

  # API endpoints
  namespace :api do
    get 'player_images/:bbrefid', to: 'player_images#show'

    # Commissioner Dashboard API
    get 'commissioner', to: 'commissioner_dashboard#index'
    get 'commissioner/seasons', to: 'commissioner_dashboard#all_seasons'
    post 'commissioner/seasons', to: 'commissioner_dashboard#create_season'
    patch 'commissioner/seasons/:id', to: 'commissioner_dashboard#update_season'
    get 'commissioner/teams', to: 'commissioner_dashboard#all_teams'
    post 'commissioner/teams', to: 'commissioner_dashboard#create_team'
    patch 'commissioner/teams/:id', to: 'commissioner_dashboard#update_team'
    delete 'commissioner/teams/:id', to: 'commissioner_dashboard#delete_team'
    get 'commissioner/users', to: 'commissioner_dashboard#all_users'
    post 'commissioner/users', to: 'commissioner_dashboard#create_user'
    patch 'commissioner/users/:id', to: 'commissioner_dashboard#update_user'
    delete 'commissioner/users/:id', to: 'commissioner_dashboard#delete_user'
    get 'commissioner/season', to: 'commissioner_dashboard#season_status'
    get 'commissioner/free_agents/preview', to: 'commissioner_dashboard#preview_free_agent_recalculation'
    post 'commissioner/free_agents/recalculate', to: 'commissioner_dashboard#recalculate_free_agents'
    get 'commissioner/free_agents', to: 'commissioner_dashboard#free_agents_list'
    patch 'commissioner/free_agents/:id', to: 'commissioner_dashboard#update_free_agent'
    get 'commissioner/players/:id', to: 'commissioner_dashboard#show_player'
    patch 'commissioner/players/:id', to: 'commissioner_dashboard#update_player'
    get 'commissioner/trades', to: 'commissioner_dashboard#all_trades'
    get 'commissioner/trades/pending', to: 'commissioner_dashboard#pending_trades'
    post 'commissioner/trades/:id/approve', to: 'commissioner_dashboard#approve_trade'
    post 'commissioner/trades/:id/reject', to: 'commissioner_dashboard#reject_trade'
    get 'commissioner/bids', to: 'commissioner_dashboard#active_bids'
    patch 'commissioner/bids/:id', to: 'commissioner_dashboard#update_bid'
    delete 'commissioner/bids/:id', to: 'commissioner_dashboard#delete_bid'
    get 'commissioner/contracts', to: 'commissioner_dashboard#all_contracts'
    patch 'commissioner/contracts/:id', to: 'commissioner_dashboard#update_contract'
    delete 'commissioner/contracts/:id', to: 'commissioner_dashboard#delete_contract'
    get 'commissioner/preview/convert_bids', to: 'commissioner_dashboard#preview_convert_bids'
    post 'commissioner/convert_bids', to: 'commissioner_dashboard#convert_bids'
    get 'commissioner/preview/season_switch', to: 'commissioner_dashboard#preview_season_switch'
  end

  root 'static#index'
  get '*path', to: 'static#index', constraints: lambda { |req|
    !req.path.match?(/\A\/(assets|images|packs|favicon\.ico|robots\.txt)/) &&
    !req.path.match?(/\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot|map)\z/)
  }
end
