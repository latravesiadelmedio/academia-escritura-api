require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const userRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const filesRoutes = require('./routes/files');
const articleRoutes = require('./routes/articles');
const contactRoutes = require('./routes/contact');
const menuRoutes = require('./routes/menu');
const MenuSection = require('./models/MenuSection');

const DEFAULT_SECTIONS = [
  { title: 'Cursos Online',          description: 'Talleres y cursos de escritura creativa a tu ritmo.',                    emoji: '🎓', slug: 'cursos',              order: 0 },
  { title: 'Corrección de textos',   description: 'Revisión profesional de tesis y textos académicos.',                    emoji: '✏️', slug: 'servicios',           order: 1 },
  { title: '¿Qué leer?',             description: 'Recomendaciones y listas de lectura literaria.',                         emoji: '📖', slug: 'que-leer',            order: 2 },
  { title: 'Agenda Literaria',       description: 'Eventos, ferias y actividades del mundo literario.',                    emoji: '📅', slug: 'agenda',              order: 3 },
  { title: 'Blog literario',         description: 'Reflexiones sobre escritura, lectura y literatura.',                    emoji: '🖋️', slug: 'blog',                order: 4 },
  { title: 'Por dónde empezar',      description: 'Una guía para quienes llegan por primera vez.',                         emoji: '🧭', slug: 'por-donde-empezar',   order: 5 },
  { title: 'Disparadores',           description: 'Consignas para ejercitar la escritura sin presión.',                    emoji: '⚡', slug: 'disparadores',        order: 6 },
];

const seedMenu = async () => {
  const count = await MenuSection.countDocuments();
  if (count === 0) {
    await MenuSection.insertMany(DEFAULT_SECTIONS);
    console.log('Secciones del menú inicializadas.');
  }
};

const app = express();

app.set('trust proxy', 1); // Render corre detrás de un proxy
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:4173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    callback(null, false);
  },
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,
  message: { message: 'Demasiados intentos. Intentá de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/menu', menuRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));


app.use((req, res) => res.status(404).json({ message: 'Ruta no encontrada.' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor.' });
});

const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Conectado a MongoDB');
    await seedMenu();
    app.listen(PORT, () => console.log(`Servidor corriendo en http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('Error conectando a MongoDB:', err.message);
    process.exit(1);
  });
