const express = require('express');
const router = express.Router();
const { getDb, save } = require('../database/db');

router.get('/', async (req, res) => {
  const db = await getDb();
  const result = db.exec('SELECT * FROM categorias ORDER BY nombre');
  const categorias = result[0]
    ? result[0].values.map(row => ({
        id: row[0], nombre: row[1], descripcion: row[2], created_at: row[3]
      }))
    : [];
  res.json(categorias);
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const result = db.exec('SELECT * FROM categorias WHERE id = ?', [req.params.id]);
  if (!result[0]) return res.status(404).json({ error: 'Categoría no encontrada' });
  const r = result[0].values[0];
  res.json({ id: r[0], nombre: r[1], descripcion: r[2], created_at: r[3] });
});

router.post('/', async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  const db = await getDb();
  try {
    db.run('INSERT INTO categorias (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion || null]);
    save();
    const result = db.exec('SELECT last_insert_rowid() as id');
    const id = result[0].values[0][0];
    res.status(201).json({ id, nombre, descripcion });
  } catch (e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Ya existe una categoría con ese nombre' });
    throw e;
  }
});

router.put('/:id', async (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  const db = await getDb();
  db.run('UPDATE categorias SET nombre = ?, descripcion = ? WHERE id = ?', [nombre, descripcion || null, req.params.id]);
  save();
  res.json({ id: Number(req.params.id), nombre, descripcion });
});

router.delete('/:id', async (req, res) => {
  const db = await getDb();
  db.run('DELETE FROM categorias WHERE id = ?', [req.params.id]);
  save();
  res.json({ mensaje: 'Categoría eliminada' });
});

module.exports = router;