const router = require('express').Router();
const User = require('../models/User');
const Course = require('../models/Course');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/users — solo admin
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ isAdmin: false }).populate('enrolledCourses', '_id title');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id — solo admin
router.get('/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('enrolledCourses', '_id title');
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id/access — asignar/quitar cursos a un estudiante (solo admin)
router.put('/:id/access', protect, adminOnly, async (req, res) => {
  try {
    const { courseIds } = req.body;

    // Verificar que todos los cursos existen
    const courses = await Course.find({ _id: { $in: courseIds } });
    if (courses.length !== courseIds.length) {
      return res.status(400).json({ message: 'Uno o más cursos no existen.' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { enrolledCourses: courseIds },
      { new: true }
    ).populate('enrolledCourses', '_id title');

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });

    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/users/:id — solo admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado.' });
    res.json({ message: 'Usuario eliminado.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
