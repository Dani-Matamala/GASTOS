const express = require('express');
const router = express.Router();
const { getDb } = require('../database/db');

router.get('/', async (req, res) => {
  const db = await getDb();
  const { rows } = await db.query(`
    SELECT cd.*, g.descripcion as gasto_descripcion, g.cuotas_total
    FROM cuotas_detalle cd JOIN gastos g ON cd.gasto_id = g.id
    ORDER BY cd.fecha_vencimiento ASC
  `);
  res.json(rows);
});

router.get('/pendientes', async (req, res) => {
  const db = await getDb();
  const { rows } = await db.query(`
    SELECT TO_CHAR(fecha_vencimiento, 'YYYY-MM') as mes,
           COUNT(*) as cantidad, SUM(monto) as total
    FROM cuotas_detalle WHERE pagada = FALSE
    GROUP BY mes ORDER BY mes ASC
  `);
  res.json(rows);
});

router.get('/mes/:mes', async (req, res) => {
  const db = await getDb();
  const mes = req.params.mes;
  const { rows } = await db.query(`
    SELECT cd.*, g.descripcion as gasto_descripcion, g.cuotas_total, g.tipo_pago
    FROM cuotas_detalle cd JOIN gastos g ON cd.gasto_id = g.id
    WHERE TO_CHAR(cd.fecha_vencimiento, 'YYYY-MM') = $1
    ORDER BY cd.pagada ASC, cd.fecha_vencimiento ASC
  `, [mes]);

  const total_mes = rows.reduce((acc, c) => acc + Number(c.monto), 0);
  const total_pendiente = rows.filter(c => !c.pagada).reduce((acc, c) => acc + Number(c.monto), 0);
  const total_pagado = rows.filter(c => c.pagada).reduce((acc, c) => acc + Number(c.monto), 0);

  res.json({ mes, total_mes, total_pendiente, total_pagado, cuotas: rows });
});

router.patch('/:id/pagar', async (req, res) => {
  const db = await getDb();
  const { rows } = await db.query('SELECT * FROM cuotas_detalle WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Cuota no encontrada' });
  if (rows[0].pagada) return res.status(400).json({ error: 'La cuota ya fue pagada' });

  await db.query(
    'UPDATE cuotas_detalle SET pagada = TRUE, fecha_pago = CURRENT_DATE WHERE id = $1',
    [req.params.id]
  );
  res.json({ mensaje: 'Cuota marcada como pagada' });
});

router.patch('/:id/despagar', async (req, res) => {
  const db = await getDb();
  await db.query(
    'UPDATE cuotas_detalle SET pagada = FALSE, fecha_pago = NULL WHERE id = $1',
    [req.params.id]
  );
  res.json({ mensaje: 'Cuota desmarcada' });
});

module.exports = router;