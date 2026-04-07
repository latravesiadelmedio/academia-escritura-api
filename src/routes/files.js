const router = require('express').Router();
const CourseFile = require('../models/CourseFile');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

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

const isMainFile = (filePath) =>
  filePath === 'index.html' || filePath === 'genially.html' ||
  filePath.endsWith('/index.html') || filePath.endsWith('/genially.html');

// GET /api/files/:courseId/:filePath(*)
router.get('/:courseId/*filePath', async (req, res) => {
  try {
    const { courseId } = req.params;
    // En Express 5, params con wildcard pueden ser array o string
    const raw = req.params.filePath;
    const filePath = (Array.isArray(raw) ? raw.join('/') : (raw || '')).replace(/^\/+/, '');

    console.log(`[files] courseId=${courseId} filePath=${filePath}`);

    if (isMainFile(filePath)) {
      const hasAccess = await getCourseAccess(req, courseId);
      if (!hasAccess) {
        return res.status(403).send('Sin acceso a este curso.');
      }
    }

    const file = await CourseFile.findOne({ courseId, filePath });

    if (!file) {
      console.log(`[files] NOT FOUND: courseId=${courseId} filePath=${filePath}`);
      return res.status(404).send('Archivo no encontrado.');
    }

    res.set('Content-Type', file.contentType);
    res.send(file.data);
  } catch (err) {
    console.error('[files] Error:', err.message);
    res.status(500).send(`Error al servir el archivo: ${err.message}`);
  }
});

module.exports = router;
