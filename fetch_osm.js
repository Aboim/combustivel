const fs = require('fs');
const path = require('path');

const query = `
[out:json][timeout:90];
area["name"="Portugal"]->.searchArea;
(
  node["amenity"="charging_station"](area.searchArea);
  way["amenity"="charging_station"](area.searchArea);
  relation["amenity"="charging_station"](area.searchArea);
);
out center;
`;

async function main() {
  const url = 'https://overpass-api.de/api/interpreter';
  console.log('Fetching charging stations for all of Portugal from OSM... This may take a minute.');

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': 'FuelSmartPortugal/2.0',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({ data: query.trim() })
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const elements = data.elements || [];
    console.log(`Found ${elements.length} stations in OSM`);

    for (const el of elements) {
      if (el.center) {
        el.lat = el.center.lat;
        el.lon = el.center.lon;
      }
    }

    const outPath = path.join(__dirname, 'osm_data.json');
    fs.writeFileSync(outPath, JSON.stringify(elements, null, 2), 'utf-8');
    console.log('Data saved to osm_data.json');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
