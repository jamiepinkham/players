require 'csv'
require 'json'

# clear all the player stats
Player.update bbref_stats: {}.to_json

# set last years contracts to inactive
expiring_contracts = Contract.where(last_season: Season.current.previous_season)
expiring_contracts.each do | c |
    c.active = false
    c.save!
end


CSV.foreach('bin/pitchers_2024_stats.csv', :headers => true) do |row|
    # puts "Getting stats for #{row['Player']} #{row['bbrefid']}"
    player = Player.where(bbrefid: row['Player-additional']).first
    if player == nil
        player = Player.where(name: row['Player']).where("bbrefid = '' OR bbrefid IS NULL").first
        if player == nil
            puts "couldn't find #{row['Player']}"
            player = Player.new(name: row['Player'])
        end
        player.bbrefid = row['Player-additional']
        puts "Setting bbrefid for #{row['Player']}"
    end
    stats_json = row.to_hash.to_json
    player.bbref_stats = stats_json

    if row['GS'].to_i >= 5
        player.position = 'SP'
    else
        player.position = 'RP'
    end

    player.save!
end

CSV.foreach('bin/hitters_2024_stats.csv', :headers => true) do |row|
    # puts "Getting stats for #{row['Player']} #{row['Player-additional']}"
    player = Player.where(bbrefid: row['Player-additional']).first
    if player == nil
        player = Player.where(name: row['Player']).where("bbrefid = '' OR bbrefid IS NULL").first
        if player == nil
            puts "couldn't find #{row['Player']}"
            player = Player.new(name: row['Player'])
        end
        player.bbrefid = row['Player-additional']
        puts "Setting bbrefid for #{row['Player']}"
    end
    stats_json = row.to_hash.to_json
    player.bbref_stats = stats_json
    player.position = row['Pos']
    player.save!
end



