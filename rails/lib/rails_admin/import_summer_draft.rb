require 'csv'

module RailsAdmin
  module Config
    module Actions
      class ImportSummerDraft < RailsAdmin::Config::Actions::Base
        register_instance_option :root do
          true
        end

        register_instance_option :http_methods do
          [:get, :post]
        end

        register_instance_option :link_icon do
          'icon-upload'
        end

        register_instance_option :label do
          'Import Summer Draft'
        end

        register_instance_option :controller do
          proc do
            if request.post?
              begin
                file = params[:file]

                unless file
                  flash[:error] = "Please select a CSV file to import"
                  redirect_to dashboard_path
                  return
                end

                # Get current season and calculate +5 seasons
                current_season = Season.current
                unless current_season
                  flash[:error] = "No active season found. Please set an active season first."
                  redirect_to dashboard_path
                  return
                end

                # Calculate last season (+5 from current)
                last_season = current_season
                5.times do
                  last_season = last_season.next_season
                  unless last_season
                    flash[:error] = "Cannot find season +5 from current. Please ensure all seasons are properly linked."
                    redirect_to dashboard_path
                    return
                  end
                end

                results = {
                  contracts_created: 0,
                  players_created: 0,
                  errors: []
                }

                CSV.foreach(file.path, headers: true) do |row|
                  begin
                    player_name = row['Player Name']
                    team_name = row['Team']
                    bbrefid = row['BBREF ID']
                    bbref_minors = row['Minors BBREF ID']
                    position = row['BBREF Position']

                    # Validate required fields
                    unless player_name && team_name && position
                      results[:errors] << "Row missing required fields: Player Name, Team, or Position"
                      next
                    end

                    # Must have either bbrefid or bbref_minors
                    unless bbrefid.present? || bbref_minors.present?
                      results[:errors] << "#{player_name}: Must have either BBREF ID or Minors BBREF ID"
                      next
                    end

                    # Find team
                    team = Team.find_by(name: team_name)
                    unless team
                      results[:errors] << "#{player_name}: Team '#{team_name}' not found"
                      next
                    end

                    # Find or create player
                    player = if bbrefid.present?
                      Player.find_or_initialize_by(bbrefid: bbrefid)
                    else
                      Player.find_or_initialize_by(bbref_minors: bbref_minors)
                    end

                    was_new_player = player.new_record?

                    # Set player attributes
                    player.name = player_name
                    # Parse position string - could be "SS" or "SS/2B" etc.
                    player.positions = position.split('/').map(&:strip).uniq
                    player.bbrefid = bbrefid if bbrefid.present?
                    player.bbref_minors = bbref_minors if bbref_minors.present?

                    player.save!
                    results[:players_created] += 1 if was_new_player

                    # Create contract
                    # Active = true only if player has bbrefid (not just minors)
                    contract = Contract.new(
                      player: player,
                      team: team,
                      amount: 500_000,
                      summer: true,
                      active: bbrefid.present?,
                      first_season: current_season,
                      last_season: last_season
                    )

                    contract.save!
                    results[:contracts_created] += 1

                  rescue => e
                    results[:errors] << "#{row['Player Name']}: #{e.message}"
                  end
                end

                flash[:success] = "Created #{results[:contracts_created]} summer draft contracts (#{results[:players_created]} new players)"
                flash[:error] = "Errors: #{results[:errors].join(', ')}" if results[:errors].any?
              rescue => e
                flash[:error] = "Import failed: #{e.message}"
              end

              redirect_to dashboard_path
            end
          end
        end
      end
    end
  end
end
