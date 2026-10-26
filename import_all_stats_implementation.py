"""
Complete implementation for import_all_stats_task

This should replace the stub in stats-api: /app/app/tasks/tasks.py
"""

@celery_app.task(name="import_all_stats")
def import_all_stats_task(year: int):
    """
    Import stats for all players for a given year.

    Process:
    1. Query MLB Stats API for all players in the season
    2. For each player, fetch their stats
    3. Save to database
    """
    import requests
    from app.database import SessionLocal
    from app.services.stats_fetcher import fetch_stats_for_player, build_id_mapping
    from app.models.player_stat import PlayerStat

    # Build MLB ID -> BBRef ID mapping
    mlb_to_bbref, bbref_to_mlb = build_id_mapping()

    # Get all players for the season from MLB Stats API
    try:
        url = f'https://statsapi.mlb.com/api/v1/sports/1/players?season={year}'
        response = requests.get(url, timeout=30)
        response.raise_for_status()

        data = response.json()
        players = data.get('people', [])

        print(f"Found {len(players)} players for {year} season")

    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to fetch player list: {str(e)}"
        }

    # Process each player
    db = SessionLocal()
    imported = 0
    skipped = 0
    errors = 0

    try:
        for player in players:
            mlb_id = player.get('id')
            name = player.get('fullName', 'Unknown')

            # Map to BBRef ID
            if mlb_id not in mlb_to_bbref:
                print(f"No BBRef ID for {name} (MLB ID: {mlb_id})")
                skipped += 1
                continue

            bbrefid = mlb_to_bbref[mlb_id]

            # Check if already exists
            existing = db.query(PlayerStat).filter_by(
                bbrefid=bbrefid,
                year=year
            ).first()

            if existing:
                skipped += 1
                continue

            # Fetch stats
            stats = fetch_stats_for_player(bbrefid, year)

            if not stats:
                errors += 1
                continue

            # Add player name to stats
            stats['name'] = name

            # Save to database
            player_stat = PlayerStat(
                bbrefid=bbrefid,
                year=year,
                stats=stats
            )
            db.add(player_stat)

            imported += 1

            # Commit in batches
            if imported % 100 == 0:
                db.commit()
                print(f"Progress: {imported} imported, {skipped} skipped, {errors} errors")

        # Final commit
        db.commit()

        return {
            "status": "success",
            "year": year,
            "total_players": len(players),
            "imported": imported,
            "skipped": skipped,
            "errors": errors
        }

    except Exception as e:
        db.rollback()
        return {
            "status": "error",
            "message": str(e),
            "imported": imported
        }
    finally:
        db.close()
