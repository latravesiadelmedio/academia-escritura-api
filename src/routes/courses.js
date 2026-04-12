const router = require('express').Router();
const Course = require('../models/Course');
const { protect, adminOnly } = require('../middleware/auth');

// Filtra las fechas de inicio que ya pasaron (solo para vistas públicas)
const filterExpiredDates = (course) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // comparar por día completo
  const obj = course.toObject();
  obj.startDates = (obj.startDates ?? []).filter(d => new Date(d.date) >= now);
  return obj;
};

// GET /api/courses — público
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ published: true }).select('-geniallyUrl');
    res.json(courses.map(filterExpiredDates));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/courses/:id — público (sin geniallyUrl)
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).select('-geniallyUrl');
    if (!course) return res.status(404).json({ message: 'Curso no encontrado.' });
    res.json(filterExpiredDates(course));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/courses/:id/content — protegido, requiere inscripción
router.get('/:id/content', protect, async (req, res) => {
  try {
    const isEnrolled = req.user.enrolledCourses
      .map(id => id.toString())
      .includes(req.params.id);

    if (!isEnrolled && !req.user.isAdmin) {
      return res.status(403).json({ message: 'No tienes acceso a este curso.' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: 'Curso no encontrado.' });

    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/courses — solo admin
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/courses/:id — solo admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!course) return res.status(404).json({ message: 'Curso no encontrado.' });
    res.json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/courses/:id — solo admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: 'Curso no encontrado.' });
    res.json({ message: 'Curso eliminado.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
