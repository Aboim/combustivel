import json
import sqlite3
import uuid
from location_data import (
    get_location_from_ref, get_location_from_coords,
    get_location_from_city, get_location_info
)


def get_socket_info(tags):
    """Extract all socket types and their details from tags."""
    sockets = {}
    for k, v in tags.items():
        if k.startswith('socket:'):
            parts = k.split(':')
            socket_type = parts[1] if len(parts) > 1 else None
            if socket_type:
                if socket_type not in sockets:
                    sockets[socket_type] = {}
                if len(parts) > 2:
                    detail = parts[2]
                    sockets[socket_type][detail] = v
                else:
                    sockets[socket_type]['count'] = v
    return sockets


def get_clean_brand(tags):
    """Normalize brand/operator name."""
    brand = tags.get('brand') or tags.get('operator') or 'Mobi.E'
    brand_lower = brand.lower()

    brand_mapping = {
        'edp': 'EDP',
        'galp': 'Galp',
        'powerdot': 'Powerdot',
        'ionity': 'Ionity',
        'tesla': 'Tesla',
        'continente': 'Continente Plug&Charge',
        'pingo doce': 'Pingo Doce',
        'lidl': 'Lidl',
        'aldi': 'Aldi',
        'mercadona': 'Mercadona',
        'ikea': 'IKEA',
        'auchan': 'Auchan',
        'kargo': 'Kargo',
        'prio': 'PRIO',
        'iberdrola': 'Iberdrola',
        'atlante': 'Atlante',
        'repsol': 'Repsol',
        'wowplug': 'wowplug',
        'mobiletric': 'Mobiletric',
        'helexia': 'Helexia',
        'renewing': 'Renewing',
        'segma': 'SEGMA',
        'maksu': 'Maksu',
        'ecoinside': 'ecoinside',
        'mobismart': 'MobiSmart',
        'moon': 'Moon',
        'leve': 'leve',
        'moeve': 'Moeve',
        'evce': 'EVCE',
        'klc': 'KLC',
        'hexagonal ocean': 'Hexagonal Ocean',
        'factor energia': 'Factor Energia',
        'cep': 'Cepsa',
        'cepsa': 'Cepsa',
        'bp pulse': 'Iberdrola',
        'e-flow': 'e-flow',
        'porsche': 'Porsche',
        'true kare': 'wowplug',
        'charging together': 'Charging Together',
        'loulé concelho global': 'Loulé Concelho Global',
        'emel': 'EMEL',
        'ev power': 'EV Power',
        'generation journey': 'Generation Journey',
        'dte': 'DTE',
        'mota engil': 'Mota Engil',
        'galp geste': 'Galp',
        'galp power': 'Galp',
        'prio.e': 'PRIO',
        'helexia ii': 'Helexia',
        'maksu services': 'Maksu',
        'klc serviços': 'KLC',
    }

    for key, mapped in brand_mapping.items():
        if key in brand_lower:
            return mapped
    return brand


def parse_capacity(tags):
    """Parse capacity from tags, default to 2."""
    cap = tags.get('capacity', '')
    try:
        return max(int(cap), 1)
    except (ValueError, TypeError):
        return 2


def parse_power_info(sockets):
    """Generate human-readable power info from socket data."""
    power_parts = set()
    for socket_type, details in sockets.items():
        output = details.get('output', '')
        if output:
            power_parts.add(output)
    if power_parts:
        return ', '.join(sorted(power_parts))
    return 'N/A'


# ──────────────────────────────────────────────────────────
# MAIN PROCESSING
# ──────────────────────────────────────────────────────────
def main():
    print("Loading OSM data...")
    with open('osm_data.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(f"Loaded {len(data)} stations from OSM")

    conn = sqlite3.connect('database.db')
    cursor = conn.cursor()

    # Drop and recreate tables with enriched schema
    cursor.execute("DELETE FROM ev_chargers")
    cursor.execute("DELETE FROM stations WHERE type = 'ev'")

    cursor.execute("DROP TABLE IF EXISTS ev_chargers")
    cursor.execute('''
        CREATE TABLE ev_chargers (
            station_id TEXT PRIMARY KEY,
            available_posts INTEGER,
            total_posts INTEGER,
            power_info TEXT,
            socket_types TEXT,
            fee TEXT,
            access TEXT,
            opening_hours TEXT,
            phone TEXT,
            website TEXT,
            network TEXT,
            FOREIGN KEY(station_id) REFERENCES stations(id)
        )
    ''')

    inserted = 0
    skipped = 0
    stats_outros = 0
    stats_by_district = {}

    for element in data:
        lat = element.get('lat')
        lng = element.get('lon')
        if not lat or not lng:
            skipped += 1
            continue

        tags = element.get('tags', {})

        # ─── Location ───
        loc = get_location_info(tags)
        if not loc:
            # Fallback to coordinate-based
            loc = get_location_from_coords(lat, lng)

        municipality, district = loc if loc else ("Outros", "Outros")
        if district == "Outros":
            stats_outros += 1

        # Track district counts
        stats_by_district[district] = stats_by_district.get(district, 0) + 1

        # Use addr:city as parish/city if available
        city_from_tag = tags.get('addr:city', '').strip()
        parish = city_from_tag if city_from_tag else municipality

        # ─── Name ───
        name = tags.get('name') or tags.get('ref') or f"Posto {municipality}"

        # ─── Brand ───
        brand = get_clean_brand(tags)

        # ─── Address ───
        street = tags.get('addr:street', '')
        housenumber = tags.get('addr:housenumber', '')
        address = f"{street} {housenumber}".strip() or f"{parish}, {municipality}"

        # ─── Capacity ───
        total_posts = parse_capacity(tags)
        available_posts = total_posts  # All posts available by default (no live API)

        # ─── Socket info ───
        sockets = get_socket_info(tags)
        socket_types_json = json.dumps(sockets, ensure_ascii=False) if sockets else None
        power_info = parse_power_info(sockets)

        # ─── Additional fields ───
        fee = tags.get('fee', 'yes')
        access = tags.get('access', 'yes')
        opening_hours = tags.get('opening_hours', '24/7')
        phone = tags.get('phone', '')
        website = tags.get('website', tags.get('contact:website', ''))
        network = tags.get('network', 'Mobi.E')

        # ─── Insert into DB ───
        s_id = str(uuid.uuid4())

        cursor.execute('''
            INSERT INTO stations (id, name, brand, address, district, municipality, parish, lat, lng, type)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (s_id, name, brand, address, district, municipality, parish, lat, lng, 'ev'))

        cursor.execute('''
            INSERT INTO ev_chargers (station_id, available_posts, total_posts, power_info,
                                     socket_types, fee, access, opening_hours, phone, website, network)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (s_id, available_posts, total_posts, power_info,
              socket_types_json, fee, access, opening_hours, phone, website, network))

        inserted += 1

    conn.commit()
    conn.close()

    print(f"\n{'='*60}")
    print(f"RESULTS:")
    print(f"  Total in OSM: {len(data)}")
    print(f"  Inserted: {inserted}")
    print(f"  Skipped (no coords): {skipped}")
    print(f"  Still 'Outros' district: {stats_outros}")
    print(f"\nDistrict distribution:")
    for dist, cnt in sorted(stats_by_district.items(), key=lambda x: -x[1]):
        bar = '█' * min(cnt // 10, 50)
        print(f"  {dist:<30} {cnt:>5}  {bar}")
    print(f"\nMapping improvement: From 87% 'Outros' to {100*stats_outros/len(data):.1f}%")


if __name__ == '__main__':
    main()
