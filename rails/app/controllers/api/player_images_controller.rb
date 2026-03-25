module Api
  class PlayerImagesController < ApplicationController
    skip_before_action :verify_authenticity_token

    def show
      bbrefid = params[:bbrefid]

      # Set aggressive caching headers
      expires_in 7.days, public: true

      image_url = PlayerImageService.image_url_for(bbrefid)

      render json: { image_url: image_url }
    rescue => e
      Rails.logger.error("Error in player_images#show: #{e.message}")
      render json: { image_url: PlayerImageService::DEFAULT_IMAGE }, status: :ok
    end
  end
end
