const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  course:      { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher:     { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  title:       { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  dueDate:     { type: String, required: true },  // YYYY-MM-DD
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
