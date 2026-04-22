const express = require('express');
const router = express.Router();
const { getDb } = require('../database/db');

router.get('/', async (req, res) => {
  const db = await getDb();
  const { rows } = await db.query('SELECT * FROM categorias ORDER BY nombre');
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const { rows } = await db.query('SELECT * FROM categorias WHERE id = $1', [req.params.id]);
  if (!rows[0]) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  const db = await getDb();
  try {
    const { rows } = await db.query(
      'INSERT INTO categorias (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [nombre, descripcion || null]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    throw e;
  }
});

router.put('/:id', async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  const db = await getDb();
  const { rows } = await db.query(
    'UPDATE categorias SET nombre = $1, descripcion = $2 WHERE id = $3 RETURNING *',
    [nombre, descripcion || null, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Categoría no encontrada' });
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();
  await db.query('DELETE FROM categorias WHERE id = $1', [req.params.id]);
  res.json({ mensaje: 'Categoría eliminada' });
});

module.exports = router;