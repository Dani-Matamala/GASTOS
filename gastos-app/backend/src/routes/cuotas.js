const express = require('express');
const router = express.Router();
const { getDb, save } = require('../database/db');

// GET todas las cuotas pendientes
router.get('/', async (req, res) => {
  const db = await getDb();
  const result = db.exec(`
    SELECT cd.id, cd.gasto_id, cd.numero_cuota, cd.monto,
           cd.fecha_vencimiento, cd.pagada, cd.fecha_pago,
           g.descripcion as gasto_descripcion, g.cuotas_total
    FROM cuotas_detalle cd
    JOIN gastos g ON cd.gasto_id = g.id
    ORDER BY cd.fecha_vencimiento ASC, cd.gasto_id
  `);

  const cuotas = result[0]
    ? result[0].values.map(r => ({
        id: r[0], gasto_id: r[1], numero_cuota: r[2], monto: r[3],
        fecha_vencimiento: r[4], pagada: !!r[5], fecha_pago: r[6],
        gasto_descripcion: r[7], cuotas_total: r[8]
      }))
    : [];
  res.json(cuotas);
});

// GET cuotas por mes: /api/cuotas/mes/2026-04
router.get('/mes/:mes', async (req, res) => {
  const db = await getDb();
  const mes = req.params.mes; // formato: YYYY-MM

  const result = db.exec(`
    SELECT cd.id, cd.gasto_id, cd.numero_cuota, cd.monto,
           cd.fecha_vencimiento, cd.pagada, cd.fecha_pago,
           g.descripcion as gasto_descripcion, g.cuotas_total, g.tipo_pago
    FROM cuotas_detalle cd
    JOIN gastos g ON cd.gasto_id = g.id
    WHERE strftime('%Y-%m', cd.fecha_vencimiento) = ?
    ORDER BY cd.pagada ASC, cd.fecha_vencimiento ASC
  `, [mes]);

  const cuotas = result[0]
    ? result[0].values.map(r => ({
        id: r[0], gasto_id: r[1], numero_cuota: r[2], monto: r[3],
        fecha_vencimiento: r[4], pagada: !!r[5], fecha_pago: r[6],
        gasto_descripcion: r[7], cuotas_total: r[8], tipo_pago: r[9]
      }))
    : [];

  const total_mes = cuotas.reduce((acc, c) => acc + c.monto, 0);
  const total_pendiente = cuotas.filter(c => !c.pagada).reduce((acc, c) => acc + c.monto, 0);
  const total_pagado = cuotas.filter(c => c.pagada).reduce((acc, c) => acc + c.monto, 0);

  res.json({ mes, total_mes, total_pendiente, total_pagado, cuotas });
});

// GET cuotas pendientes agrupadas por mes (resumen futuro)
router.get('/pendientes', async (req, res) => {
  const db = await getDb();
  const result = db.exec(`
    SELECT strftime('%Y-%m', fecha_vencimiento) as mes,
           COUNT(*) as cantidad, SUM(monto) as total
    FROM cuotas_detalle
    WHERE pagada = 0
    GROUP BY mes ORDER BY mes ASC
  `);

  const pendientes = result[0]
    ? result[0].values.map(r => ({ mes: r[0], cantidad: r[1], total: r[2] }))
    : [];
  res.json(pendientes);
});

// PATCH marcar cuota como pagada
router.patch('/:id/pagar', async (req, res) => {
  const db = await getDb();
  const hoy = new Date().toISOString().split('T')[0];

  const check = db.exec('SELECT * FROM cuotas_detalle WHERE id = ?', [req.params.id]);
  if (!check[0]) return res.status(404).json({ error: 'Cuota no encontrada' });
  if (check[0].values[0][5]) return res.status(400).json({ error: 'La cuota ya fue pagada' });

  db.run(
    'UPDATE cuotas_detalle SET pagada = 1, fecha_pago = ? WHERE id = ?',
    [hoy, req.params.id]
  );
  save();
  res.json({ mensaje: 'Cuota marcada como pagada', fecha_pago: hoy });
});

// PATCH desmarcar cuota como pagada
router.patch('/:id/despagar', async (req, res) => {
  const db = await getDb();
  db.run(
    'UPDATE cuotas_detalle SET pagada = 0, fecha_pago = NULL WHERE id = ?',
    [req.params.id]
  );
  save();
  res.json({ mensaje: 'Cuota desmarcada' });
});

module.exports = router;