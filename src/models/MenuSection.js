const mongoose = require('mongoose');

const menuSectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    emoji: { type: String, default: '📚' },
    slug: { type: String, required: true, unique: true, trim: true },
    published: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuSection', menuSectionSchema);
