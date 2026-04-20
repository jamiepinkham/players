#!/usr/bin/env python3
"""
Fetch all stats from MLB Stats API for a given year, with WAR from Baseball Reference.
Outputs JSON with batting and pitching stats including WAR.
Uses BBRef IDs for matching instead of player names.

Usage:
  fetch_fangraphs_stats.py <year>           # Fetch stats for all players
  fetch_fangraphs_stats.py <year> <bbrefid> # Fetch stats for specific player
"""

import sys
import json
import os
import requests
import time

try:
    from pybaseball import bwar_bat, bwar_pitch, cache, chadwick_register
except ImportError:
    print("ERROR: pybaseball not installed. Run: pip3 install pybaseball", file=sys.stderr)
    sys.exit(1)

# Enable caching to speed up repeated requests
cache.enable()

# Suppress pybaseball's stdout messages
class SuppressStdout:
    def __enter__(self):
        self._original_stdout = sys.stdout
        sys.stdout = sys.stderr
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        sys.stdout = self._original_stdout

# MLB Stats API base URL
MLB_STATS_API = 'https://statsapi.mlb.com/api/v1'

def build_id_mapping():
    """Build MLB ID -> BBRef ID mapping from Chadwick Register"""
    try:
        print("Loading Chadwick Register for ID mapping...", file=sys.stderr)

        # Suppress pybaseball's stdout messages
        with SuppressStdout():
            register = chadwick_register()

        mapping = {}
        reverse_mapping = {}
        for _, row in register.iterrows():
            mlb_id = row.get('key_mlbam')
            bbref_id = row.get('key_bbref')
            if mlb_id and bbref_id and str(mlb_id) != 'nan' and str(bbref_id) != 'nan':
                try:
                    mapping[int(mlb_id)] = bbref_id
                    reverse_mapping[bbref_id] = int(mlb_id)
                except (ValueError, TypeError):
                    continue

        print(f"  Loaded {len(mapping)} MLB ID -> BBRef ID mappings", file=sys.stderr)
        return mapping, reverse_mapping

    except Exception as e:
        print(f"  Error loading Chadwick Register: {e}", file=sys.stderr)
        return {}, {}

def fetch_mlb_batting_stats(mlb_id, season):
    """Fetch batting stats from MLB Stats API for a single player"""
    try:
        url = f'{MLB_STATS_API}/people/{mlb_id}/stats?stats=season&season={season}&group=hitting'
        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            return None

        data = response.json()

        # Extract stats from response
        if 'stats' in data and len(data['stats']) > 0:
            splits = data['stats'][0].get('splits', [])
            if len(splits) > 0:
                stat = splits[0].get('stat', {})

                # Extract the stats we want
                return {
                    'G': str(stat.get('gamesPlayed', '')),
                    'PA': str(stat.get('plateAppearances', '')),
                    'AB': str(stat.get('atBats', '')),
                    'H': str(stat.get('hits', '')),
                    '1B': str(stat.get('hits', 0) - stat.get('doubles', 0) - stat.get('triples', 0) - stat.get('homeRuns', 0)) if all(k in stat for k in ['hits', 'doubles', 'triples', 'homeRuns']) else '',
                    '2B': str(stat.get('doubles', '')),
                    '3B': str(stat.get('triples', '')),
                    'HR': str(stat.get('homeRuns', '')),
                    'R': str(stat.get('runs', '')),
                    'RBI': str(stat.get('rbi', '')),
                    'SB': str(stat.get('stolenBases', '')),
                    'BB': str(stat.get('baseOnBalls', '')),
                    'SO': str(stat.get('strikeOuts', '')),
                    'BA': str(stat.get('avg', '')),
                    'OBP': str(stat.get('obp', '')),
                    'SLG': str(stat.get('slg', '')),
                    'OPS': str(stat.get('ops', ''))
                }

        return None

    except Exception as e:
        print(f"  Error fetching MLB batting stats for {mlb_id}: {e}", file=sys.stderr)
        return None

