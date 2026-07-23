const fs = require('fs');
const path = require('path');
const { getDb, saveDb, uuid, queryAll, queryRun } = require('./db');
const { getLocationInfo, getLocationFromCoords } = require('./location_data');

function getSocketInfo(tags) {
  const sockets = {};
  for (const [k, v] of Object.entries(tags)) {
    if (k.startsWith('socket:')) {
      const parts = k.split(':');
      const socketType = parts[1];
      if (socketType) {
        if (!sockets[socketType]) sockets[socketType] = {};
        if (parts.length > 2) {
          sockets[socketType][parts[2]] = v;
        } else {
          sockets[socketType]['count'] = v;
        }
      }
    }
  }
  return sockets;
}

function getCleanBrand(tags) {
  const raw = tags['brand'] || tags['operator'] || 'Mobi.E';
  const brandLower = raw.toLowerCase();

  const brandMapping = {
    'edp': 'EDP', 'galp': 'Galp', 'powerdot': 'Powerdot', 'ionity': 'Ionity',
    'tesla': 'Tesla', 'continente': 'Continente Plug&Charge',
    'pingo doce': 'Pingo Doce', 'lidl': 'Lidl', 'aldi': 'Aldi',
    'mercadona': 'Mercadona', 'ikea': 'IKEA', 'auchan': 'Auchan',
    'kargo': 'Kargo', 'prio': 'PRIO', 'iberdrola': 'Iberdrola',
    'atlante': 'Atlante', 'repsol': 'Repsol', 'wowplug': 'wowplug',
    'mobiletric': 'Mobiletric', 'helexia': 'Helexia', 'renewing': 'Renewing',
    'segma': 'SEGMA', 'maksu': 'Maksu', 'ecoinside': 'ecoinside',
    'mobismart': 'MobiSmart', 'moon': 'Moon', 'leve': 'leve',
    'moeve': 'Moeve', 'evce': 'EVCE', 'klc': 'KLC',
    'hexagonal ocean': 'Hexagonal Ocean', 'factor energia': 'Factor Energia',
    'cep': 'Cepsa', 'cepsa': 'Cepsa', 'bp pulse': 'Iberdrola',
    'e-flow': 'e-flow', 'porsche': 'Porsche', 'true kare': 'wowplug',
    'charging together': 'Charging Together',
    'loulé concelho global': 'Loulé Concelho Global', 'emel': 'EMEL',
    'ev power': 'EV Power', 'generation journey': 'Generation Journey',
    'dte': 'DTE', 'mota engil': 'Mota Engil',
    'galp geste': 'Galp', 'galp power': 'Galp',
    'prio.e': 'PRIO', 'helexia ii': 'Helexia',
    'maksu services': 'Maksu', 'klc serviços': 'KLC',
  };

  for (const [key, mapped] of Object.entries(brandMapping)) {
    if (brandLower.includes(key)) return mapped;
  }
  return raw;
}

function normalizeStreet(street) {
  const abbreviations = {
    'Av. ': 'Avenida ',
    'Av ': 'Avenida ',
    'R. ': 'Rua ',
    'R ': 'Rua ',
    'Tv. ': 'Travessa ',
    'Tv ': 'Travessa ',
    'Pç. ': 'Praça ',
    'Pc. ': 'Praça ',
    'Pr. ': 'Praça ',
    'Lg. ': 'Largo ',
    'Lgo. ': 'Largo ',
    'Al. ': 'Alameda ',
    'Estr. ': 'Estrada ',
    'Cç. ': 'Calçada ',
    'Calç. ': 'Calçada ',
    'Rot. ': 'Rotunda ',
    'Prct. ': 'Praceta ',
  };
  for (const [abbr, full] of Object.entries(abbreviations)) {
    if (street.startsWith(abbr)) {
      return full + street.substring(abbr.length);
    }
  }
  return street;
}

function parseCapacity(tags) {
  const cap = tags['capacity'] || '';
  const n = parseInt(cap);
  return isNaN(n) ? 2 : Math.max(n, 1);
}

function parsePowerInfo(sockets) {
  const powerParts = new Set();
  for (const [, details] of Object.entries(sockets)) {
    const output = details['output'];
    if (output) powerParts.add(output);
  }
  return powerParts.size > 0 ? [...powerParts].sort().join(', ') : 'N/A';
}

async function main() {
  const osmPath = path.join(__dirname, 'osm_data.json');
  console.log('Loading OSM data...');
  const data = JSON.parse(fs.readFileSync(osmPath, 'utf-8'));
  console.log(`Loaded ${data.length} stations from OSM`);

  const db = await getDb();

  db.run("DELETE FROM ev_chargers");
  db.run("DELETE FROM stations WHERE type = 'ev'");
  db.run("DROP TABLE IF EXISTS ev_chargers");
  db.run(`
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
  `);

  let inserted = 0;
  let skipped = 0;
  let statsOutros = 0;
  const statsByDistrict = {};

  for (const element of data) {
    let lat = element.lat;
    let lng = element.lon;
    if (!lat || !lng) {
      skipped++;
      continue;
    }

    const tags = element.tags || {};

    let loc = getLocationInfo(tags);
    if (!loc) {
      loc = getLocationFromCoords(lat, lng);
    }

    const [municipality, district] = loc || ['Outros', 'Outros'];
    if (district === 'Outros') statsOutros++;

    statsByDistrict[district] = (statsByDistrict[district] || 0) + 1;

    const cityFromTag = (tags['addr:city'] || '').trim();
    const parish = cityFromTag || municipality;

    const name = tags['name'] || tags['ref'] || `Posto ${municipality}`;

    const brand = getCleanBrand(tags);

    const streetRaw = tags['addr:street'] || '';
    const street = normalizeStreet(streetRaw);
    const housenumber = tags['addr:housenumber'] || '';
    const address = `${street} ${housenumber}`.trim() || `${parish}, ${municipality}`;

    const totalPosts = parseCapacity(tags);
    const availablePosts = totalPosts;

    const sockets = getSocketInfo(tags);
    const socketTypesJson = Object.keys(sockets).length > 0 ? JSON.stringify(sockets) : null;
    const powerInfo = parsePowerInfo(sockets);

    const fee = tags['fee'] || 'yes';
    const access = tags['access'] || 'yes';
    const openingHours = tags['opening_hours'] || '24/7';
    const phone = tags['phone'] || '';
    const website = tags['website'] || tags['contact:website'] || '';
    const network = tags['network'] || 'Mobi.E';

    const sId = uuid();

    db.run(
      `INSERT INTO stations (id, name, brand, address, district, municipality, parish, lat, lng, type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sId, name, brand, address, district, municipality, parish, lat, lng, 'ev']
    );
    db.run(
      `INSERT INTO ev_chargers (station_id, available_posts, total_posts, power_info,
                                socket_types, fee, access, opening_hours, phone, website, network)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sId, availablePosts, totalPosts, powerInfo,
       socketTypesJson, fee, access, openingHours, phone, website, network]
    );

    inserted++;
  }

  saveDb();

  console.log('\n' + '='.repeat(60));
  console.log('RESULTS:');
  console.log(`  Total in OSM: ${data.length}`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped (no coords): ${skipped}`);
  console.log(`  Still "Outros" district: ${statsOutros}`);

  const total = data.length;
  const improvement = total > 0 ? (100 * statsOutros / total).toFixed(1) : '0.0';
  console.log(`  Mapping improvement: ${improvement}%`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
