require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');

const app = express();

// Crear carpeta de uploads si no existe
const uploadsDir = path.join(__dirname, '../uploads/cursos');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

// Servir archivos estáticos de cursos (sin autenticación a nivel HTTP,
// el acceso real lo controla el frontend con JWT)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada.' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conectado a MongoDB');
    app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Error conectando a MongoDB:', err.message);
    process.exit(1);
  });
