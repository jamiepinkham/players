class Player < ApplicationRecord
  has_many :contracts
  has_one :contract, -> { where(active: true) }

  has_one :leading_bid, -> { where(is_leading: true) }, class_name: 'Bid'

  scope :unsigned, -> {
    joins(' left join contracts c on c.player_id = players.id')
    .where
    .not(bbref_stats: nil) 
  }

  # Returns players who either:
   # 1. Have valid `bbref_stats` and a well-formed `bbrefid`, OR
   # 2. Have an active contract in the given season (first_season_id >= season_id <= last_season_id).
   #
   # A player’s stats are considered valid if:
   # - bbref_stats is not null
   # - bbref_stats is not an empty string
   # - bbref_stats is not an empty JSON object (`{}`)
   # - bbrefid is present, not blank
   #
   # The scope uses a `LEFT OUTER JOIN` to include contracts, then filters using an OR:
   # - one path for players with standalone stats,
   # - another for players with an active contract *and* stats.
   # It uses `DISTINCT ON (players.bbrefid)` to deduplicate cases where players have multiple contracts.

   scope :with_stats_or_current_contract, ->(season_id) {
     players = arel_table
     contracts = Contract.arel_table

     stats_present = players[:bbref_stats].not_eq(nil)
      #  .and(players[:bbref_stats].not_eq(''))
       .and(Arel.sql("players.bbref_stats::jsonb != '{}'::jsonb"))
      #  .and(Arel.sql("players.bbref_stats::jsonb != ''::jsonb"))
       .and(players[:bbrefid].not_eq(nil))
       .and(players[:bbrefid].not_eq(''))
      #  .and(Arel.sql("players.bbref_stats::jsonb != '""'::jsonb"))
       .and(Arel.sql("players.bbrefid ~ '^[a-z0-9]{9}$'"))


     contract_active = contracts[:first_season_id].gteq(season_id)
       .and(contracts[:last_season_id].lteq(season_id))
       .and(contracts[:active].eq(true))

     left_outer_joins(:contracts)
       .where(stats_present.or(contract_active))
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
