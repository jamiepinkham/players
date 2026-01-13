RailsAdmin.config do |config|
  config.asset_source = :sprockets

  ### Popular gems integration

  ## == Devise ==
  config.authenticate_with do
    # Authenticate user, will redirect to login if not signed in
    warden.authenticate! scope: :user
  end
  config.current_user_method(&:current_user)
  config.authorize_with do
    # Check if user is admin, redirect to root if not
    unless current_user&.is_admin?
      flash[:error] = 'You must be an administrator to access this section.'
      redirect_to main_app.root_path
    end
  end

  ## == CancanCan ==
  # config.authorize_with :cancancan

  ## == Pundit ==
  # config.authorize_with :pundit

  ## == PaperTrail ==
  # config.audit_with :paper_trail, 'User', 'PaperTrail::Version' # PaperTrail >= 3.0.0

  ### More at https://github.com/railsadminteam/rails_admin/wiki/Base-configuration

  ## == Gravatar integration ==
  ## To disable Gravatar integration in Navigation Bar set to false
  # config.show_gravatar = true

  config.actions do
    dashboard                     # mandatory
    index                         # mandatory
    new
    export
    bulk_delete
    show
    edit
    delete
    show_in_app

    ## With an audit adapter, you can add:
    # history_index
    # history_show
  end

  config.model 'Bid' do
    list do
      field :player
      field :team
      field :annual_amount
      field :is_active
      field :is_leading
      field :contract
      field :free_agency_period
      field :first_season
      field :last_season
      field :created_at
    end
    edit do
      field :player
      field :team
      field :annual_amount
      field :is_active
      field :is_leading
      field :free_agency_period
      field :first_season
      field :last_season
    end
  end

  config.model 'Contract' do
    list do
      field :team
      field :player
      field :active
      field :summer
      field :franchise
      field :first_season
      field :last_season
      field :winning_bid
    end
    edit do
      field :amount
      field :team
      field :player
      field :active
      field :summer
      field :franchise
      field :first_season
      field :last_season
      field :winning_bid
    end
  end

  config.model 'FreeAgencyPeriod' do
    list do
      field :season
      field :is_active
      field :max_bids_for_team
      field :max_contract_length
    end
    edit do
      field :season
      field :is_active
      field :max_bids_for_team
      field :max_contract_length
    end
  end

  config.model 'Player' do
    list do
      field :name
      field :bbrefid
      field :position
      field :bbref_minors
      field :bbref_stats
      field :contract
      field :leading_bid
      field :bbref_stats
    end
    edit do
      field :name
      field :bbrefid
      field :position
      field :bbref_minors
      field :bbref_stats
      field :contract
      field :leading_bid
      field :bbref_stats
    end
  end

  config.model 'Season' do
    list do
      field :name
      field :is_active
      field :is_finished
      field :free_agency_periods
      field :next_season
      field :previous_season
    end
    edit do 
      field :name
      field :is_active
      field :is_finished
      field :free_agency_periods
      field :next_season
      field :previous_season
    end
  end

  config.model 'Team' do
    list do
      field :name
      field :budget
      field :user do
        label "Owner"
      end
    end
    edit do
      field :name
      field :budget
      field :stadium
      field :user do
        label "Owner"
      end
      field :team_emails do
        label "Notification Emails"
        help "Add email addresses for trade notifications"
      end
      field :contracts
      field :bids
    end
  end

  config.model 'TeamEmail' do
    list do
      field :team
      field :email
      field :primary
      field :receive_trade_notifications
      field :created_at
    end
    edit do
      field :team
      field :email do
        help "Email address for notifications"
      end
      field :primary do
        help "Mark as the primary contact email"
      end
      field :receive_trade_notifications do
        label "Receive Trade Notifications"
        help "Should this email receive trade proposal notifications?"
      end
    end
  end

  config.model 'Trade' do
    list do
      field :from_team
      field :to_team
      field :from_contracts
      field :to_contracts
      field :from_cash_amount
      field :to_cash_amount
      field :status
    end
    edit do 
      field :from_team
      field :to_team
      field :from_contracts
      field :to_contracts
      field :from_cash_amount
      field :to_cash_amount
      field :status
    end
  end

  config.model 'User' do
    list do
      field :name
      field :username
      field :team
      field :is_admin
    end
    edit do
      field :name
      field :username do
        help "Username for authentication (3-50 characters, letters, numbers, underscores, periods)"
      end
      field :password do
        help "Leave blank to keep current password"
      end
      field :team
      field :is_admin
    end
  end

  config.excluded_models << JwtDenylist

end
