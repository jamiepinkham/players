# frozen_string_literal: true

# Health check controller for container verification and monitoring
class HealthController < ApplicationController
  # Skip authentication/authorization for health checks
  skip_before_action :verify_authenticity_token
  skip_before_action :authenticate_user!, if: :devise_controller?

  # GET /health or GET /healthz
  # Returns 200 OK if application is running
  # Does NOT check database connection (use /health/ready for that)
  def show
    render json: {
      status: 'ok',
      service: 'players',
      timestamp: Time.current.iso8601
    }, status: :ok
  end

  # GET /health/ready
  # Returns 200 OK if application is ready (including database)
  # Use this for Kubernetes readiness probes
  def ready
    # Check database connection
    ActiveRecord::Base.connection.execute('SELECT 1')

    render json: {
      status: 'ready',
      service: 'players',
      database: 'connected',
      timestamp: Time.current.iso8601
    }, status: :ok
  rescue ActiveRecord::ConnectionNotEstablished, PG::Error => e
    render json: {
      status: 'not_ready',
      service: 'players',
      database: 'disconnected',
      error: e.message,
      timestamp: Time.current.iso8601
    }, status: :service_unavailable
  end

  # GET /health/live
  # Returns 200 OK if application process is alive
  # Use this for Kubernetes liveness probes
  def live
    render json: {
      status: 'alive',
      service: 'players',
      timestamp: Time.current.iso8601
    }, status: :ok
  end
end
