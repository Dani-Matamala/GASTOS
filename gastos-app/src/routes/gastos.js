const express = require('express');
const router = express.Router();
const { getDb, save } = require('../database/db');

const TIPOS_PAGO = ['efectivo', 'mercado_pago', 'tarjeta_credito', 'tarjeta_debito', 'transferencia'];

// Genera las cuotas automáticamente a partir de la fecha del gasto
function generarCuotas(db, gastoId, monto, cuotasTotal, fechaInicio) {
  const monto_cuota = Math.round((monto / cuotasTotal) * 100) / 100;
  const [anio, mes, dia] = fechaInicio.split('-').map(Number);

  for (let i = 0; i < cuotasTotal; i++) {
    // Calcular mes de vencimiento
    const fecha = new Date(anio, mes - 1 + i, 1);
    const anioVenc = fecha.getFullYear();
    const mesVenc = String(fecha.getMonth() + 1).padStart(2, '0');
    const fechaVenc = `${anioVenc}-${mesVenc}-${String(dia).padStart(2, '0')}`;

    db.run(
      `INSERT INTO cuotas_detalle (gasto_id, numero_cuota, monto, fecha_vencimiento)
       VALUES (?, ?, ?, ?)`,
      [gastoId, i + 1, monto_cuota, fechaVenc]
    );
  }
}

// GET todos los gastos con filtros opcionales
router.get('/', async (req, res) => {
  const db = await getDb();
  const { categoria_id, tipo_pago, desde, hasta, es_cuotas } = req.query;

  let query = `
    SELECT g.id, g.descripcion, g.monto, g.tipo_pago, g.categoria_id,
           g.fecha, g.es_cuotas, g.cuotas_total, g.monto_cuota,
           g.created_at, c.nombre as categoria_nombre
    FROM gastos g LEFT JOIN categorias c ON g.categoria_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (categoria_id) { query += ' AND g.categoria_id = ?'; params.push(categoria_id); }
  if (tipo_pago) { query += ' AND g.tipo_pago = ?'; params.push(tipo_pago); }
  if (desde) { query += ' AND g.fecha >= ?'; params.push(desde); }
  if (hasta) { query += ' AND g.fecha <= ?'; params.push(hasta); }
  if (es_cuotas !== undefined) { query += ' AND g.es_cuotas = ?'; params.push(es_cuotas === 'true' ? 1 : 0); }
  query += ' ORDER BY g.fecha DESC';

  const result = db.exec(query, params);
  const gastos = result[0]
    ? result[0].values.map(r => ({
        id: r[0], descripcion: r[1], monto: r[2], tipo_pago: r[3],
        categoria_id: r[4], fecha: r[5], es_cuotas: !!r[6],
        cuotas_total: r[7], monto_cuota: r[8],
        created_at: r[9], categoria_nombre: r[10]
      }))
    : [];
  res.json(gastos);
});

// GET un gasto por ID con sus cuotas
router.get('/:id', async (req, res) => {
  const db = await getDb();
  const result = db.exec(`
    SELECT g.id, g.descripcion, g.monto, g.tipo_pago, g.categoria_id,
           g.fecha, g.es_cuotas, g.cuotas_total, g.monto_cuota,
           g.created_at, c.nombre as categoria_nombre
    FROM gastos g LEFT JOIN categorias c ON g.categoria_id = c.id
    WHERE g.id = ?
  `, [req.params.id]);

  if (!result[0]) return res.status(404).json({ error: 'Gasto no encontrado' });
  const r = result[0].values[0];
  const gasto = {
    id: r[0], descripcion: r[1], monto: r[2], tipo_pago: r[3],
    categoria_id: r[4], fecha: r[5], es_cuotas: !!r[6],
    cuotas_total: r[7], monto_cuota: r[8],
    created_at: r[9], categoria_nombre: r[10]
  };

  // Si tiene cuotas, las traemos también
  if (gasto.es_cuotas) {
    const cuotasRes = db.exec(
      'SELECT * FROM cuotas_detalle WHERE gasto_id = ? ORDER BY numero_cuota',
      [req.params.id]
    );
    gasto.cuotas = cuotasRes[0]
      ? cuotasRes[0].values.map(c => ({
          id: c[0], gasto_id: c[1], numero_cuota: c[2],
          monto: c[3], fecha_vencimiento: c[4], pagada: !!c[5], fecha_pago: c[6]
        }))
      : [];
  }

  res.json(gasto);
});

// POST crear gasto
router.post('/', async (req, res) => {
  const { descripcion, monto, tipo_pago, categoria_id, fecha, cuotas } = req.body;

  if (!descripcion) return res.status(400).json({ error: 'La descripción es obligatoria' });
  if (!monto || monto <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  if (!tipo_pago || !TIPOS_PAGO.includes(tipo_pago))
    return res.status(400).json({ error: `tipo_pago debe ser uno de: ${TIPOS_PAGO.join(', ')}` });

  const es_cuotas = cuotas && cuotas > 1 ? 1 : 0;
  const cuotas_total = es_cuotas ? cuotas : 1;
  const monto_cuota = es_cuotas ? Math.round((monto / cuotas_total) * 100) / 100 : null;
  const fechaGasto = fecha || new Date().toISOString().split('T')[0];

  const db = await getDb();
  db.run(
    `INSERT INTO gastos (descripcion, monto, tipo_pago, categoria_id, fecha, es_cuotas, cuotas_total, monto_cuota)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [descripcion, monto, tipo_pago, categoria_id || null, fechaGasto, es_cuotas, cuotas_total, monto_cuota]
  );

  const idRes = db.exec('SELECT last_insert_rowid() as id');
  const id = idRes[0].values[0][0];

  if (es_cuotas) {
    generarCuotas(db, id, monto, cuotas_total, fechaGasto);
  }

  save();
  res.status(201).json({ id, descripcion, monto, tipo_pago, categoria_id, fecha: fechaGasto, es_cuotas: !!es_cuotas, cuotas_total, monto_cuota });
});

// PUT editar gasto (solo datos generales, no regenera cuotas)
router.put('/:id', async (req, res) => {
  const { descripcion, monto, tipo_pago, categoria_id, fecha } = req.body;

  if (!descripcion) return res.status(400).json({ error: 'La descripción es obligatoria' });
  if (!monto || monto <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
  if (!tipo_pago || !TIPOS_PAGO.includes(tipo_pago))
    return res.status(400).json({ error: `tipo_pago debe ser uno de: ${TIPOS_PAGO.join(', ')}` });

  const db = await getDb();
  db.run(
    'UPDATE gastos SET descripcion=?, monto=?, tipo_pago=?, categoria_id=?, fecha=? WHERE id=?',
    [descripcion, monto, tipo_pago, categoria_id || null, fecha, req.params.id]
  );
  save();
  res.json({ id: Number(req.params.id), descripcion, monto, tipo_pago, categoria_id, fecha });
});

// DELETE eliminar gasto (las cuotas se borran en cascada)
router.delete('/:id', async (req, res) => {
  const db = await getDb();
  db.run('DELETE FROM gastos WHERE id = ?', [req.params.id]);
  save();
  res.json({ mensaje: 'Gasto eliminado' });
});

module.exports = router;