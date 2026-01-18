module RailsAdmin
  module Config
    module Actions
      class DeactivateContracts < RailsAdmin::Config::Actions::Base
        register_instance_option :root do
          true
        end

        register_instance_option :http_methods do
          [:get, :post]
        end

        register_instance_option :link_icon do
          'icon-time'
        end

        register_instance_option :label do
          'Deactivate Contracts'
        end

        register_instance_option :controller do
          proc do
            if request.post?
              begin
                season_id = params[:season_id]

                unless season_id.present?
                  flash[:error] = "Please select a season"
                  redirect_to dashboard_path
                  return
                end

                selected_season = Season.find(season_id)

                # Find contracts where last_season is before selected season
                expired_contracts = Contract.where(active: true)
                                            .where('last_season_id = ?', selected_season.id)

                count = expired_contracts.count

                if count == 0
                  flash[:notice] = "No active contracts found for #{selected_season.name}"
                  redirect_to dashboard_path
                  return
                end

                expired_contracts.each do |contract|
                  contract.update_column(:active, false)
                end

                flash[:success] = "Deactivated #{count} expired contracts for #{selected_season.name}"
              rescue => e
                flash[:error] = "Failed to deactivate contracts: #{e.message}"
              end

              redirect_to dashboard_path
            end
          end
        end
      end
    end
  end
end
