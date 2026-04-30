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
      enum: ['disparador', 'blog'],
      default: 'disparador',
    },
    coverImage: {
      type: String,
      default: '',
    },
    published: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Article', articleSchema);
