const mongoose = require('mongoose');

const academicProgramSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  branch:    { type: String, required: true, trim: true },
  erpPrefix: { type: String, required: true, trim: true, uppercase: true },
}, { timestamps: true });

academicProgramSchema.index({ name: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model('AcademicProgram', academicProgramSchema);
