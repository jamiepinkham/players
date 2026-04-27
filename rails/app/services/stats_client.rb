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

  class << self
    # Fetch stats for a single player
    #
    # @param bbrefid [String] Baseball Reference ID
    # @param year [Integer] Season year
    # @return [Hash] Stats hash (e.g., { "PA" => "679", "HR" => "53" })
    #         Returns empty hash if player not found or on error
    def fetch(bbrefid, year)
      return {} if bbrefid.blank?

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
      uri = URI("#{BASE_URL}/api/v1/health")

      response = Net::HTTP.start(uri.host, uri.port, read_timeout: 2) do |http|
        request = Net::HTTP::Get.new(uri)
        http.request(request)
      end

      response.is_a?(Net::HTTPSuccess)

    rescue StandardError
      false
    end
  end
end
