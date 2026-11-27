const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  course:  { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  date:    { type: String, required: true }, 
  period:  { type: Number, required: true, min: 1, max: 8 },
  records: [
    {
      student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      status:  { type: String, enum: ['present', 'absent', 'late'], default: 'absent' },
    }
  ],
}, { timestamps: true });

attendanceSchema.index({ course: 1, date: 1, period: 1 }, { unique: true });
attendanceSchema.index({ course: 1, 'records.student': 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
