const Attendance   = require('../models/Attendance');
const Assignment   = require('../models/Assignment');
const Marks        = require('../models/Marks');
const Timetable    = require('../models/Timetable');
const Course       = require('../models/Course');
const User         = require('../models/User');
const ApiError     = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// ── GET: Student's own profile ────────────────────────────────────────────────
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('-password')
    .populate('program', 'name branch');
  if (!user) throw new ApiError(404, 'User not found.');
  res.status(200).json({ success: true, data: user });
});

// ── GET: Courses in student's department ─────────────────────────────────────
exports.getMyCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ department: req.user.department })
    .populate('teacher', 'name empId');
  res.status(200).json({ success: true, count: courses.length, data: courses });
});

// ── GET: Attendance summary for the student ───────────────────────────────────
// Returns per-course attendance % 
exports.getMyAttendance = asyncHandler(async (req, res) => {
  const courses = await Course.find({ department: req.user.department })
    .select('_id name code')
    .lean();
  const attendanceByCourse = await Attendance.aggregate([
    { $match: { course: { $in: courses.map(course => course._id) }, 'records.student': req.user._id } },
    { $unwind: '$records' },
    { $match: { 'records.student': req.user._id } },
    {
      $group: {
        _id: '$course',
        total: { $sum: 1 },
        presentOnly: { $sum: { $cond: [{ $eq: ['$records.status', 'present'] }, 1, 0] } },
        present: { $sum: { $cond: [{ $in: ['$records.status', ['present', 'late']] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ['$records.status', 'late'] }, 1, 0] } },
      },
    },
  ]);
  const byCourseId = new Map(attendanceByCourse.map(item => [String(item._id), item]));
  const summary = courses.map(course => {
    const records = byCourseId.get(String(course._id)) || { total: 0, present: 0, presentOnly: 0, late: 0 };
    const absent = records.total - records.present;
    return {
      course: { id: course._id, name: course.name, code: course.code },
      total: records.total,
      present: records.present,
      presentOnly: records.presentOnly,
      late: records.late,
      absent,
      percentage: records.total ? Math.round((records.present / records.total) * 100) : 0,
    };
  });

  res.status(200).json({ success: true, data: summary });
});

// ── GET: Detailed attendance for one course ───────────────────────────────────
exports.getCourseAttendance = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!/^[a-f\d]{24}$/i.test(courseId)) throw new ApiError(400, 'Invalid course ID.');

  const course = await Course.findOne({ _id: courseId, department: req.user.department });
  if (!course) throw new ApiError(404, 'Course not found.');

  const records = await Attendance.find({ course: courseId }).sort({ date: -1, period: 1 });

  const detail = records.map(doc => {
    const myRecord = doc.records.find(r => r.student.toString() === req.user._id.toString());
    return {
      date:   doc.date,
      period: doc.period,
      status: myRecord ? myRecord.status : 'not marked',
    };
  });

  res.status(200).json({ success: true, course: course.name, data: detail });
});

// ── GET: Marks for the student ────────────────────────────────────────────────
exports.getMyMarks = asyncHandler(async (req, res) => {
  const marks = await Marks.find({ student: req.user._id })
    .populate('course', 'name code');

  // Group by course
  const grouped = {};
  marks.forEach(m => {
    if (!m.course) return;
    const key = m.course._id.toString();
    if (!grouped[key]) {
      grouped[key] = { course: m.course.name, code: m.course.code, exams: [] };
    }
    grouped[key].exams.push({
      examType: m.examType,
      marks:    m.marks,
      maxMarks: m.maxMarks,
      grade:    calcGrade(m.marks, m.maxMarks),
    });
  });

  res.status(200).json({ success: true, data: Object.values(grouped) });
});

// ── GET: Timetable for student's department ───────────────────────────────────
exports.getMyTimetable = asyncHandler(async (req, res) => {
  const courses = await Course.find({ department: req.user.department }).select('_id');
  const courseIds = courses.map(c => c._id);

  const timetable = await Timetable.find({ course: { $in: courseIds } })
    .populate('course',  'name code')
    .populate('teacher', 'name')
    .sort({ day: 1, startTime: 1 });

  res.status(200).json({ success: true, data: timetable });
});

// ── GET: Assignments for student's department ─────────────────────────────────
exports.getMyAssignments = asyncHandler(async (req, res) => {
  const courses = await Course.find({ department: req.user.department }).select('_id');
  const courseIds = courses.map(c => c._id);

  const assignments = await Assignment.find({ course: { $in: courseIds } })
    .populate('course',  'name code')
    .populate('teacher', 'name')
    .sort({ dueDate: 1 });

  res.status(200).json({ success: true, count: assignments.length, data: assignments });
});

// ── Helper: grade calculator ──────────────────────────────────────────────────
const calcGrade = (marks, maxMarks) => {
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
};
