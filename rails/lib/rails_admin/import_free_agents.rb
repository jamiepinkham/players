require 'csv'

module RailsAdmin
  module Config
    module Actions
      class ImportFreeAgents < RailsAdmin::Config::Actions::Base
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
          'Import Free Agents'
        end

        register_instance_option :controller do
          proc do
            if request.post?
              begin
                # Clear all stats first (only once)
                Player.update_all(bbref_stats: {}.to_json)

                hitters_file = params[:hitters_file]
                pitchers_file = params[:pitchers_file]

                unless hitters_file && pitchers_file
                  flash[:error] = "Please select both CSV files (hitters and pitchers)"
                  redirect_to back_or_index
                  return
                end

                results = {
                  hitters_created: 0,
                  hitters_updated: 0,
                  pitchers_created: 0,
                  pitchers_updated: 0,
                  errors: []
                }

                # Process Hitters CSV
                CSV.foreach(hitters_file.path, headers: true) do |row|
                  begin
                    # Find or create by BBRefID
                    player = Player.find_or_initialize_by(bbrefid: row['BBRefID'])
                    was_new = player.new_record?

                    # Set name and position
                    player.name = row['Player']
                    player.position = row['Pos']

                    # Store all stats as JSON (excluding Player, BBRefID, Pos)
                    stats = row.to_hash.except('Player', 'BBRefID', 'Pos')
                    player.bbref_stats = stats.to_json

                    player.save!
                    was_new ? results[:hitters_created] += 1 : results[:hitters_updated] += 1
                  rescue => e
                    results[:errors] << "Hitter #{row['Player']}: #{e.message}"
                  end
                end

                # Process Pitchers CSV
                CSV.foreach(pitchers_file.path, headers: true) do |row|
                  begin
                    # Find or create by BBRefID
                    player = Player.find_or_initialize_by(bbrefid: row['BBRefID'])
                    was_new = player.new_record?

                    # Set name
                    player.name = row['Player']

                    # Position determined by GS (games started)
                    if row['GS'].to_i >= 5
                      player.position = 'SP'
                    else
                      player.position = 'RP'
                    end

                    # Store all stats as JSON (excluding Player, BBRefID)
                    stats = row.to_hash.except('Player', 'BBRefID')
                    player.bbref_stats = stats.to_json

                    player.save!
                    was_new ? results[:pitchers_created] += 1 : results[:pitchers_updated] += 1
                  rescue => e
                    results[:errors] << "Pitcher #{row['Player']}: #{e.message}"
                  end
                end

                total_created = results[:hitters_created] + results[:pitchers_created]
                total_updated = results[:hitters_updated] + results[:pitchers_updated]

                flash[:success] = "Imported #{total_created} new players (#{results[:hitters_created]} hitters, #{results[:pitchers_created]} pitchers), updated #{total_updated} players (#{results[:hitters_updated]} hitters, #{results[:pitchers_updated]} pitchers)"
                flash[:error] = "Errors: #{results[:errors].join(', ')}" if results[:errors].any?
              rescue => e
                flash[:error] = "Import failed: #{e.message}"
              end

              redirect_to back_or_index
            end
          end
        end
      end
    end
  end
end
