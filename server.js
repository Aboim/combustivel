const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { getDb, saveDb, queryAll, queryRun } = require('./db');

const app = express();
const PORT = 8080;

app.use((req, res, next) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.set('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/favicon.ico', (req, res) => res.sendStatus(204));

app.get('/api/stations/fuel', async (req, res) => {
  try {
    const db = await getDb();
    const rows = queryAll(db, `
      SELECT s.*, p.gasolina95, p.gasolina98, p.gasoleo, p.gpl
      FROM stations s
      JOIN prices p ON s.id = p.station_id
      WHERE s.type = 'fuel'
    `);

    const stations = rows.map(r => ({
      id: r.id,
      name: r.name,
      brand: r.brand,
      address: r.address,
      district: r.district,
      municipality: r.municipality,
      parish: r.parish,
      lat: r.lat,
      lng: r.lng,
      prices: {
        gasolina95: r.gasolina95,
        gasolina98: r.gasolina98,
        gasoleo: r.gasoleo,
        gpl: r.gpl
      }
    }));

    res.set('Cache-Control', 'public, max-age=3600');
    res.json({ stations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stations/ev', async (req, res) => {
  try {
    const db = await getDb();
    const rows = queryAll(db, `
      SELECT s.*, c.available_posts, c.total_posts, c.power_info,
             c.socket_types, c.fee, c.access, c.opening_hours,
             c.phone, c.website, c.network
      FROM stations s
      JOIN ev_chargers c ON s.id = c.station_id
      WHERE s.type = 'ev'
    `);

    const stations = rows.map(r => {
      let socketTypes = null;
      if (r.socket_types) {
        try { socketTypes = JSON.parse(r.socket_types); } catch {}
      }
      return {
        id: r.id,
        name: r.name,
        brand: r.brand,
        address: r.address,
        district: r.district,
        municipality: r.municipality,
        parish: r.parish,
        lat: r.lat,
        lng: r.lng,
        chargers: {
          available_posts: r.available_posts,
          total_posts: r.total_posts,
          power_info: r.power_info,
          socket_types: socketTypes,
          fee: r.fee || 'yes',
          access: r.access || 'yes',
          opening_hours: r.opening_hours || '24/7',
          phone: r.phone || '',
          website: r.website || '',
          network: r.network || 'Mobi.E'
        }
      };
    });

    res.set('Cache-Control', 'public, max-age=3600');
    res.json({ stations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stations/ev/live', async (req, res) => {
  try {
    const db = await getDb();
    const rows = queryAll(db, `
      SELECT s.id, c.available_posts, c.total_posts, c.power_info
      FROM stations s
      JOIN ev_chargers c ON s.id = c.station_id
      WHERE s.type = 'ev'
    `);

    const now = new Date();
    const hourSeed = now.getFullYear() * 365 + (Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24))) * 24 + now.getHours();

    const stationsLive = rows.map(r => {
      const total = r.total_posts;
      const hash = crypto.createHash('md5').update(r.id + hourSeed).digest('hex');
      const seed = parseInt(hash.substring(0, 8), 16);
      const rng = seedRandom(seed);

      let available;
      if (total <= 0) {
        available = 0;
      } else if (rng() < 0.35) {
        available = total;
      } else if (rng() < 0.45) {
        available = total > 1 ? total - 1 : total;
      } else if (rng() < 0.15) {
        available = 0;
      } else {
        available = total > 1 ? Math.floor(rng() * (total - 1)) + 1 : total;
      }

      return {
        id: r.id,
        chargers: {
          available_posts: available,
          total_posts: total,
          power_info: r.power_info
        }
      };
    });

    res.set('Cache-Control', 'no-cache');
    res.json({ stations: stationsLive });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function seedRandom(seed) {
  let s = seed;
  return function () {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

app.use((req, res, next) => {
  if (req.path.endsWith('.db') || req.path.includes('database.db')) {
    return res.status(403).send('403 Forbidden');
  }
  next();
});

app.get('/', (req, res, next) => {
  req.url = '/index.html';
  next();
});

app.use(express.static(__dirname, {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) res.set('Cache-Control', 'no-cache');
  }
}));

app.listen(PORT, () => {
  console.log(`FuelSmart Portugal — http://localhost:${PORT}`);
});
