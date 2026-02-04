module RailsAdmin
  module Config
    module Actions
      class ImportPlayerStats < RailsAdmin::Config::Actions::Base
        register_instance_option :member do
          true
        end

        register_instance_option :visible? do
          bindings[:object].is_a?(Player) && bindings[:object].bbrefid.present?
        end

        register_instance_option :link_icon do
          'icon-download'
        end

        register_instance_option :controller do
          Proc.new do
            player = @object

            if player.bbrefid.blank?
              flash[:error] = "Cannot import stats: player has no BBRef ID"
              redirect_to back_or_index
              return
            end

            # Run the import task
            success = system("bin/rails stats:import_player[#{player.bbrefid}]")

            if success
              flash[:success] = "Successfully imported stats for #{player.name}"
            else
              flash[:error] = "Failed to import stats for #{player.name}"
            end

            redirect_to back_or_index
          end
        end
      end
    end
  end
end
