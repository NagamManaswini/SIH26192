import sqlite3
import os

db_path = 'backend/flash_flood.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    # Delete test shelters
    c.execute("DELETE FROM evacuation_centers WHERE name LIKE 'Test%'")
    # Delete duplicates keeping the minimum id
    c.execute("""
        DELETE FROM evacuation_centers
        WHERE id NOT IN (
            SELECT MIN(id)
            FROM evacuation_centers
            GROUP BY name
        )
    """)
    conn.commit()
    c.execute("SELECT id, name, capacity, current_occupancy, district FROM evacuation_centers")
    rows = c.fetchall()
    print(f"Cleaned {db_path}, {len(rows)} unique shelters remaining:")
    for r in rows:
        print(" -", r)
    conn.close()
