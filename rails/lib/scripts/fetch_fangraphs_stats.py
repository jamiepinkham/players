#!/usr/bin/env python3
"""
Fetch all stats from FanGraphs for a given year.
Outputs JSON with batting and pitching stats including WAR.
Uses BBRef IDs for matching instead of player names.

Usage:
  fetch_fangraphs_stats.py <year>           # Fetch stats for all players
  fetch_fangraphs_stats.py <year> <bbrefid> # Fetch stats for specific player
"""

import sys
import json
import os

try:
    from pybaseball import batting_stats, pitching_stats, fielding_stats, cache, chadwick_register
except ImportError:
    print("ERROR: pybaseball not installed. Run: pip3 install pybaseball", file=sys.stderr)
    sys.exit(1)

# Enable caching to speed up repeated requests
cache.enable()

# Suppress pybaseball's stdout messages (like "Gathering player lookup table")
# We only want JSON output on stdout
class SuppressStdout:
    def __enter__(self):
        self._original_stdout = sys.stdout
        sys.stdout = sys.stderr
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        sys.stdout = self._original_stdout

# Stats we want from FanGraphs
# Note: 'Pos' in FanGraphs is positional adjustment (defensive metric), NOT actual position
# Team: Team abbreviation
BATTING_STATS = ['IDfg', 'Name', 'Team', 'G', 'PA', 'AB', 'H', '1B', '2B', '3B', 'HR', 'R', 'RBI', 'SB', 'BB', 'SO', 'AVG', 'OBP', 'SLG', 'OPS', 'WAR']
PITCHING_STATS = ['IDfg', 'Name', 'Team', 'G', 'GS', 'W', 'L', 'SV', 'IP', 'H', 'R', 'ER', 'HR', 'BB', 'SO', 'ERA', 'WHIP', 'WAR']

def build_id_mapping():
    """Build FanGraphs ID -> BBRef ID mapping from Chadwick Register"""
    try:
        print("Loading Chadwick Register for ID mapping...", file=sys.stderr)

        # Suppress pybaseball's stdout messages
        with SuppressStdout():
            register = chadwick_register()

        mapping = {}
        for _, row in register.iterrows():
            fg_id = row.get('key_fangraphs')
            bbref_id = row.get('key_bbref')
            if fg_id and bbref_id and str(fg_id) != 'nan' and str(bbref_id) != 'nan':
                try:
                    mapping[int(fg_id)] = bbref_id
                except (ValueError, TypeError):
                    continue

        print(f"  Loaded {len(mapping)} FanGraphs ID -> BBRef ID mappings", file=sys.stderr)
        return mapping

    except Exception as e:
        print(f"  Error loading Chadwick Register: {e}", file=sys.stderr)
        return {}

def fetch_batting_stats(year, id_mapping):
    """Fetch batting stats from FanGraphs, keyed by BBRef ID"""
    try:
        print(f"Fetching batting stats for {year}...", file=sys.stderr)

        # Suppress pybaseball's stdout messages
        with SuppressStdout():
            df = batting_stats(year, year, qual=0)  # qual=0 gets all players

        print(f"  Loaded {len(df)} batters", file=sys.stderr)

        # Convert to dict keyed by BBRef ID
        stats_by_bbref = {}
        unmatched_count = 0

        for _, row in df.iterrows():
            # Get FanGraphs ID
            fg_id = row.get('IDfg')
            if not fg_id or str(fg_id) == 'nan':
                unmatched_count += 1
                continue

            try:
                fg_id = int(fg_id)
            except (ValueError, TypeError):
                unmatched_count += 1
                continue

            # Look up BBRef ID
            bbref_id = id_mapping.get(fg_id)
            if not bbref_id:
                unmatched_count += 1
                continue

            stats = {}
            player_info = {}  # Metadata about the player (name, team, position)

            for stat in BATTING_STATS:
                if stat == 'IDfg':  # Skip ID field
                    continue

                if stat in row:
                    value = row[stat]
                    # Convert to string, handle NaN
                    if value is not None and str(value) != 'nan':
                        # Rename AVG to BA for consistency
                        key = 'BA' if stat == 'AVG' else stat

                        # Store player metadata separately
                        if stat in ['Name', 'Team']:
                            player_info[stat] = str(value).strip()
                        else:
                            stats[key] = str(value)

            if stats:
                # Include player info with stats
                result = {'stats': stats, 'player_info': player_info}
                stats_by_bbref[bbref_id] = result

        if unmatched_count > 0:
            print(f"  Warning: {unmatched_count} batters couldn't be matched to BBRef IDs", file=sys.stderr)

        return stats_by_bbref

    except Exception as e:
        print(f"  Error fetching batting stats: {e}", file=sys.stderr)
        return {}

