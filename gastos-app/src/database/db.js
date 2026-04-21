const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../gastos.db');

let db;

function save() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

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
      es_cuotas INTEGER DEFAULT 0,
      cuotas_total INTEGER DEFAULT 1,
      monto_cuota REAL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cuotas_detalle (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      gasto_id INTEGER NOT NULL,
      numero_cuota INTEGER NOT NULL,
      monto REAL NOT NULL,
      fecha_vencimiento TEXT NOT NULL,
      pagada INTEGER DEFAULT 0,
      fecha_pago TEXT,
      FOREIGN KEY (gasto_id) REFERENCES gastos(id) ON DELETE CASCADE
    );
  `);

  try { db.run(`ALTER TABLE gastos ADD COLUMN es_cuotas INTEGER DEFAULT 0`); } catch (e) {}
  try { db.run(`ALTER TABLE gastos ADD COLUMN cuotas_total INTEGER DEFAULT 1`); } catch (e) {}
  try { db.run(`ALTER TABLE gastos ADD COLUMN monto_cuota REAL`); } catch (e) {}

  save();
  return db;
}

module.exports = { getDb, save };