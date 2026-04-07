const router = require('express').Router();
const multer = require('multer');
const AdmZip = require('adm-zip');
const path = require('path');
const fs = require('fs');
const Course = require('../models/Course');
const { protect, adminOnly } = require('../middleware/auth');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/zip' ||
        file.mimetype === 'application/x-zip-compressed' ||
        file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se aceptan archivos ZIP.'));
    }
  },
});

const UPLOADS_DIR = path.join(__dirname, '../../uploads/cursos');

// POST /api/upload/:courseId — solo admin
router.post('/:courseId', protect, adminOnly, upload.single('file'), async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Curso no encontrado.' });

    if (!req.file) return res.status(400).json({ message: 'No se recibió ningún archivo.' });

    // Extraer zip en uploads/cursos/:courseId/
    const destDir = path.join(UPLOADS_DIR, courseId);
    if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true });
    fs.mkdirSync(destDir, { recursive: true });

    const zip = new AdmZip(req.file.buffer);
    zip.extractAllTo(destDir, true);

    // Buscar el index.html (puede estar en la raíz o en una subcarpeta)
    const findIndex = (dir) => {
      for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        if (entry === 'index.html') return full;
        if (fs.statSync(full).isDirectory()) {
          const found = findIndex(full);
          if (found) return found;
        }
      }
      return null;
    };

    const indexPath = findIndex(destDir);
    if (!indexPath) {
      fs.rmSync(destDir, { recursive: true });
      return res.status(400).json({ message: 'No se encontró index.html en el ZIP.' });
    }

    // URL relativa al index.html desde uploads/cursos/:courseId/
    const relativePath = path.relative(UPLOADS_DIR, indexPath).replace(/\\/g, '/');
    const contentUrl = `/uploads/cursos/${relativePath}`;

    await Course.findByIdAndUpdate(courseId, { contentUrl });

    res.json({ message: 'Contenido subido correctamente.', contentUrl });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/upload/:courseId — eliminar contenido subido
router.delete('/:courseId', protect, adminOnly, async (req, res) => {
  try {
    const destDir = path.join(UPLOADS_DIR, req.params.courseId);
    if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true });
    await Course.findByIdAndUpdate(req.params.courseId, { contentUrl: '' });
    res.json({ message: 'Contenido eliminado.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
