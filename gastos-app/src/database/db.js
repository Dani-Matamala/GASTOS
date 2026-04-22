const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function getDb() {
  return pool;
}

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nombre TEXT NOT NULL UNIQUE,
        descripcion TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS gastos (
        id SERIAL PRIMARY KEY,
        descripcion TEXT NOT NULL,
        monto NUMERIC NOT NULL CHECK(monto > 0),
        tipo_pago TEXT NOT NULL CHECK(tipo_pago IN ('efectivo', 'mercado_pago', 'tarjeta_credito', 'tarjeta_debito', 'transferencia')),
        categoria_id INTEGER REFERENCES categorias(id) ON DELETE SET NULL,
        fecha DATE DEFAULT CURRENT_DATE,
        es_cuotas BOOLEAN DEFAULT FALSE,
        cuotas_total INTEGER DEFAULT 1,
        monto_cuota NUMERIC,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS cuotas_detalle (
        id SERIAL PRIMARY KEY,
        gasto_id INTEGER NOT NULL REFERENCES gastos(id) ON DELETE CASCADE,
        numero_cuota INTEGER NOT NULL,
        monto NUMERIC NOT NULL,
        fecha_vencimiento DATE NOT NULL,
        pagada BOOLEAN DEFAULT FALSE,
        fecha_pago DATE
      );
    `);

    console.log('Base de datos inicializada');
  } finally {
    client.release();
  }
}

module.exports = { getDb, initDb };