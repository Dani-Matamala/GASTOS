const express = require('express');
const router = express.Router();
const { getDb, save } = require('../database/db');

const TIPOS_PAGO = ['efectivo', 'mercado_pago', 'tarjeta_credito', 'tarjeta_debito', 'transferencia'];

router.get('/', async (req, res) => {
    const db = await getDb();
    const { categoria_id, tipo_pago, desde, hasta } = req.query;

    let query = `
    SELECT g.id, g.descripcion, g.monto, g.tipo_pago, g.categoria_id,
           g.fecha, g.created_at, c.nombre as categoria_nombre
    FROM gastos g LEFT JOIN categorias c ON g.categoria_id = c.id
    WHERE 1=1
  `;
    const params = [];

    if (categoria_id) { query += ' AND g.categoria_id = ?'; params.push(categoria_id); }
    if (tipo_pago) { query += ' AND g.tipo_pago = ?'; params.push(tipo_pago); }
    if (desde) { query += ' AND g.fecha >= ?'; params.push(desde); }
    if (hasta) { query += ' AND g.fecha <= ?'; params.push(hasta); }
    query += ' ORDER BY g.fecha DESC';

    const result = db.exec(query, params);
    const gastos = result[0]
        ? result[0].values.map(r => ({
            id: r[0], descripcion: r[1], monto: r[2], tipo_pago: r[3],
            categoria_id: r[4], fecha: r[5], created_at: r[6], categoria_nombre: r[7]
        }))
        : [];
    res.json(gastos);
});

router.get('/:id', async (req, res) => {
    const db = await getDb();
    const result = db.exec(`
    SELECT g.*, c.nombre as categoria_nombre FROM gastos g
    LEFT JOIN categorias c ON g.categoria_id = c.id WHERE g.id = ?
  `, [req.params.id]);
    if (!result[0]) return res.status(404).json({ error: 'Gasto no encontrado' });
    const r = result[0].values[0];
    res.json({ id: r[0], descripcion: r[1], monto: r[2], tipo_pago: r[3], categoria_id: r[4], fecha: r[5], created_at: r[6], categoria_nombre: r[7] });
});

router.post('/', async (req, res) => {
    const { descripcion, monto, tipo_pago, categoria_id, fecha } = req.body;
    if (!descripcion) return res.status(400).json({ error: 'La descripción es obligatoria' });
    if (!monto || monto <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' });
    if (!tipo_pago || !TIPOS_PAGO.includes(tipo_pago))
        return res.status(400).json({ error: `tipo_pago debe ser uno de: ${TIPOS_PAGO.join(', ')}` });

    const db = await getDb();
    db.run(
        'INSERT INTO gastos (descripcion, monto, tipo_pago, categoria_id, fecha) VALUES (?, ?, ?, ?, ?)',
        [descripcion, monto, tipo_pago, categoria_id || null, fecha || null]
    );
    save();
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    res.status(201).json({ id, descripcion, monto, tipo_pago, categoria_id, fecha });
});

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

router.delete('/:id', async (req, res) => {
    const db = await getDb();
    db.run('DELETE FROM gastos WHERE id = ?', [req.params.id]);
    save();
    res.json({ mensaje: 'Gasto eliminado' });
});

module.exports = router;