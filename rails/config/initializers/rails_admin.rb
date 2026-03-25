# Rails 8/Zeitwerk will autoload these from lib/
# Manual requires cause Zeitwerk::NameError
# require 'rails_admin/import_summer_draft'
# require 'rails_admin/deactivate_contracts'
# require 'rails_admin/reset_user_password'

# Ensure classes are loaded before registering
require Rails.root.join('lib', 'rails_admin', 'import_summer_draft')
require Rails.root.join('lib', 'rails_admin', 'deactivate_contracts')
require Rails.root.join('lib', 'rails_admin', 'reset_user_password')

RailsAdmin::Config::Actions.register(RailsAdmin::Config::Actions::ImportSummerDraft)
RailsAdmin::Config::Actions.register(RailsAdmin::Config::Actions::DeactivateContracts)
RailsAdmin::Config::Actions.register(RailsAdmin::Config::Actions::ResetUserPassword)

RailsAdmin.config do |config|
  config.asset_source = :sprockets

  ## Custom navigation links
  config.navigation_static_links = {
    'Back to Main Site' => '/teams'
  }

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

    ## Custom import actions
    import_summer_draft
    deactivate_contracts

    ## Custom member actions
    reset_user_password

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
      field :player do
        associated_collection_cache_all false
        help 'Type to search for players'
      end
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
      field :player do
        associated_collection_cache_all false
        help 'Type to search for players'
      end
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
      field :positions do
        pretty_value do
          value.join(', ') if value.present?
        end
      end
      field :is_free_agent do
        label "Free Agent"
        help "Player has no active contract"
      end
      field :bbref_minors
      field :contract
      field :leading_bid
    end
    edit do
      field :name
      field :bbrefid
      field :positions, :enum do
        label "Eligible Positions"
        help "Select all positions the player is eligible for (multiple selections allowed)"
        multiple true
        enum do
          Player::POSITIONS
        end
      end
      field :bbref_minors
      field :is_free_agent do
        label "Free Agent Status"
        help "Normally auto-maintained by system. Cannot be true if player has active contract (validation will prevent saving)."
      end
    end
  end

  config.model 'Season' do
    list do
      field :name
      field :is_active
      field :is_finished
      field :target_stat_year do
        label "Target Stat Year"
        help "Year of stats required for eligibility (e.g., BMPL 2026 needs 2025 stats)"
      end
      field :free_agency_periods
      field :next_season
      field :previous_season
    end
    edit do
      field :name
      field :is_active
      field :is_finished
      field :target_stat_year do
        label "Target Stat Year"
        help "Year of stats required for eligibility (e.g., BMPL 2026 needs 2025 stats)"
      end
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
  config.excluded_models << ContractTrade
  config.excluded_models << TeamEmail

end
