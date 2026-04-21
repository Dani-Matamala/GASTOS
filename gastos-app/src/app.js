require('dotenv').config();
const express = require('express');
const app = express();

app.use(express.json());

app.use('/api/categorias', require('./routes/categorias'));
app.use('/api/gastos', require('./routes/gastos'));
app.use('/api/cuotas', require('./routes/cuotas'));
app.use('/api/resumen', require('./routes/resumen'));

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});