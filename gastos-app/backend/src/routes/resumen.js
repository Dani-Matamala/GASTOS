const express = require('express');
const router = express.Router();
const { getDb } = require('../database/db');

router.get('/', async (req, res) => {
  const db = await getDb();
  const { desde, hasta } = req.query;

  let where = 'WHERE 1=1';
  const params = [];
  if (desde) { where += ' AND fecha >= ?'; params.push(desde); }
  if (hasta) { where += ' AND fecha <= ?'; params.push(hasta); }

  const totalRes = db.exec(`SELECT COALESCE(SUM(monto), 0) as total FROM gastos ${where}`, params);
  const total = totalRes[0]?.values[0][0] || 0;

  const tipoPagoRes = db.exec(
    `SELECT tipo_pago, SUM(monto) as total, COUNT(*) as cantidad FROM gastos ${where} GROUP BY tipo_pago ORDER BY total DESC`, params
  );
  const porTipoPago = tipoPagoRes[0]?.values.map(r => ({ tipo_pago: r[0], total: r[1], cantidad: r[2] })) || [];

  const catRes = db.exec(
    `SELECT COALESCE(c.nombre, 'Sin categoría') as categoria, SUM(g.monto) as total, COUNT(*) as cantidad
     FROM gastos g LEFT JOIN categorias c ON g.categoria_id = c.id ${where} GROUP BY g.categoria_id ORDER BY total DESC`, params
  );
  const porCategoria = catRes[0]?.values.map(r => ({ categoria: r[0], total: r[1], cantidad: r[2] })) || [];

  const mesRes = db.exec(
    `SELECT strftime('%Y-%m', fecha) as mes, SUM(monto) as total, COUNT(*) as cantidad
     FROM gastos ${where} GROUP BY mes ORDER BY mes DESC`, params
  );
  const porMes = mesRes[0]?.values.map(r => ({ mes: r[0], total: r[1], cantidad: r[2] })) || [];

  res.json({ total, porTipoPago, porCategoria, porMes });
});

module.exports = router;