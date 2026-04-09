const router = require('express').Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../utils/email');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Ya existe una cuenta con ese email.' });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        enrolledCourses: user.enrolledCourses,
      },
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
    }

    const user = await User.findOne({ email }).select('+password').populate('enrolledCourses', '_id title');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Email o contraseña incorrectos.' });
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        enrolledCourses: user.enrolledCourses.map(c => c._id),
        completedCourses: (user.completedCourses ?? []).map(c => c.toString()),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/me  — devuelve el usuario actual
router.get('/me', protect, async (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
      enrolledCourses: req.user.enrolledCourses,
      completedCourses: (req.user.completedCourses ?? []).map(c => c.toString()),
    },
  });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email requerido.' });

    const user = await User.findOne({ email });
    // Responder igual aunque no exista el usuario (evita enumerar emails)
    if (!user) return res.json({ message: 'Si ese email existe, recibirás un enlace en breve.' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hora
    await user.save({ validateBeforeSave: false });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;

    try {
      await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
    } catch (emailErr) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ message: 'Error al enviar el email. Intentá de nuevo.' });
    }

    res.json({ message: 'Si ese email existe, recibirás un enlace en breve.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'El enlace es inválido o ya expiró.' });

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = signToken(user._id);
    res.json({ message: 'Contraseña actualizada.', token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
