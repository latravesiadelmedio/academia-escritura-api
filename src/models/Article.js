const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
    },
    category: {
      type: String,
      enum: ['disparador', 'blog', 'que-leer', 'agenda', 'por-donde-empezar', 'servicios'],
      default: 'disparador',
    },
    coverImage: {
      type: String,
      default: '',
    },
    eventDate: {
      type: Date,
      default: null,
    },
    published: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Article', articleSchema);
