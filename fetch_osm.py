import urllib.request
import urllib.parse
import json
import time

query = """
[out:json][timeout:90];
area["name"="Portugal"]->.searchArea;
(
  node["amenity"="charging_station"](area.searchArea);
  way["amenity"="charging_station"](area.searchArea);
  relation["amenity"="charging_station"](area.searchArea);
);
out center;
"""

url = 'https://overpass-api.de/api/interpreter'
params = urllib.parse.urlencode({'data': query.strip()}).encode('utf-8')
req = urllib.request.Request(url, data=params, headers={
    'User-Agent': 'AntigravityEVDataFetcher/1.0 (https://example.com/)'
})

print("Fetching charging stations for all of Portugal from OSM... This may take a minute.")
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        elements = data.get('elements', [])
        print(f"Found {len(elements)} stations in OSM")
        
        # Convert way/relation centers to lat/lon for easy processing
        for element in elements:
            if 'center' in element:
                element['lat'] = element['center']['lat']
                element['lon'] = element['center']['lon']
                
        with open('osm_data.json', 'w', encoding='utf-8') as f:
            json.dump(elements, f, ensure_ascii=False, indent=2)
        print("Data saved to osm_data.json")
except Exception as e:
    print(f"Error: {e}")


