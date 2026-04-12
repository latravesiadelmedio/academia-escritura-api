const router = require('express').Router();
const Article = require('../models/Article');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/articles — público, solo publicados
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find({ published: true }).sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/articles/all — admin, todos
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/articles — solo admin
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const article = await Article.create(req.body);
    res.status(201).json(article);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/articles/:id — solo admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const article = await Article.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!article) return res.status(404).json({ message: 'Artículo no encontrado.' });
    res.json(article);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/articles/:id — solo admin
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