def fetch_mlb_pitching_stats(mlb_id, season):
    """Fetch pitching stats from MLB Stats API for a single player"""
    try:
        url = f'{MLB_STATS_API}/people/{mlb_id}/stats?stats=season&season={season}&group=pitching'
        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            return None

        data = response.json()

        # Extract stats from response
        if 'stats' in data and len(data['stats']) > 0:
            splits = data['stats'][0].get('splits', [])
            if len(splits) > 0:
                stat = splits[0].get('stat', {})

                # Extract the stats we want
                return {
                    'G': str(stat.get('gamesPlayed', '')),
                    'GS': str(stat.get('gamesStarted', '')),
                    'W': str(stat.get('wins', '')),
                    'L': str(stat.get('losses', '')),
                    'SV': str(stat.get('saves', '')),
                    'IP': str(stat.get('inningsPitched', '')),
                    'H': str(stat.get('hits', '')),
                    'R': str(stat.get('runs', '')),
                    'ER': str(stat.get('earnedRuns', '')),
                    'HR': str(stat.get('homeRuns', '')),
                    'BB': str(stat.get('baseOnBalls', '')),
                    'SO': str(stat.get('strikeOuts', '')),
                    'ERA': str(stat.get('era', '')),
                    'WHIP': str(stat.get('whip', ''))
                }

        return None

    except Exception as e:
        print(f"  Error fetching MLB pitching stats for {mlb_id}: {e}", file=sys.stderr)
        return None

def fetch_mlb_player_info(mlb_id):
    """Fetch player name and team from MLB Stats API"""
    try:
        url = f'{MLB_STATS_API}/people/{mlb_id}'
        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            return None, None

        data = response.json()

        if 'people' in data and len(data['people']) > 0:
            person = data['people'][0]
            name = f"{person.get('firstName', '')} {person.get('lastName', '')}".strip()
            team = person.get('currentTeam', {}).get('abbreviation', '')
            return name, team

        return None, None

    except Exception as e:
        return None, None

def fetch_all_batting_stats(year, id_mapping):
    """Fetch batting stats for all players from MLB Stats API"""
    print(f"Fetching batting stats for {year}...", file=sys.stderr)

    stats_by_bbref = {}
    count = 0

    for mlb_id, bbref_id in id_mapping.items():
        stats = fetch_mlb_batting_stats(mlb_id, year)

        if stats:
            # Get player info
            name, team = fetch_mlb_player_info(mlb_id)

            player_info = {}
            if name:
                player_info['Name'] = name
            if team:
                player_info['Team'] = team

            stats_by_bbref[bbref_id] = {
                'stats': stats,
                'player_info': player_info
            }
            count += 1

            # Rate limiting
            time.sleep(0.1)

            if count % 100 == 0:
                print(f"  Fetched {count} batters...", file=sys.stderr)

    print(f"  Loaded {count} batters", file=sys.stderr)
    return stats_by_bbref

def fetch_all_pitching_stats(year, id_mapping):
    """Fetch pitching stats for all players from MLB Stats API"""
    print(f"Fetching pitching stats for {year}...", file=sys.stderr)

    stats_by_bbref = {}
    count = 0

    for mlb_id, bbref_id in id_mapping.items():
        stats = fetch_mlb_pitching_stats(mlb_id, year)

        if stats:
            # Get player info
            name, team = fetch_mlb_player_info(mlb_id)

            player_info = {}
            if name:
                player_info['Name'] = name
            if team:
                player_info['Team'] = team

            stats_by_bbref[bbref_id] = {
                'stats': stats,
                'player_info': player_info
            }
            count += 1

            # Rate limiting
            time.sleep(0.1)

            if count % 100 == 0:
                print(f"  Fetched {count} pitchers...", file=sys.stderr)

    print(f"  Loaded {count} pitchers", file=sys.stderr)
    return stats_by_bbref

