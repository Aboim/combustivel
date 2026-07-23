const { getDb, queryAll } = require('./db');

(async () => {
  const db = await getDb();
  const rows = queryAll(db, "SELECT id, name, address, lat, lng FROM stations WHERE type='fuel' AND name LIKE '%Charneca%'");
  console.log('=== REPSOL CHARNECA DE CAPARICA ===');
  rows.forEach(r => console.log(`${r.id} | ${r.name} | ${r.address} | (${r.lat},${r.lng})`));
})();
