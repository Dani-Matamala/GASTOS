require('dotenv').config();
const express = require('express');
const { initDb } = require('./database/db');
const app = express();

app.use(express.json());

app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/gastos', require('./routes/gastos'));
app.use('/api/cuotas', require('./routes/cuotas'));
app.use('/api/resumen', require('./routes/resumen'));

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;

initDb().then(() => {
  app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
}).catch(err => {
  console.error('Error al inicializar la DB:', err);
  process.exit(1);
});