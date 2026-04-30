const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Article = require('../models/Article');
const { protect, adminOnly } = require('../middleware/auth');

const coversDir = path.join(__dirname, '../../uploads/covers');
fs.mkdirSync(coversDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, coversDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `cover-${Date.now()}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes.'));
  },
});

// GET /api/articles — público, solo publicados, filtro por category opcional
router.get('/', async (req, res) => {
  try {
    const filter = { published: true };
    if (req.query.category) {
      if (req.query.category === 'disparador') {
        filter.$or = [{ category: 'disparador' }, { category: { $exists: false } }];
      } else {
        filter.category = req.query.category;
      }
    }
    const articles = await Article.find(filter).sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/articles/all — admin, todos
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    const articles = await Article.find(filter).sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/articles/:id — público
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findOne({ _id: req.params.id, published: true });
    if (!article) return res.status(404).json({ message: 'Artículo no encontrado.' });
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/articles/upload-cover — sube miniatura, devuelve URL
router.post('/upload-cover', protect, adminOnly, upload.single('cover'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No se recibió ninguna imagen.' });
  const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  res.json({ url: `${baseUrl}/uploads/covers/${req.file.filename}` });
});

// POST /api/articles
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const article = await Article.create(req.body);
    res.status(201).json(article);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/articles/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!article) return res.status(404).json({ message: 'Artículo no encontrado.' });
    res.json(article);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/articles/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: 'Artículo no encontrado.' });
    res.json({ message: 'Artículo eliminado.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
