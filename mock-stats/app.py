#!/usr/bin/env python3
"""
Mock Stats API - Lightweight fake stats service for local development
Returns mock data for all stats endpoints
"""
from flask import Flask, jsonify, request
from datetime import datetime
import random

app = Flask(__name__)

# Mock player stats data
MOCK_STATS = {
    "PA": str(random.randint(400, 700)),
    "HR": str(random.randint(20, 50)),
    "BA": f".{random.randint(250, 350)}",
    "RBI": str(random.randint(60, 120)),
    "SB": str(random.randint(5, 30)),
    "OPS": f".{random.randint(750, 950)}",
    "IP": f"{random.randint(150, 220)}.0",
    "ERA": f"{random.randint(2, 4)}.{random.randint(10, 99)}",
    "WHIP": f"1.{random.randint(10, 40)}",
    "SO": str(random.randint(150, 250)),
    "W": str(random.randint(10, 20)),
    "L": str(random.randint(5, 15))
}

@app.route('/api/v1/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "mock-stats-api",
        "mode": "mock"
    })

@app.route('/api/v1/stats/<bbrefid>/<int:year>', methods=['GET'])
def get_stats(bbrefid, year):
    """Get stats for a player - returns mock data"""
    # Return mock stats with some variation
    stats = MOCK_STATS.copy()
    # Add some randomness based on bbrefid to keep it consistent per player
    seed = sum(ord(c) for c in bbrefid)
    random.seed(seed + year)

    stats["PA"] = str(random.randint(400, 700))
    stats["HR"] = str(random.randint(20, 50))
    stats["BA"] = f".{random.randint(250, 350)}"
    stats["RBI"] = str(random.randint(60, 120))

    return jsonify(stats)

@app.route('/api/v1/stats/batch', methods=['POST'])
def batch_stats():
    """Batch fetch stats - returns mock data for each request"""
    data = request.get_json()
    requests = data.get('requests', [])

    results = []
    for req in requests:
        bbrefid = req.get('bbrefid')
        year = req.get('year')

        # Generate consistent mock stats
        seed = sum(ord(c) for c in bbrefid) if bbrefid else 0
        random.seed(seed + year)

        stats = {
            "PA": str(random.randint(400, 700)),
            "HR": str(random.randint(20, 50)),
            "BA": f".{random.randint(250, 350)}",
            "RBI": str(random.randint(60, 120))
        }

        results.append({
            "bbrefid": bbrefid,
            "year": year,
            "stats": stats
        })

    return jsonify(results)

@app.route('/api/v1/admin/import', methods=['POST'])
def trigger_import():
    """Mock import endpoint"""
    year = request.args.get('year')
    return jsonify({
        "message": f"Mock: Stats import started for year {year}",
        "status": "queued",
        "note": "This is a mock service - no actual import will occur"
    })

@app.route('/api/v1/admin/warmup', methods=['POST'])
def trigger_warmup():
    """Mock warmup endpoint"""
    year = request.args.get('year')
    return jsonify({
        "message": f"Mock: Cache warmup started for year {year}",
        "status": "queued",
        "note": "This is a mock service - no actual warmup will occur"
    })

@app.route('/api/v1/admin/cache', methods=['DELETE'])
def clear_cache():
    """Mock cache clear endpoint"""
    return jsonify({
        "message": "Mock: Cleared cache",
        "count": random.randint(500, 2000),
        "note": "This is a mock service - no actual cache was cleared"
    })

@app.route('/api/v1/metrics', methods=['GET'])
def get_metrics():
    """Mock metrics endpoint - returns fake but realistic metrics"""
    return jsonify({
        "environment": "mock",
        "cache": {
            "entries": random.randint(1500, 3000),
            "hit_rate": f"{random.randint(75, 95)}.{random.randint(0, 99)}%",
            "hits": random.randint(50000, 100000),
            "misses": random.randint(5000, 15000)
        },
        "database": {
            "total_stats": random.randint(8000, 12000),
            "unique_players": random.randint(800, 1200),
            "years_covered": random.randint(5, 10)
        },
        "last_import": {
            "year": 2024,
            "timestamp": datetime.now().isoformat()
        },
        "status": "operational"
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3001, debug=True)
