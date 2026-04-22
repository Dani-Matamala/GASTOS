const express = require('express');
const router = express.Router();
const { getDb } = require('../database/db');

router.get('/', async (req, res) => {
  const db = await getDb();
  const { desde, hasta } = req.query;

  let where = 'WHERE 1=1';
  const params = [];
  let i = 1;
  if (desde) { where += ` AND fecha >= $${i++}`; params.push(desde); }
  if (hasta) { where += ` AND fecha <= $${i++}`; params.push(hasta); }

  const { rows: totalRows } = await db.query(
    `SELECT COALESCE(SUM(monto), 0) as total FROM gastos ${where}`, params
  );

  const { rows: porTipoPago } = await db.query(
    `SELECT tipo_pago, SUM(monto) as total, COUNT(*) as cantidad
     FROM gastos ${where} GROUP BY tipo_pago ORDER BY total DESC`, params
  );

  const { rows: porCategoria } = await db.query(
    `SELECT COALESCE(c.nombre, 'Sin categoría') as categoria,
            SUM(g.monto) as total, COUNT(*) as cantidad
     FROM gastos g LEFT JOIN categorias c ON g.categoria_id = c.id
     ${where} GROUP BY c.nombre ORDER BY total DESC`, params
  );

  const { rows: porMes } = await db.query(
    `SELECT TO_CHAR(fecha, 'YYYY-MM') as mes, SUM(monto) as total, COUNT(*) as cantidad
     FROM gastos ${where} GROUP BY mes ORDER BY mes DESC`, params
  );

  res.json({
    total: totalRows[0].total,
    porTipoPago,
    porCategoria,
    porMes
  });
});

module.exports = router;