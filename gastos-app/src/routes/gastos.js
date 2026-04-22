const express = require('express');
const router = express.Router();
const { getDb } = require('../database/db');

const TIPOS_PAGO = ['efectivo', 'mercado_pago', 'tarjeta_credito', 'tarjeta_debito', 'transferencia'];

function generarCuotas(db, gastoId, monto, cuotasTotal, fechaInicio) {
  const monto_cuota = Math.round((monto / cuotasTotal) * 100) / 100;
  const [anio, mes, dia] = fechaInicio.split('-').map(Number);
  const queries = [];

  for (let i = 0; i < cuotasTotal; i++) {
    const fecha = new Date(anio, mes - 1 + i, dia);
    const fechaVenc = fecha.toISOString().split('T')[0];
    queries.push(
      db.query(
        `INSERT INTO cuotas_detalle (gasto_id, numero_cuota, monto, fecha_vencimiento)
         VALUES ($1, $2, $3, $4)`,
        [gastoId, i + 1, monto_cuota, fechaVenc]
      )
    );
  }
  return Promise.all(queries);
}

router.get('/', async (req, res) => {
  const db = await getDb();
  const { categoria_id, tipo_pago, desde, hasta, es_cuotas } = req.query;

  let query = `
    SELECT g.*, c.nombre as categoria_nombre
    FROM gastos g LEFT JOIN categorias c ON g.categoria_id = c.id
    WHERE 1=1
  `;
  const params = [];
  let i = 1;

  if (categoria_id) { query += ` AND g.categoria_id = $${i++}`; params.push(categoria_id); }
  if (tipo_pago) { query += ` AND g.tipo_pago = $${i++}`; params.push(tipo_pago); }
  if (desde) { query += ` AND g.fecha >= $${i++}`; params.push(desde); }
  if (hasta) { query += ` AND g.fecha <= $${i++}`; params.push(hasta); }
  if (es_cuotas !== undefined) { query += ` AND g.es_cuotas = $${i++}`; params.push(es_cuotas === 'true'); }
  query += ' ORDER BY g.fecha DESC, g.created_at DESC';

  const { rows } = await db.query(query, params);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const { rows } = await db.query(`
    SELECT g.*, c.nombre as categoria_nombre
    FROM gastos g LEFT JOIN categorias c ON g.categoria_id = c.id
    WHERE g.id = $1
  `, [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Gasto no encontrado' });

  const gasto = rows[0];
  if (gasto.es_cuotas) {
    const { rows: cuotas } = await db.query(
      'SELECT * FROM cuotas_detalle WHERE gasto_id = $1 ORDER BY numero_cuota',
      [req.params.id]
    );
    gasto.cuotas = cuotas;
  }
  res.json(gasto);
});

router.post('/', async (req, res) => {
  const { descripcion, monto, tipo_pago, categoria_id, fecha, cuotas } = req.body;

  if (!descripcion) return res.status(400).json({ error: 'La descripción es obligatoria' });
  if (!monto || monto <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  if (!tipo_pago || !TIPOS_PAGO.includes(tipo_pago))
    return res.status(400).json({ error: `tipo_pago debe ser uno de: ${TIPOS_PAGO.join(', ')}` });

  const es_cuotas = cuotas && cuotas > 1;
  const cuotas_total = es_cuotas ? cuotas : 1;
  const monto_cuota = es_cuotas ? Math.round((monto / cuotas_total) * 100) / 100 : null;
  const fechaGasto = fecha || new Date().toISOString().split('T')[0];

  const db = await getDb();
  const { rows } = await db.query(
    `INSERT INTO gastos (descripcion, monto, tipo_pago, categoria_id, fecha, es_cuotas, cuotas_total, monto_cuota)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [descripcion, monto, tipo_pago, categoria_id || null, fechaGasto, es_cuotas, cuotas_total, monto_cuota]
  );

  const gasto = rows[0];
  if (es_cuotas) await generarCuotas(db, gasto.id, monto, cuotas_total, fechaGasto);

  res.status(201).json(gasto);
});

router.put('/:id', async (req, res) => {
  const { descripcion, monto, tipo_pago, categoria_id, fecha } = req.body;

  if (!descripcion) return res.status(400).json({ error: 'La descripción es obligatoria' });
  if (!monto || monto <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  if (!tipo_pago || !TIPOS_PAGO.includes(tipo_pago))
    return res.status(400).json({ error: `tipo_pago debe ser uno de: ${TIPOS_PAGO.join(', ')}` });

  const db = await getDb();
  const { rows } = await db.query(
    `UPDATE gastos SET descripcion=$1, monto=$2, tipo_pago=$3, categoria_id=$4, fecha=$5
     WHERE id=$6 RETURNING *`,
    [descripcion, monto, tipo_pago, categoria_id || null, fecha, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Gasto no encontrado' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();
  await db.query('DELETE FROM gastos WHERE id = $1', [req.params.id]);
  res.json({ mensaje: 'Gasto eliminado' });
});

module.exports = router;