const router = require('express').Router();
const MenuSection = require('../models/MenuSection');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/menu — público, solo publicados, ordenados
router.get('/', async (req, res) => {
  try {
    const sections = await MenuSection.find({ published: true }).sort({ order: 1, createdAt: 1 });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/menu/all — admin
router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const sections = await MenuSection.find().sort({ order: 1, createdAt: 1 });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/menu
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const section = await MenuSection.create(req.body);
    res.status(201).json(section);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/menu/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const section = await MenuSection.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!section) return res.status(404).json({ message: 'Sección no encontrada.' });
    res.json(section);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/menu/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await MenuSection.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sección eliminada.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