def fetch_war_stats(year):
    """Fetch WAR stats from Baseball Reference"""
    try:
        print(f"Fetching WAR stats for {year}...", file=sys.stderr)

        # Suppress pybaseball's stdout messages
        with SuppressStdout():
            batting_war = bwar_bat(return_all=False)
            pitching_war = bwar_pitch(return_all=False)

        # Filter to requested year
        batting_war = batting_war[batting_war['year_ID'] == year] if 'year_ID' in batting_war.columns else batting_war
        pitching_war = pitching_war[pitching_war['year_ID'] == year] if 'year_ID' in pitching_war.columns else pitching_war

        print(f"  Loaded {len(batting_war)} batting WAR, {len(pitching_war)} pitching WAR", file=sys.stderr)

        war_by_bbref = {}

        # Process batting WAR
        for _, row in batting_war.iterrows():
            bbref_id = row.get('player_ID')
            war = row.get('WAR')
            if bbref_id and war is not None and str(war) != 'nan':
                if bbref_id not in war_by_bbref:
                    war_by_bbref[bbref_id] = {}
                war_by_bbref[bbref_id]['batting_war'] = str(war)

        # Process pitching WAR
        for _, row in pitching_war.iterrows():
            bbref_id = row.get('player_ID')
            war = row.get('WAR')
            if bbref_id and war is not None and str(war) != 'nan':
                if bbref_id not in war_by_bbref:
                    war_by_bbref[bbref_id] = {}
                war_by_bbref[bbref_id]['pitching_war'] = str(war)

        return war_by_bbref

    except Exception as e:
        print(f"  Error fetching WAR stats: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return {}

def fetch_fielding_positions(year, reverse_mapping):
    """Fetch fielding positions from MLB Stats API"""
    # For now, return empty dict - we can implement this later if needed
    print(f"Fetching fielding positions for {year}...", file=sys.stderr)
    print(f"  Loaded 0 fielders (not implemented yet)", file=sys.stderr)
    return {}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: fetch_fangraphs_stats.py <year> [bbrefid]", file=sys.stderr)
        sys.exit(1)

    year = int(sys.argv[1])
    bbrefid_filter = sys.argv[2] if len(sys.argv) > 2 else None

    if bbrefid_filter:
        print(f"Fetching stats for {year} (player: {bbrefid_filter})...", file=sys.stderr)
    else:
        print(f"Fetching stats for {year}...", file=sys.stderr)
    print("", file=sys.stderr)

    # Build ID mapping first
    id_mapping, reverse_mapping = build_id_mapping()
    print("", file=sys.stderr)

    # Fetch stats
    if bbrefid_filter:
        # Single player mode
        if bbrefid_filter not in reverse_mapping:
            print(f"ERROR: Player {bbrefid_filter} not found in ID mapping", file=sys.stderr)
            sys.exit(1)

        mlb_id = reverse_mapping[bbrefid_filter]

        batting = {}
        batting_stats = fetch_mlb_batting_stats(mlb_id, year)
        if batting_stats:
            name, team = fetch_mlb_player_info(mlb_id)
            player_info = {}
            if name:
                player_info['Name'] = name
            if team:
                player_info['Team'] = team
            batting[bbrefid_filter] = {'stats': batting_stats, 'player_info': player_info}

        pitching = {}
        pitching_stats = fetch_mlb_pitching_stats(mlb_id, year)
        if pitching_stats:
            name, team = fetch_mlb_player_info(mlb_id)
            player_info = {}
            if name:
                player_info['Name'] = name
            if team:
                player_info['Team'] = team
            pitching[bbrefid_filter] = {'stats': pitching_stats, 'player_info': player_info}

        war = fetch_war_stats(year)
        war = {bbrefid_filter: war[bbrefid_filter]} if bbrefid_filter in war else {}

        positions = {}
    else:
        # All players mode
        batting = fetch_all_batting_stats(year, id_mapping)
        pitching = fetch_all_pitching_stats(year, id_mapping)
        war = fetch_war_stats(year)
        positions = fetch_fielding_positions(year, reverse_mapping)

    print("", file=sys.stderr)
    print(f"Total matched: {len(batting)} batters, {len(pitching)} pitchers, {len(war)} WAR entries", file=sys.stderr)

    # Output JSON to stdout with UTF-8 encoding
    result = {
        'batting': batting,
        'pitching': pitching,
        'positions': positions,
        'war': war
    }
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
