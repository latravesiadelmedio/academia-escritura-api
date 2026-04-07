const mongoose = require('mongoose');

const courseFileSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    required: true,
  },
  data: {
    type: Buffer,
    required: true,
  },
});

courseFileSchema.index({ courseId: 1, filePath: 1 }, { unique: true });

module.exports = mongoose.model('CourseFile', courseFileSchema);
