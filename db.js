const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, 'database.db');

let _db = null;
let _SQL = null;

async function getDb() {
  if (_db) return _db;
  if (!_SQL) _SQL = await initSqlJs();

  const buffer = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : null;
  _db = new _SQL.Database(buffer);
  _db.run('PRAGMA journal_mode = WAL');
  _db.run('PRAGMA foreign_keys = ON');
  return _db;
}

function saveDb() {
  if (_db) {
    const data = _db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  }
}

function uuid() {
  return crypto.randomUUID();
}

function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function queryRun(db, sql, params = []) {
  db.run(sql, params);
}

module.exports = { getDb, saveDb, uuid, DB_PATH, queryAll, queryRun };
