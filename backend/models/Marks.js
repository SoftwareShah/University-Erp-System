const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  course:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  student:  { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  examType: { type: String, enum: ['internal', 'midterm', 'final'], required: true },
  marks:    { type: Number, required: true, min: 0 },
  maxMarks: { type: Number, required: true, min: 1 },
}, { timestamps: true });

marksSchema.index({ student: 1, course: 1, examType: 1 }, { unique: true });

module.exports = mongoose.model('Marks', marksSchema);
