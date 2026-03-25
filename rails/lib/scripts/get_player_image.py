#!/usr/bin/env python3
"""
Get player headshot URL from Baseball Reference ID
Uses MLB's headshot API (may include generic placeholders for some players)
Usage: python get_player_image.py <bbrefid>
"""

import sys
import pandas as pd
import pybaseball as pyb
from pybaseball import cache

# Enable caching to speed up repeated lookups
cache.enable()

def get_image_url(bbrefid):
    """
    Get player image URL from MLB using MLBAM ID
    Note: Some players may only have MLB's generic placeholder image
    """
    try:
        player_info = pyb.playerid_reverse_lookup([bbrefid], key_type='bbref')

        if player_info.empty:
            return ""

        mlbam_id = player_info.iloc[0]['key_mlbam']

        if pd.isna(mlbam_id):
            return ""

        mlbam_id = int(mlbam_id)

        # MLB headshot URL (higher resolution, no default placeholder in URL)
        # If player doesn't have a photo, MLB will serve their generic placeholder
        image_url = f"https://img.mlbstatic.com/mlb-photos/image/upload/w_213,q_auto:best/v1/people/{mlbam_id}/headshot/67/current"

        return image_url

    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return ""

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python get_player_image.py <bbrefid>", file=sys.stderr)
        sys.exit(1)

    bbrefid = sys.argv[1]
    image_url = get_image_url(bbrefid)
    print(image_url)
