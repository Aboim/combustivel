// DEPRECATED: Use process_osm_v2.py instead
const fs = require('fs');

async function fetchOSM() {
    // Bounding box for Continental Portugal: South, West, North, East
    // (36.9, -9.6, 42.2, -6.1)
    const query = `
    [out:json][timeout:50];
    node["amenity"="charging_station"](36.9, -9.6, 42.2, -6.1);
    out body;
    `;
    
    try {
        console.log("Fetching from Overpass API...");
        const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'NodeJS/EvMapDataFetcher'
            },
            body: `data=${encodeURIComponent(query.trim())}`
        });
        
        if (!response.ok) {
            console.error('HTTP Error:', response.status, response.statusText);
            const text = await response.text();
            console.error('Response:', text);
            return;
        }
        
        const data = await response.json();
        console.log(`Found ${data.elements.length} charging stations.`);
        fs.writeFileSync('osm_data.json', JSON.stringify(data.elements, null, 2));
    } catch (e) {
        console.error('Error fetching data:', e);
    }
}

fetchOSM();
