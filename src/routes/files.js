const router = require('express').Router();
const CourseFile = require('../models/CourseFile');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Verifica acceso al curso desde el token JWT (sin middleware porque
// las peticiones de assets del iframe no envían cabeceras Authorization)
const getCourseAccess = async (req, courseId) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1] || req.query.token;
    if (!token) return false;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return false;
    if (user.isAdmin) return true;
    return user.enrolledCourses.map(id => id.toString()).includes(courseId);
  } catch {
    return false;
  }
};

// GET /api/files/:courseId/:filePath(*)
router.get('/:courseId/*filePath', async (req, res) => {
  try {
    const { courseId, filePath } = req.params;

    // Solo el index.html requiere verificación de acceso
    // Los assets (JS, CSS, imágenes) se sirven libremente una vez que
    // el index.html ha sido autorizado en el iframe
    if (filePath === 'index.html' || filePath.endsWith('/index.html') ||
        filePath === 'genially.html' || filePath.endsWith('/genially.html')) {
      const hasAccess = await getCourseAccess(req, courseId);
      if (!hasAccess) {
        return res.status(403).send('Sin acceso a este curso.');
      }
    }

    const file = await CourseFile.findOne({ courseId, filePath });
    if (!file) return res.status(404).send('Archivo no encontrado.');

    res.set('Content-Type', file.contentType);
    res.send(file.data);
  } catch (err) {
    res.status(500).send('Error al servir el archivo.');
  }
});

module.exports = router;
