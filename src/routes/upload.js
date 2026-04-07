const router = require('express').Router();
const multer = require('multer');
const AdmZip = require('adm-zip');
const mime = require('mime-types');
const Course = require('../models/Course');
const CourseFile = require('../models/CourseFile');
const { protect, adminOnly } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'application/zip' ||
      file.mimetype === 'application/x-zip-compressed' ||
      file.originalname.endsWith('.zip')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan archivos ZIP.'));
    }
  },
});

// POST /api/upload/:courseId — solo admin
router.post('/:courseId', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Curso no encontrado.' });
    if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo.' });

    const zip = new AdmZip(req.file.buffer);
    const entries = zip.getEntries();

    // Eliminar archivos anteriores del curso
    await CourseFile.deleteMany({ courseId });

    let indexPath = null;

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const filePath = entry.entryName;
      const data = entry.getData();
      const contentType = mime.lookup(filePath) || 'application/octet-stream';

      await CourseFile.create({ courseId, filePath, contentType, data });

      // Detectar el HTML principal (index.html o genially.html)
      if (!indexPath && (filePath.endsWith('index.html') || filePath.endsWith('genially.html'))) {
        indexPath = filePath;
      }
    }

    if (!indexPath) {
      await CourseFile.deleteMany({ courseId });
      return res.status(400).json({ message: 'No se encontró index.html en el ZIP.' });
    }

    const contentUrl = `/api/files/${courseId}/${indexPath}`;
    await Course.findByIdAndUpdate(courseId, { contentUrl });

    res.json({ message: 'Contenido subido correctamente.', contentUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/upload/:courseId — eliminar contenido
router.delete('/:courseId', protect, adminOnly, async (req, res) => {
  try {
    await CourseFile.deleteMany({ courseId: req.params.courseId });
    await Course.findByIdAndUpdate(req.params.courseId, { contentUrl: '' });
    res.json({ message: 'Contenido eliminado.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
