const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../gastos.db');

let db;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`PRAGMA foreign_keys = ON;`);

  db.run(`
    CREATE TABLE IF NOT EXISTS categorias (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL UNIQUE,
      descripcion TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS gastos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      descripcion TEXT NOT NULL,
      monto REAL NOT NULL CHECK(monto > 0),
      tipo_pago TEXT NOT NULL CHECK(tipo_pago IN ('efectivo', 'mercado_pago', 'tarjeta_credito', 'tarjeta_debito', 'transferencia')),
      categoria_id INTEGER,
      fecha TEXT DEFAULT (date('now', 'localtime')),
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
    );
  `);

  save();
  return db;
}

// Guarda la DB en disco después de cada escritura
function save() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

module.exports = { getDb, save };
