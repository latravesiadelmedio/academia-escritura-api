const router = require('express').Router();
const multer = require('multer');
const { Readable } = require('stream');
const cloudinary = require('cloudinary').v2;
const Article = require('../models/Article');
const { protect, adminOnly } = require('../middleware/auth');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes.'));
  },
});

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (err, result) => err ? reject(err) : resolve(result)
    );
    Readable.from(buffer).pipe(stream);
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

// POST /api/articles/upload-cover — sube a Cloudinary, devuelve URL
router.post('/upload-cover', protect, adminOnly, upload.single('cover'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No se recibió ninguna imagen.' });
  try {
    const result = await uploadToCloudinary(req.file.buffer, 'academia/covers');
    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ message: 'Error al subir imagen.' });
  }
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