def fetch_pitching_stats(year, id_mapping):
    """Fetch pitching stats from FanGraphs, keyed by BBRef ID"""
    try:
        print(f"Fetching pitching stats for {year}...", file=sys.stderr)

        # Suppress pybaseball's stdout messages
        with SuppressStdout():
            df = pitching_stats(year, year, qual=0)  # qual=0 gets all players

        print(f"  Loaded {len(df)} pitchers", file=sys.stderr)

        # Convert to dict keyed by BBRef ID
        stats_by_bbref = {}
        unmatched_count = 0

        for _, row in df.iterrows():
            # Get FanGraphs ID
            fg_id = row.get('IDfg')
            if not fg_id or str(fg_id) == 'nan':
                unmatched_count += 1
                continue

            try:
                fg_id = int(fg_id)
            except (ValueError, TypeError):
                unmatched_count += 1
                continue

            # Look up BBRef ID
            bbref_id = id_mapping.get(fg_id)
            if not bbref_id:
                unmatched_count += 1
                continue

            stats = {}
            player_info = {}  # Metadata about the player (name, team)

            for stat in PITCHING_STATS:
                if stat == 'IDfg':  # Skip ID field
                    continue

                if stat in row:
                    value = row[stat]
                    # Convert to string, handle NaN
                    if value is not None and str(value) != 'nan':
                        # Store player metadata separately
                        if stat in ['Name', 'Team']:
                            player_info[stat] = str(value).strip()
                        else:
                            stats[stat] = str(value)

            if stats:
                # Include player info with stats
                result = {'stats': stats, 'player_info': player_info}
                stats_by_bbref[bbref_id] = result

        if unmatched_count > 0:
            print(f"  Warning: {unmatched_count} pitchers couldn't be matched to BBRef IDs", file=sys.stderr)

        return stats_by_bbref

    except Exception as e:
        print(f"  Error fetching pitching stats: {e}", file=sys.stderr)
        return {}

def fetch_fielding_positions(year, id_mapping):
    """Fetch fielding positions from FanGraphs, keyed by BBRef ID"""
    # Map numerical position codes to abbreviations
    POSITION_MAP = {
        '1': 'P',   # Pitcher
        '2': 'C',   # Catcher
        '3': '1B',  # First Base
        '4': '2B',  # Second Base
        '5': '3B',  # Third Base
        '6': 'SS',  # Shortstop
        '7': 'LF',  # Left Field
        '8': 'CF',  # Center Field
        '9': 'RF',  # Right Field
    }

    try:
        print(f"Fetching fielding positions for {year}...", file=sys.stderr)

        # Suppress pybaseball's stdout messages
        with SuppressStdout():
            df = fielding_stats(year, year, qual=0)  # qual=0 gets all players

        print(f"  Loaded {len(df)} fielders", file=sys.stderr)

        # Convert to dict keyed by BBRef ID
        # Group by player and aggregate positions (some play multiple)
        positions_by_bbref = {}
        unmatched_count = 0

        for _, row in df.iterrows():
            # Get FanGraphs ID
            fg_id = row.get('IDfg')
            if not fg_id or str(fg_id) == 'nan':
                unmatched_count += 1
                continue

            try:
                fg_id = int(fg_id)
            except (ValueError, TypeError):
                unmatched_count += 1
                continue

            # Look up BBRef ID
            bbref_id = id_mapping.get(fg_id)
            if not bbref_id:
                unmatched_count += 1
                continue

            position_code = row.get('Pos')
            if position_code and str(position_code) != 'nan':
                # Convert numerical code to position abbreviation
                position = POSITION_MAP.get(str(position_code), str(position_code))

                # If player already has a position, combine them (e.g., "SS/3B")
                if bbref_id in positions_by_bbref:
                    existing_pos = positions_by_bbref[bbref_id]
                    if position not in existing_pos:
                        positions_by_bbref[bbref_id] = f"{existing_pos}/{position}"
                else:
                    positions_by_bbref[bbref_id] = position

        if unmatched_count > 0:
            print(f"  Warning: {unmatched_count} fielders couldn't be matched to BBRef IDs", file=sys.stderr)

        return positions_by_bbref

    except Exception as e:
        print(f"  Error fetching fielding positions: {e}", file=sys.stderr)
        return {}

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: fetch_fangraphs_stats.py <year> [bbrefid]", file=sys.stderr)
        sys.exit(1)

    year = int(sys.argv[1])
    bbrefid_filter = sys.argv[2] if len(sys.argv) > 2 else None

    if bbrefid_filter:
        print(f"Fetching FanGraphs stats for {year} (player: {bbrefid_filter})...", file=sys.stderr)
    else:
        print(f"Fetching FanGraphs stats for {year}...", file=sys.stderr)
    print("", file=sys.stderr)

    # Build ID mapping first
    id_mapping = build_id_mapping()
    print("", file=sys.stderr)

    # Fetch stats using ID mapping
    batting = fetch_batting_stats(year, id_mapping)
    pitching = fetch_pitching_stats(year, id_mapping)
    positions = fetch_fielding_positions(year, id_mapping)

    # Filter by bbrefid if provided
    if bbrefid_filter:
        batting = {bbrefid_filter: batting[bbrefid_filter]} if bbrefid_filter in batting else {}
        pitching = {bbrefid_filter: pitching[bbrefid_filter]} if bbrefid_filter in pitching else {}
        positions = {bbrefid_filter: positions[bbrefid_filter]} if bbrefid_filter in positions else {}
        print(f"Filtered to player: {bbrefid_filter}", file=sys.stderr)

    print("", file=sys.stderr)
    print(f"Total matched: {len(batting)} batters, {len(pitching)} pitchers, {len(positions)} fielders", file=sys.stderr)

    # Output JSON to stdout with UTF-8 encoding
    result = {
        'batting': batting,
        'pitching': pitching,
        'positions': positions
    }
    json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
