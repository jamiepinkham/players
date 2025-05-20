Rails.application.routes.draw do
  
  mount RailsAdmin::Engine => '/admin', as: 'rails_admin'
  if Rails.env.development?
    mount GraphiQL::Rails::Engine, at: '/graphiql', graphql_path: '/graphql'
  end
  post '/graphql', to: 'graphql#execute'
  
  devise_for :users,
    defaults: { format: :json },
    controllers: {
      sessions: 'sessions',
      passwords: 'passwords',
    }
  
  root 'static#index'
  get '*path', to: 'static#index', constraints: lambda { |req|
    !req.path.start_with?('/assets', '/images', '/packs')
  }
end
