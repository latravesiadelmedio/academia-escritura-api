const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  duration: { type: String, required: true },
});

const courseSchema = new mongoose.Schema(
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
    detailedDescription: {
      type: String,
      default: '',
    },
    level: {
      type: String,
      enum: ['Principiante', 'Intermedio', 'Avanzado', 'Todos los niveles'],
      required: true,
    },
    duration: {
      type: String,
      required: true,
    },
    price: {
      type: String,
      required: true,
    },
    geniallyUrl: {
      type: String,
      default: '',
    },
    contentUrl: {
      type: String,
      default: '',
    },
    objectives: [String],
    modules: [moduleSchema],
    includes: [String],
    published: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
