# frozen_string_literal: true

require 'net/http'
require 'json'

# Client for the BMPL Stats API microservice.
#
# This replaces the StatsFetcher service which directly called pybaseball.
# Now stats are fetched from a shared FastAPI service that both prod and QA use.
#
# The stats service handles:
# - Three-tier fallback (Cache → DB → MLB API)
# - Background job processing
# - Shared stats database between environments
#
# Mock Mode:
#   In development/test environments, returns mock data instead of calling the API.
#   This allows local development without running the stats service.
#   Production/staging always use the real API.
#
# Environment:
#   STATS_API_URL - Base URL of stats service (default: http://stats-api:3001)
#
# Example:
#   stats = StatsClient.fetch('judgeaa01', 2025)
#   # => { "PA" => "679", "HR" => "53", ... }
class StatsClient
  class Error < StandardError; end
  class TimeoutError < Error; end
  class ServerError < Error; end

  BASE_URL = ENV.fetch('STATS_API_URL', 'http://stats-api:3001')
  TIMEOUT = 5 # seconds
  MOCK_MODE = Rails.env.development? || Rails.env.test?

  class << self
    # Fetch stats for a single player
    #
    # @param bbrefid [String] Baseball Reference ID
    # @param year [Integer] Season year
    # @return [Hash] Stats hash (e.g., { "PA" => "679", "HR" => "53" })
    #         Returns empty hash if player not found or on error
    def fetch(bbrefid, year)
      return {} if bbrefid.blank?
      return mock_stats(bbrefid, year) if MOCK_MODE

      uri = URI("#{BASE_URL}/api/v1/stats/#{bbrefid}/#{year}")

      response = Net::HTTP.start(uri.host, uri.port, read_timeout: TIMEOUT) do |http|
        request = Net::HTTP::Get.new(uri)
        request['Accept'] = 'application/json'
        http.request(request)
      end

      case response
      when Net::HTTPSuccess
        JSON.parse(response.body)
      when Net::HTTPNotFound
        Rails.logger.info("Stats not found for #{bbrefid} (#{year})")
        {}
      else
        Rails.logger.error("Stats API error: #{response.code} - #{response.message}")
        {}
      end

    rescue Net::ReadTimeout, Net::OpenTimeout => e
      Rails.logger.error("Stats API timeout for #{bbrefid} (#{year}): #{e.message}")
      {}
    rescue JSON::ParserError => e
      Rails.logger.error("Failed to parse stats response: #{e.message}")
      {}
    rescue StandardError => e
      Rails.logger.error("Stats API error: #{e.class} - #{e.message}")
      {}
    end

    # Batch fetch stats for multiple players
    #
    # @param requests [Array<Hash>] Array of { bbrefid:, year: } hashes
    # @return [Array<Hash>] Array of { bbrefid:, year:, stats: } hashes
    def fetch_batch(requests)
      return [] if requests.blank?

      uri = URI("#{BASE_URL}/api/v1/stats/batch")

      request_body = {
        requests: requests.map { |r| { bbrefid: r[:bbrefid], year: r[:year] } }
      }.to_json

      response = Net::HTTP.start(uri.host, uri.port, read_timeout: TIMEOUT * 2) do |http|
        request = Net::HTTP::Post.new(uri)
        request['Content-Type'] = 'application/json'
        request['Accept'] = 'application/json'
        request.body = request_body
        http.request(request)
      end

      case response
      when Net::HTTPSuccess
        JSON.parse(response.body)
      else
        Rails.logger.error("Stats API batch error: #{response.code}")
        []
      end

    rescue StandardError => e
      Rails.logger.error("Stats API batch error: #{e.class} - #{e.message}")
      []
    end

    # Check if stats API is healthy
    #
    # @return [Boolean] true if API is reachable and healthy
    def healthy?
      return true if MOCK_MODE

      uri = URI("#{BASE_URL}/api/v1/health")

      response = Net::HTTP.start(uri.host, uri.port, read_timeout: 2) do |http|
        request = Net::HTTP::Get.new(uri)
        http.request(request)
      end

      response.is_a?(Net::HTTPSuccess)

    rescue StandardError
      false
    end

    private

    # Generate mock stats for local development
    # Returns realistic-looking stats to allow development without stats service
    def mock_stats(bbrefid, year)
      Rails.logger.info("🎭 Mock mode: Generating stats for #{bbrefid} (#{year})")

      # Use bbrefid hash to generate consistent stats for the same player
      seed = bbrefid.sum + year
      rng = Random.new(seed)

      # Return both batting and pitching stats for flexibility
      # Actual player eligibility is determined by PA > 0 or IP > 0
      {
        # Batting stats
        'PA' => rng.rand(300..650).to_s,
        'AB' => rng.rand(250..600).to_s,
        'H' => rng.rand(50..180).to_s,
        '2B' => rng.rand(15..45).to_s,
        '3B' => rng.rand(0..8).to_s,
        'HR' => rng.rand(10..50).to_s,
        'RBI' => rng.rand(30..120).to_s,
        'SB' => rng.rand(0..30).to_s,
        'BB' => rng.rand(30..100).to_s,
        'SO' => rng.rand(80..180).to_s,
        'AVG' => format('%.3f', rng.rand(0.220..0.320)),
        'OBP' => format('%.3f', rng.rand(0.280..0.400)),
        'SLG' => format('%.3f', rng.rand(0.350..0.550)),
        'OPS' => format('%.3f', rng.rand(0.680..0.950)),
        'WAR' => format('%.1f', rng.rand(0.5..6.5)),

        # Pitching stats (for pitchers)
        'W' => rng.rand(5..18).to_s,
        'L' => rng.rand(3..12).to_s,
        'ERA' => format('%.2f', rng.rand(2.50..4.50)),
        'G' => rng.rand(25..65).to_s,
        'GS' => rng.rand(20..33).to_s,
        'IP' => format('%.1f', rng.rand(120.0..210.0)),
        'SO_pitching' => rng.rand(100..250).to_s,
        'BB_pitching' => rng.rand(25..70).to_s,
        'WHIP' => format('%.2f', rng.rand(1.05..1.45)),
        'WAR_pitching' => format('%.1f', rng.rand(1.0..7.0))
      }
    end
  end
end
