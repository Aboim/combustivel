import sqlite3
import re
from location_data import get_location_from_ref, get_location_from_coords

conn = sqlite3.connect('database.db')
c = conn.cursor()

c.execute("SELECT s.id, s.name, s.lat, s.lng FROM stations s WHERE s.type='ev' AND s.district='Outros'")
rows = c.fetchall()

fixed = 0
still_outros = []

for station_id, name, lat, lng in rows:
    municipality = None
    district = None

    # 1. Try extracting ref code from name (e.g., MOBI-LLE-00001 -> LLE)
    match = re.search(r'MOBI-([A-Z]{3,4})-', name)
    if match:
        code = match.group(1)
        loc = get_location_from_ref(code)
        if loc:
            municipality, district = loc

    # 2. Try ADPORTUGAL names with coordinate fallback
    if not municipality and 'ADPORTUGAL' in name:
        loc = get_location_from_coords(lat, lng)
        if loc:
            municipality, district = loc

    # 3. Special cases
    if not municipality and 'Hotel Monte Prado' in name:
        municipality, district = "Melgaço", "Viana do Castelo"
    elif not municipality and 'Hotel do Parque' in name:
        municipality, district = "Viana do Castelo", "Viana do Castelo"
    elif not municipality and 'Posto Outros' == name:
        loc = get_location_from_coords(lat, lng)
        if loc:
            municipality, district = loc

    # 4. Coordinate fallback for any remaining
    if not municipality:
        loc = get_location_from_coords(lat, lng)
        if loc:
            municipality, district = loc

    if municipality and district:
        c.execute('''UPDATE stations SET district=?, municipality=?, parish=? WHERE id=?''',
                  (district, municipality, municipality, station_id))
        fixed += 1
    else:
        still_outros.append((name, lat, lng))

conn.commit()

print(f"Fixed: {fixed}")
print(f"Still Outros: {len(still_outros)}")
for n, la, lo in still_outros:
    print(f"  {n[:40]:<42} lat={la:.4f} lng={lo:.4f}")

# Verify
c.execute("SELECT COUNT(*) FROM stations WHERE type='ev' AND district='Outros'")
remaining = c.fetchone()[0]
print(f"\nRemaining Outros: {remaining}")

c.execute("SELECT district, COUNT(*) as cnt FROM stations WHERE type='ev' GROUP BY district ORDER BY cnt DESC")
print("\nFinal district distribution:")
for dist, cnt in c.fetchall():
    print(f"  {dist:<30} {cnt:>5}")

conn.close()
