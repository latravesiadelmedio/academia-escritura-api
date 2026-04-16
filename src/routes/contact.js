const router = require('express').Router();
const { sendContactEmail } = require('../utils/email');

// POST /api/contact
router.post('/', async (req, res) => {
  try {
    const { nombre, email, tema, mensaje } = req.body;
    if (!nombre || !email || !mensaje) {
      return res.status(400).json({ message: 'Nombre, email y mensaje son obligatorios.' });
    }

    await sendContactEmail({ nombre, email, tema, mensaje });
    res.json({ message: 'Mensaje enviado correctamente.' });
  } catch (err) {
    console.error('Error enviando email de contacto:', err.message);
    res.status(500).json({ message: 'No se pudo enviar el mensaje. Intentá de nuevo.' });
  }
});

module.exports = router;
