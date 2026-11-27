const mongoose = require('mongoose');

const changeLogSchema = new mongoose.Schema({
  changedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changedAt:   { type: Date, default: Date.now },
  field:       { type: String },          // e.g. 'teacher', 'room', 'time'
  oldValue:    { type: String },
  newValue:    { type: String },
  note:        { type: String, default: '' },
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  course:    { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  teacher:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  day:       { type: String, enum: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], required: true },
  startTime: { type: String, required: true },
  endTime:   { type: String, required: true },
  room:      { type: String, trim: true },
  changeLog: { type: [changeLogSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Timetable', timetableSchema);
