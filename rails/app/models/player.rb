class Player < ApplicationRecord
  has_many :contracts
  has_one :contract, -> { where(active: true) }

  has_one :leading_bid, -> { where(is_leading: true) }, class_name: 'Bid'

  scope :unsigned, -> {
    joins(' left join contracts c on c.player_id = players.id')
    .where
    .not(bbref_stats: nil) 
  }

  scope :with_stats_or_current_contract, ->(season_id) {
    left_outer_joins(:contracts)
      .where(
        <<~SQL.squish, season_id: season_id
          (
            players.bbref_stats IS NOT NULL
            AND players.bbref_stats::text != ''
            AND players.bbref_stats::jsonb != '{}'::jsonb
            AND players.bbrefid IS NOT NULL
            AND players.bbrefid != ''
            AND players.bbrefid ~ '^[a-z0-9]{9}$'
          )
          OR (
            contracts.first_season_id <= :season_id
            AND contracts.last_season_id >= :season_id
            AND contracts.active = TRUE
            AND players.bbref_stats IS NOT NULL
            AND players.bbref_stats::text != ''
            AND players.bbref_stats::jsonb != '{}'::jsonb
          )
        SQL
      )
      .select('DISTINCT ON (players.bbrefid) players.*')
  }



  def is_free_agent?
    self.contract.blank? || is_contract_expiring?
  end

  def is_contract_expiring?
    self.contract.last_season.id == Season.current.previous_season
  end

  def is_trade_eligible?
    return self.contract.blank? || (self.contract.created_at < (Time.now - 3.months))
  end

  POSITIONS = ['SP', 'RP', 'C', '1B', '2B', '3B', 'SS', 'OF']

  class << self

    def search_name(name)
      Player.where("lower(name) LIKE '%#{name.downcase}%'")
    end

    def match_string_for_position(position)
      if ['SP', 'RP'].include?(position)
        return position
      end

      case position
      when 'C'
        match_string = '2'
      when '1B'
        match_string = '3'
      when '2B'
        match_string = '4'
      when '3B'
        match_string = '5'
      when 'SS'
        match_string = '6'
      when 'OF'
        match_string = '(7|8|9)'
      end
    end
    def lookup_by_position(position)
      match_string = Player.match_string_for_position(position)
      if ['SP', 'RP'].include?(match_string)
        return self.where(position: match_string)
      end
      return Player.where('position similar to ?', "%#{match_string}%")
    end
  end

end
