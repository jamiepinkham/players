class Api::CommissionerDashboardController < ApplicationController
  include ActionView::Helpers::NumberHelper
  include ActionView::Helpers::DateHelper

  skip_before_action :verify_authenticity_token
  before_action :authenticate_user_from_jwt!
  before_action :require_admin!

  # GET /api/fa_dashboard
  def index
    render json: {
      season: season_data,
      freeAgents: free_agent_data,
      trades: trades_data,
      statsApi: stats_api_data
    }
  end

  # POST /api/commissioner/seasons
  def create_season
    season_params = params.require(:season).permit(
      :name,
      :target_stat_year,
      :start_date,
      :end_date,
      :is_active,
      :next_season_id,
      :previous_season_id
    )

    season = Season.new(season_params)

    if season.save
      render json: {
        success: true,
        season: {
          id: season.id,
          name: season.name,
          target_stat_year: season.target_stat_year,
          start_date: season.start_date&.strftime('%b %d, %Y'),
          end_date: season.end_date&.strftime('%b %d, %Y'),
          is_active: season.is_active
        }
      }
    else
      render json: {
        success: false,
        error: season.errors.full_messages.join(', ')
      }, status: :unprocessable_entity
    end
  end

  # PATCH /api/commissioner/seasons/:id
  def update_season
    season = Season.find(params[:id])
    season_params = params.require(:season).permit(
      :name,
      :target_stat_year,
      :start_date,
      :end_date,
      :is_active,
      :next_season_id,
      :previous_season_id
    )

    if season.update(season_params)
      render json: {
        success: true,
        season: {
          id: season.id,
          name: season.name,
          target_stat_year: season.target_stat_year,
          start_date: season.start_date&.strftime('%b %d, %Y'),
          end_date: season.end_date&.strftime('%b %d, %Y'),
          is_active: season.is_active,
          next_season_id: season.next_season_id,
          previous_season_id: season.previous_season_id
        }
      }
    else
      render json: {
        success: false,
        error: season.errors.full_messages.join(', ')
      }, status: :unprocessable_entity
    end
  end

  # GET /api/commissioner/seasons
  def all_seasons
    seasons = Season.includes(:next_season, :previous_season, :free_agency_periods)
      .order(start_date: :desc)
      .map do |season|
        {
          id: season.id,
          name: season.name,
          target_stat_year: season.target_stat_year,
          start_date: season.start_date&.strftime('%b %d, %Y'),
          end_date: season.end_date&.strftime('%b %d, %Y'),
          is_active: season.is_active,
          next_season_name: season.next_season&.name,
          next_season_id: season.next_season_id,
          previous_season_name: season.previous_season&.name,
          free_agency_active: season.active_free_agency_period.present?,
          contracts_count: Contract.where(active: true)
            .where('first_season_id <= ?', season.id)
            .where('last_season_id >= ?', season.id)
            .count,
          free_agency_periods: season.free_agency_periods.order(created_at: :desc).map do |period|
            {
              id: period.id,
              max_bids: period.max_bids_for_team,
              is_active: period == season.active_free_agency_period
            }
          end
        }
      end

    render json: { seasons: seasons }
  end

  # GET /api/commissioner/teams
  def all_teams
    teams = Team.includes(:user).order(:name).map do |team|
      {
        id: team.id,
        name: team.name,
        budget: team.budget,
        stadium: team.stadium,
        comment: team.comment,
        owner_username: team.user&.username,
        owner_id: team.user&.id,
        current_payroll: team.current_payroll,
        available_cash: team.available_cash,
        total_players: team.total_players
      }
    end

    render json: { teams: teams }
  end

  # POST /api/commissioner/teams
  def create_team
    team = Team.new(team_params)

    if team.save
      render json: { success: true, team: team_response(team) }
    else
      render json: { error: team.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  # PATCH /api/commissioner/teams/:id
  def update_team
    team = Team.find(params[:id])

    if team.update(team_params)
      render json: { success: true, team: team_response(team) }
    else
      render json: { error: team.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  # DELETE /api/commissioner/teams/:id
  def delete_team
    team = Team.find(params[:id])

    # Validate team can be deleted
    if team.user.present?
      render json: { error: "Cannot delete team. Team has an associated user (#{team.user.username}). Please reassign or delete the user first." }, status: :unprocessable_entity
      return
    end

    if team.contracts.where(active: true).exists?
      render json: { error: "Cannot delete team. Team has #{team.contracts.where(active: true).count} active contracts." }, status: :unprocessable_entity
      return
    end

    team.destroy
    render json: { success: true }
  end

  # GET /api/commissioner/users
  def all_users
    users = User.includes(:team).order(:username).map do |user|
      {
        id: user.id,
        username: user.username,
        name: user.name,
        team_id: user.team_id,
        team_name: user.team&.name,
        is_admin: user.is_admin,
        last_sign_in_at: user.last_sign_in_at,
        sign_in_count: user.sign_in_count
      }
    end

    render json: { users: users }
  end

  # POST /api/commissioner/users
  def create_user
    user = User.new(user_create_params)

    if user.save
      render json: { success: true, user: user_response(user) }
    else
      render json: { error: user.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  # PATCH /api/commissioner/users/:id
  def update_user
    user = User.find(params[:id])

    if user.update(user_update_params)
      render json: { success: true, user: user_response(user) }
    else
      render json: { error: user.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  # DELETE /api/commissioner/users/:id
  def delete_user
    user = User.find(params[:id])
    current = current_user_from_jwt

    # Prevent self-deletion
    if current&.id == user.id
      render json: { error: 'You cannot delete your own account' }, status: :unprocessable_entity
      return
    end

    # Prevent deleting last admin
    if user.is_admin && User.where(is_admin: true).count <= 1
      render json: { error: 'Cannot delete the last admin user' }, status: :unprocessable_entity
      return
    end

    user.destroy
    render json: { success: true }
  end

  # GET /api/fa_dashboard/season
  def season_status
    current_season = Season.current

    render json: {
      current: season_overview(current_season),
      expiring: expiring_contracts_data(current_season),
      next: current_season.next_season ? season_overview(current_season.next_season) : nil
    }
  end

  # GET /api/commissioner/free_agents/preview
  def preview_free_agent_recalculation
    current_season = Season.current
    unless current_season&.target_stat_year
      render json: { error: "Current season has no target_stat_year configured" }, status: :unprocessable_entity
      return
    end

    issues = []

    # Quick check: Find players marked as FA but have contracts (clear error)
    Player.includes(:contract).where(is_free_agent: true).find_each do |player|
      if player.contract.present?
        issues << {
          player_id: player.id,
          name: player.name,
          issue: "Marked as FA but has contract with #{player.contract.team.name}",
          severity: 'error'
        }
      end
    end

    render json: {
      issues: issues,
      summary: {
        errors: issues.count { |i| i[:severity] == 'error' },
        warnings: issues.count { |i| i[:severity] == 'warning' }
      },
      note: "Preview shows obvious issues only. Run recalculation to see full details and changes."
    }
  end

  # POST /api/fa_dashboard/free_agents/recalculate
  def recalculate_free_agents
    # This will run the same logic as the rake task
    current_season = Season.current
    unless current_season&.target_stat_year
      render json: { error: "Current season has no target_stat_year configured" }, status: :unprocessable_entity
      return
    end

    before_count = Player.where(is_free_agent: true).count
    updated = 0
    changes = []

    Player.find_each do |player|
      old_status = player.is_free_agent

      # New status: free agent if no active contract AND has stats
      if player.contract.present?
        new_status = false
      elsif Player.has_stats_in_pybaseball?(player.bbrefid, current_season.target_stat_year, player.positions)
        new_status = true
      else
        new_status = false
      end

      if old_status != new_status
        player.update_column(:is_free_agent, new_status)
        updated += 1

        reason = if player.contract.present?
          'removed from FA (has contract)'
        elsif new_status
          'set to FA (no contract, has stats)'
        else
          'removed from FA (no stats)'
        end

        changes << {
          player_id: player.id,
          name: player.name,
          old_status: old_status,
          new_status: new_status,
          reason: reason
        }
      end
    end

    after_count = Player.where(is_free_agent: true).count

    render json: {
      success: true,
      before_count: before_count,
      after_count: after_count,
      updated: updated,
      changes: changes
    }
  end

  # GET /api/fa_dashboard/free_agents
  def free_agents_list
    current_season = Season.current

    # Eager load all associations to avoid N+1 queries
    players = Player.includes(contracts: [:team, :last_season, :first_season]).all.map do |player|
      # Find the current active contract manually (scoped associations don't work well with includes)
      current_contract = player.contracts.find do |c|
        c.active &&
        c.first_season_id <= current_season&.id &&
        c.last_season_id >= current_season&.id
      end

      # Determine if contract is expiring
      is_expiring = current_contract.present? &&
                   current_contract.active &&
                   current_contract.last_season_id == current_season&.id

      status = if is_expiring
        'expiring'
      elsif current_contract.present?
        'under_contract'
      elsif player.is_free_agent
        'free_agent'
      else
        'ineligible'
      end

      reasons = []

      if current_contract.present?
        if is_expiring
          reasons << "Contract expires after #{current_contract.last_season.name}"
          reasons << "Will enter free agency for #{current_season.next_season&.name || 'next season'}"
        else
          reasons << "Active contract with #{current_contract.team.name} through #{current_contract.last_season.name}"
        end
      else
        reasons << "No contract"
      end

      # Don't check stats in real-time - rely on is_free_agent flag which is set by recalculation
      # This avoids making external API calls for every player on every page load
      if player.is_free_agent
        reasons << "Eligible free agent (has stats)"
      elsif status == 'ineligible'
        reasons << "Not eligible (no stats or no contract)"
      end

      {
        id: player.id,
        name: player.name,
        positions: player.positions,
        bbrefid: player.bbrefid,
        status: status,
        reasons: reasons,
        is_free_agent: player.is_free_agent
      }
    end

    render json: {
      players: players,
      counts: {
        free_agents: players.count { |p| p[:status] == 'free_agent' },
        under_contract: players.count { |p| p[:status] == 'under_contract' },
        ineligible: players.count { |p| p[:status] == 'ineligible' },
        expiring: players.count { |p| p[:status] == 'expiring' }
      }
    }
  end

  # PATCH /api/fa_dashboard/free_agents/:id
  def update_free_agent
    player = Player.find(params[:id])

    if player.update(is_free_agent: params[:is_free_agent])
      render json: { success: true, is_free_agent: player.is_free_agent }
    else
      render json: { error: player.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  # GET /api/commissioner/players/:id
  def show_player
    player = Player.includes(contracts: [:team, :first_season, :last_season]).find(params[:id])

    player_data = {
      id: player.id,
      name: player.name,
      bbrefid: player.bbrefid,
      positions: player.positions,
      is_free_agent: player.is_free_agent,
      contracts: player.contracts.order(first_season_id: :desc).map do |contract|
        {
          id: contract.id,
          team_name: contract.team.name,
          team_id: contract.team_id,
          amount: contract.amount,
          first_season: contract.first_season&.name,
          first_season_id: contract.first_season_id,
          last_season: contract.last_season&.name,
          last_season_id: contract.last_season_id,
          active: contract.active,
          summer: contract.summer,
          franchise: contract.franchise
        }
      end
    }

    render json: player_data
  end

  # PATCH /api/commissioner/players/:id
  def update_player
    player = Player.includes(:contracts).find(params[:id])

    ActiveRecord::Base.transaction do
      # Update player attributes
      player_params = params.permit(:name, :bbrefid, :is_free_agent, positions: [])

      unless player.update(player_params)
        render json: { error: player.errors.full_messages.join(', ') }, status: :unprocessable_entity
        raise ActiveRecord::Rollback
        return
      end

      # Update contracts if present
      if params[:contracts].present?
        # Get existing contract IDs from the request
        contract_ids_in_request = params[:contracts].map { |c| c[:id] }.compact

        # Delete contracts that are not in the request (user deleted them)
        player.contracts.where.not(id: contract_ids_in_request).destroy_all

        # Update existing contracts
        params[:contracts].each do |contract_params|
          next unless contract_params[:id].present?

          contract = player.contracts.find_by(id: contract_params[:id])
          next unless contract

          update_params = contract_params.permit(:amount, :first_season, :last_season, :active, :summer, :franchise)

          # Convert season names to IDs
          if update_params[:first_season].present?
            season = Season.find_by(name: update_params[:first_season])
            update_params[:first_season_id] = season&.id if season
            update_params.delete(:first_season)
          end

          if update_params[:last_season].present?
            season = Season.find_by(name: update_params[:last_season])
            update_params[:last_season_id] = season&.id if season
            update_params.delete(:last_season)
          end

          unless contract.update(update_params)
            render json: { error: "Contract update failed: #{contract.errors.full_messages.join(', ')}" }, status: :unprocessable_entity
            raise ActiveRecord::Rollback
            return
          end
        end
      end

      # Reload to get updated associations
      player.reload

      render json: { success: true, player: player_data_for_response(player) }
    end
  end

  # GET /api/fa_dashboard/trades/pending
  def pending_trades
    # Eager load all associations to avoid N+1 queries
    trades = Trade.pending.includes(:from_team, :to_team, contracts: [:player, :team, :last_season]).map do |trade|
      {
        id: trade.id,
        fromTeam: trade.from_team.name,
        toTeam: trade.to_team.name,
        fromContracts: trade.from_contracts.map { |c| contract_summary(c) },
        toContracts: trade.to_contracts.map { |c| contract_summary(c) },
        fromCash: trade.from_cash_amount,
        toCash: trade.to_cash_amount,
        createdAt: trade.created_at,
        timeAgo: time_ago_in_words(trade.created_at),
        summary: trade_summary(trade)
      }
    end

    render json: { trades: trades }
  end

  # GET /api/fa_dashboard/trades
  def all_trades
    # Eager load all associations to avoid N+1 queries
    trades = Trade.includes(:from_team, :to_team, contracts: [:player, :team, :last_season])
      .order(created_at: :desc)
      .map do |trade|
        {
          id: trade.id,
          fromTeam: trade.from_team.name,
          toTeam: trade.to_team.name,
          fromContracts: trade.from_contracts.map { |c| contract_summary(c) },
          toContracts: trade.to_contracts.map { |c| contract_summary(c) },
          fromCash: trade.from_cash_amount,
          toCash: trade.to_cash_amount,
          status: trade.status,
          createdAt: trade.created_at,
          updatedAt: trade.updated_at,
          timeAgo: time_ago_in_words(trade.created_at),
          summary: trade_summary(trade)
        }
      end

    render json: { trades: trades }
  end

  # POST /api/fa_dashboard/trades/:id/approve
  def approve_trade
    trade = Trade.find(params[:id])

    begin
      trade.accept!
      render json: { success: true, trade: trade_detail(trade) }
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  # POST /api/fa_dashboard/trades/:id/reject
  def reject_trade
    Rails.logger.info "reject_trade called for trade #{params[:id]} by user #{current_user_from_jwt&.id}"
    trade = Trade.find(params[:id])

    begin
      trade.reject!
      Rails.logger.info "Trade #{trade.id} rejected successfully"
      render json: { success: true, trade: trade_detail(trade) }
    rescue => e
      Rails.logger.error "Failed to reject trade #{params[:id]}: #{e.message}"
      render json: { error: e.message }, status: :unprocessable_entity
    end
  end

  # GET /api/commissioner/bids
  def active_bids
    # Allow querying by specific free agency period or default to current active period
    if params[:fa_period_id].present?
      fa_period = FreeAgencyPeriod.find_by(id: params[:fa_period_id])
    else
      current_season = Season.current
      fa_period = current_season&.active_free_agency_period
    end

    unless fa_period
      # Return available periods for selection
      periods = FreeAgencyPeriod.includes(:season).order('seasons.start_date DESC, free_agency_periods.created_at DESC')
        .map do |period|
          {
            id: period.id,
            season_id: period.season_id,
            season_name: period.season.name,
            max_bids: period.max_bids_for_team,
            is_active: period == period.season.active_free_agency_period
          }
        end

      render json: {
        bids: [],
        message: "No active free agency period",
        available_periods: periods,
        total_count: 0,
        leading_count: 0
      }
      return
    end

    # Get ALL bids (active and inactive) for this period
    all_bids = Bid.where(free_agency_period_id: fa_period.id)
      .includes(:player, team: :contracts, first_season: nil, last_season: nil)
      .order(created_at: :desc)

    # Group bids by player to count competing bids (only count active ones)
    active_bids = all_bids.select(&:is_active)
    bids_by_player = active_bids.group_by(&:player_id)

    bids = all_bids.map do |bid|
      team = bid.team
      competing_bids = bids_by_player[bid.player_id]&.length || 0
      team_active_bid_count = active_bids.count { |b| b.team_id == bid.team_id }

      # Check if this bid converted to a contract
      # A bid is converted if it's inactive and there's a matching active contract
      converted_to_contract = false
      if !bid.is_active
        # Allow small differences in amount due to floating point precision
        matching_contracts = Contract.where(
          player_id: bid.player_id,
          team_id: bid.team_id,
          first_season_id: bid.first_season_id,
          last_season_id: bid.last_season_id,
          active: true
        )

        # Check if any contract amount is within $1 of the bid amount
        converted_to_contract = matching_contracts.any? { |c| (c.amount - bid.annual_amount).abs < 1 }
      end

      # Determine bid status
      status = if converted_to_contract
        'converted'
      elsif !bid.is_active
        'inactive'
      elsif bid.is_leading
        'leading'
      elsif bid.is_active && !bid.is_leading
        'active'  # Bid placed but not yet processed
      else
        'outbid'
      end

      {
        id: bid.id,
        player_name: bid.player.name,
        player_id: bid.player.id,
        player_positions: bid.player.positions,
        team_name: team.name,
        team_id: team.id,
        team_budget: team.budget,
        team_available_cash: team.available_cash,
        team_current_bids: team_active_bid_count,
        annual_amount: bid.annual_amount,
        total_amount: bid.total_amount,
        contract_length: bid.contract_length,
        first_season: bid.first_season&.name,
        last_season: bid.last_season&.name,
        is_active: bid.is_active,
        is_leading: bid.is_leading,
        status: status,
        competing_bids_count: competing_bids,
        created_at: bid.created_at,
        time_ago: time_ago_in_words(bid.created_at)
      }
    end

    # Get all available periods for selection
    available_periods = FreeAgencyPeriod.includes(:season)
      .order('seasons.start_date DESC, free_agency_periods.created_at DESC')
      .map do |period|
        {
          id: period.id,
          season_id: period.season_id,
          season_name: period.season.name,
          max_bids: period.max_bids_for_team,
          is_active: period == period.season.active_free_agency_period
        }
      end

    render json: {
      bids: bids,
      total_count: bids.length,
      active_count: bids.count { |b| b[:status] == 'active' },
      leading_count: bids.count { |b| b[:status] == 'leading' },
      outbid_count: bids.count { |b| b[:status] == 'outbid' },
      inactive_count: bids.count { |b| b[:status] == 'inactive' },
      converted_count: bids.count { |b| b[:status] == 'converted' },
      fa_period: {
        id: fa_period.id,
        season: fa_period.season.name,
        season_id: fa_period.season_id,
        max_bids: fa_period.max_bids_for_team
      },
      available_periods: available_periods
    }
  end

  # PATCH /api/commissioner/bids/:id
  def update_bid
    bid = Bid.find(params[:id])

    if bid.update(bid_params)
      render json: { success: true, message: 'Bid updated successfully' }
    else
      render json: { error: bid.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  # DELETE /api/commissioner/bids/:id
  def delete_bid
    bid = Bid.find(params[:id])

    if bid.destroy
      render json: { success: true, message: 'Bid deleted successfully' }
    else
      render json: { error: 'Failed to delete bid' }, status: :unprocessable_entity
    end
  end

  # GET /api/commissioner/contracts
  def all_contracts
    contracts = Contract.includes(:team, :player, :first_season, :last_season)
      .order('teams.name ASC, players.name ASC')
      .map do |contract|
        {
          id: contract.id,
          team_id: contract.team_id,
          team_name: contract.team&.name,
          player_id: contract.player_id,
          player_name: contract.player&.name,
          amount: contract.amount,
          first_season_id: contract.first_season_id,
          first_season_name: contract.first_season&.name,
          last_season_id: contract.last_season_id,
          last_season_name: contract.last_season&.name,
          summer: contract.summer,
          franchise: contract.franchise,
          active: contract.active
        }
      end

    render json: { contracts: contracts }
  end

  # PATCH /api/commissioner/contracts/:id
  def update_contract
    contract = Contract.find(params[:id])

    if contract.update(contract_params)
      render json: { success: true, message: 'Contract updated successfully' }
    else
      render json: { error: contract.errors.full_messages.join(', ') }, status: :unprocessable_entity
    end
  end

  # DELETE /api/commissioner/contracts/:id
  def delete_contract
    contract = Contract.find(params[:id])

    if contract.destroy
      render json: { success: true, message: 'Contract deleted successfully' }
    else
      render json: { error: 'Failed to delete contract' }, status: :unprocessable_entity
    end
  end

  # GET /api/commissioner/preview/convert_bids
  def preview_convert_bids
    require 'stringio'
    require 'rake'

    Rails.application.load_tasks unless Rake::Task.task_defined?('convert_bids:preview')

    output = StringIO.new
    original_stdout = $stdout
    $stdout = output

    begin
      Rake::Task['convert_bids:preview'].reenable
      Rake::Task['convert_bids:preview'].invoke
    ensure
      $stdout = original_stdout
    end

    render json: { output: output.string }
  rescue => e
    render json: { error: e.message, backtrace: e.backtrace.first(5) }, status: :internal_server_error
  end

  # POST /api/commissioner/convert_bids
  def convert_bids
    require 'stringio'
    require 'rake'

    Rails.application.load_tasks unless Rake::Task.task_defined?('convert_bids:convert_leading')

    output = StringIO.new
    original_stdout = $stdout
    $stdout = output

    begin
      Rake::Task['convert_bids:convert_leading'].reenable
      Rake::Task['convert_bids:convert_leading'].invoke

      render json: {
        success: true,
        output: output.string,
        message: "Bids successfully converted to contracts"
      }
    rescue => e
      render json: {
        success: false,
        error: e.message,
        output: output.string,
        backtrace: e.backtrace.first(5)
      }, status: :unprocessable_entity
    ensure
      $stdout = original_stdout
    end
  end

  # GET /api/fa_dashboard/preview/season_switch
  def preview_season_switch
    require 'stringio'
    output = StringIO.new
    original_stdout = $stdout
    $stdout = output

    begin
      Rake::Task['season:preview'].reenable
      Rake::Task['season:preview'].invoke
    ensure
      $stdout = original_stdout
    end

    render json: { output: output.string }
  end

  private

  def require_admin!
    user = current_user_from_jwt
    unless user&.is_admin?
      render json: { error: 'Unauthorized' }, status: :forbidden
    end
  end

  def bid_params
    params.require(:bid).permit(:annual_amount, :contract_length)
  end

  def contract_params
    params.require(:contract).permit(:amount, :summer, :franchise, :active)
  end

  def season_data
    season = Season.current
    return nil unless season

    next_season = season.next_season
    next_season_data = if next_season
      {
        name: next_season.name,
        targetStatYear: next_season.target_stat_year,
        startDate: next_season.start_date&.strftime('%b %d, %Y'),
        endDate: next_season.end_date&.strftime('%b %d, %Y')
      }
    else
      nil
    end

    {
      name: season.name,
      targetStatYear: season.target_stat_year,
      startDate: season.start_date&.strftime('%b %d, %Y'),
      endDate: season.end_date&.strftime('%b %d, %Y'),
      freeAgencyActive: season.active_free_agency_period.present?,
      maxBids: season.active_free_agency_period&.max_bids_for_team,
      nextSeasonData: next_season_data,
      expiringContracts: Contract.where(active: true, last_season_id: season.id).count
    }
  end

  def free_agent_data
    {
      count: Player.where(is_free_agent: true).count,
      underContract: Player.joins(:contract).distinct.count,
      ineligible: Player.count - Player.where(is_free_agent: true).count - Player.joins(:contract).distinct.count,
      changeToday: 0 # TODO: Track changes over time
    }
  end

  def trades_data
    {
      pending: Trade.pending.includes(:from_team, :to_team, :contracts).limit(5).map do |trade|
        {
          id: trade.id,
          fromTeam: trade.from_team.name,
          toTeam: trade.to_team.name,
          summary: trade_summary(trade),
          timeAgo: time_ago_in_words(trade.created_at)
        }
      end
    }
  end

  def stats_api_data
    begin
      # Default to mock stats service for best developer experience
      # Override with STATS_API_URL env var to point to real stats API
      stats_api_url = ENV.fetch('STATS_API_URL', 'http://mock-stats:3001')

      # Measure response time
      start_time = Time.now
      response = HTTParty.get("#{stats_api_url}/api/v1/metrics", timeout: 5)
      response_time_ms = ((Time.now - start_time) * 1000).round(0)

      if response.code == 200
        metrics = response.parsed_response

        {
          healthy: true,
          environment: metrics['environment'],
          responseTime: "#{response_time_ms}ms",
          cacheEntries: metrics.dig('cache', 'entries'),
          cacheHitRate: metrics.dig('cache', 'hit_rate'),
          cacheHits: metrics.dig('cache', 'hits'),
          cacheMisses: metrics.dig('cache', 'misses'),
          dbStats: metrics.dig('database', 'total_stats'),
          uniquePlayers: metrics.dig('database', 'unique_players'),
          yearsCovered: metrics.dig('database', 'years_covered'),
          lastImport: metrics.dig('last_import', 'year'),
          status: metrics['status']
        }
      else
        {
          healthy: false,
          error: "Stats API returned #{response.code}"
        }
      end
    rescue => e
      {
        healthy: false,
        error: e.message
      }
    end
  end

  def season_overview(season)
    {
      id: season.id,
      name: season.name,
      target_stat_year: season.target_stat_year,
      start_date: season.start_date,
      end_date: season.end_date,
      is_active: season.is_active
    }
  end

  def expiring_contracts_data(season)
    Contract
      .where(active: true, last_season_id: season.id)
      .includes(:player, :team)
      .order('teams.name, players.name')
      .group_by(&:team)
      .map do |team, contracts|
        {
          team: team.name,
          contracts: contracts.map { |c| contract_summary(c) },
          total_salary: contracts.sum(&:amount)
        }
      end
  end

  def contract_summary(contract)
    {
      id: contract.id,
      player: contract.player.name,
      playerId: contract.player.id,
      bbrefid: contract.player.bbrefid,
      positions: contract.player.positions,
      amount: contract.amount,
      team: contract.team.name,
      lastSeason: contract.last_season&.name
    }
  end

  def trade_summary(trade)
    from_players = trade.from_contracts.map { |c| c.player.name }.join(', ')
    to_players = trade.to_contracts.map { |c| c.player.name }.join(', ')

    parts = []
    parts << from_players if from_players.present?
    parts << number_to_currency(trade.to_cash_amount, precision: 0) if trade.to_cash_amount&.positive?
    from_summary = parts.join(' + ')

    parts = []
    parts << to_players if to_players.present?
    parts << number_to_currency(trade.from_cash_amount, precision: 0) if trade.from_cash_amount&.positive?
    to_summary = parts.join(' + ')

    "#{from_summary} ← #{to_summary}"
  end

  def trade_detail(trade)
    {
      id: trade.id,
      status: trade.status,
      fromTeam: trade.from_team.name,
      toTeam: trade.to_team.name,
      fromContracts: trade.from_contracts.map { |c| contract_summary(c) },
      toContracts: trade.to_contracts.map { |c| contract_summary(c) },
      fromCash: trade.from_cash_amount,
      toCash: trade.to_cash_amount
    }
  end

  def player_data_for_response(player)
    {
      id: player.id,
      name: player.name,
      bbrefid: player.bbrefid,
      positions: player.positions,
      is_free_agent: player.is_free_agent,
      contracts: player.contracts.order(first_season_id: :desc).map do |contract|
        {
          id: contract.id,
          team_name: contract.team.name,
          team_id: contract.team_id,
          amount: contract.amount,
          first_season: contract.first_season&.name,
          first_season_id: contract.first_season_id,
          last_season: contract.last_season&.name,
          last_season_id: contract.last_season_id,
          active: contract.active,
          summer: contract.summer,
          franchise: contract.franchise
        }
      end
    }
  end

  def team_params
    params.require(:team).permit(:name, :budget, :stadium, :comment)
  end

  def team_response(team)
    {
      id: team.id,
      name: team.name,
      budget: team.budget,
      stadium: team.stadium,
      comment: team.comment,
      owner_username: team.user&.username,
      owner_id: team.user&.id,
      current_payroll: team.current_payroll,
      available_cash: team.available_cash,
      total_players: team.total_players
    }
  end

  def user_create_params
    params.require(:user).permit(:username, :name, :team_id, :is_admin, :password)
  end

  def user_update_params
    permitted = [:username, :name, :team_id, :is_admin]
    permitted << :password if params[:user][:password].present?
    params.require(:user).permit(permitted)
  end

  def user_response(user)
    {
      id: user.id,
      username: user.username,
      name: user.name,
      team_id: user.team_id,
      team_name: user.team&.name,
      is_admin: user.is_admin,
      last_sign_in_at: user.last_sign_in_at,
      sign_in_count: user.sign_in_count
    }
  end
end
