const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  code:       { type: String, required: true, unique: true, uppercase: true, trim: true },
  department: { type: String, required: true, trim: true },
  semester:   { type: Number, required: true, min: 1, max: 8 },
  teacher:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
