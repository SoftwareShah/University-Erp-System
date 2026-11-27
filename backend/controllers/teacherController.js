const { z }        = require('zod');
const Attendance   = require('../models/Attendance');
const Assignment   = require('../models/Assignment');
const Marks        = require('../models/Marks');
const Timetable    = require('../models/Timetable');
const Course       = require('../models/Course');
const User         = require('../models/User');
const ApiError     = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { dateOnlySchema, objectIdSchema } = require('../utils/validation');
const { getDateKey, getRecentDateRange } = require('../utils/dateRange');

// ── Zod schemas ───────────────────────────────────────────────────────────────
const attendanceSchema = z.object({
  courseId: objectIdSchema,
  date:     dateOnlySchema,
  period:   z.number().int().min(1).max(8),
  records:  z.array(z.object({
    studentId: objectIdSchema,
    status:    z.enum(['present', 'absent', 'late']),
  })).min(1).superRefine((records, ctx) => {
    const ids = records.map(record => record.studentId);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', message: 'Each student can only appear once in an attendance submission.' });
    }
  }),
});

const assignmentSchema = z.object({
  courseId:    objectIdSchema,
  title:       z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  dueDate:     dateOnlySchema,
});

const marksSchema = z.object({
  courseId:  objectIdSchema,
  studentId: objectIdSchema,
  examType:  z.enum(['internal', 'midterm', 'final']),
  marks:     z.number().min(0).max(100),
  maxMarks:  z.number().min(1).max(100).default(100),
}).refine(data => data.marks <= data.maxMarks, {
  message: 'Marks cannot exceed the maximum marks.',
  path: ['marks'],
});

// ── GET: Teacher's own profile ────────────────────────────────────────────────
exports.getProfile = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

// ── GET: Courses assigned to this teacher ─────────────────────────────────────
exports.getMyCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find({ teacher: req.user._id });
  res.status(200).json({ success: true, count: courses.length, data: courses });
});

exports.getDashboardSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const today = getDateKey(now);
  const { startDate } = getRecentDateRange(7, now);

  const [courses, assignments, timetable, attendanceSummary] = await Promise.all([
    Course.find({ teacher: req.user._id }).select('name code department semester').lean(),
    Assignment.countDocuments({ teacher: req.user._id }),
    Timetable.find({ teacher: req.user._id }).select('day startTime endTime course').populate('course', 'name code').sort({ day: 1, startTime: 1 }).lean(),
    Attendance.aggregate([
      { $match: { teacher: req.user._id, date: { $gte: startDate, $lte: today } } },
      { $unwind: '$records' },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          attended: { $sum: { $cond: [{ $in: ['$records.status', ['present', 'late']] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const departments = [...new Set(courses.map(course => course.department))];
  const totalStudents = departments.length
    ? await User.countDocuments({ role: 'student', department: { $in: departments }, isActive: true })
    : 0;
  const attendance = attendanceSummary[0] || { total: 0, attended: 0 };
  const todayName = now.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
  const todayClasses = timetable.filter(entry => entry.day === todayName);

  res.status(200).json({
    success: true,
    data: {
      courses,
      assignments,
      timetable,
      todayClasses,
      totalStudents,
      attendanceRate: attendance.total ? Math.round((attendance.attended / attendance.total) * 100) : null,
      attendanceRecords: attendance.total,
      generatedAt: now.toISOString(),
    },
  });
});

// ── GET: Students in a course ─────────────────────────────────────────────────
exports.getCourseStudents = asyncHandler(async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.courseId)) throw new ApiError(400, 'Invalid course ID.');
  const course = await Course.findOne({ _id: req.params.courseId, teacher: req.user._id });
  if (!course) throw new ApiError(404, 'Course not found or not assigned to you.');

  const students = await User.find({ role: 'student', department: course.department })
    .select('name erpId email department');

  res.status(200).json({ success: true, count: students.length, data: students });
});

// ── POST: Mark attendance ─────────────────────────────────────────────────────
exports.markAttendance = asyncHandler(async (req, res) => {
  const parsed = attendanceSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const { courseId, date, period, records } = parsed.data;

  // Verify teacher owns this course
  const course = await Course.findOne({ _id: courseId, teacher: req.user._id });
  if (!course) throw new ApiError(403, 'You are not assigned to this course.');

  const studentIds = [...new Set(records.map(record => record.studentId))];
  const students = await User.find({
    _id: { $in: studentIds },
    role: 'student',
    department: course.department,
  }).select('_id');
  if (students.length !== studentIds.length) {
    throw new ApiError(400, 'Attendance can only be submitted for students enrolled in this course branch.');
  }

  const formatted = records.map(r => ({ student: r.studentId, status: r.status }));

  // Upsert — update if already marked, create if not
  const attendance = await Attendance.findOneAndUpdate(
    { course: courseId, date, period },
    { course: courseId, teacher: req.user._id, date, period, records: formatted },
    { upsert: true, new: true, runValidators: true }
  );

  res.status(200).json({ success: true, message: 'Attendance saved.', data: attendance });
});

// ── GET: Attendance records for a course ─────────────────────────────────────
exports.getAttendance = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!/^[a-f\d]{24}$/i.test(courseId)) throw new ApiError(400, 'Invalid course ID.');

  const course = await Course.findOne({ _id: courseId, teacher: req.user._id });
  if (!course) throw new ApiError(403, 'You are not assigned to this course.');

  const records = await Attendance.find({ course: courseId })
    .populate('records.student', 'name erpId')
    .sort({ date: -1, period: 1 });

  res.status(200).json({ success: true, count: records.length, data: records });
});

// ── POST: Upload assignment ───────────────────────────────────────────────────
exports.uploadAssignment = asyncHandler(async (req, res) => {
  const parsed = assignmentSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const { courseId, title, description, dueDate } = parsed.data;

  const course = await Course.findOne({ _id: courseId, teacher: req.user._id });
  if (!course) throw new ApiError(403, 'You are not assigned to this course.');

  const assignment = await Assignment.create({
    course: courseId,
    teacher: req.user._id,
    title,
    description,
    dueDate,
  });

  res.status(201).json({ success: true, message: 'Assignment uploaded.', data: assignment });
});

// ── PUT: Update an assignment uploaded by this teacher ────────────────────────
exports.updateAssignment = asyncHandler(async (req, res) => {
  const parsed = assignmentSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw new ApiError(400, 'Invalid assignment ID.');

  const { courseId, title, description, dueDate } = parsed.data;
  const course = await Course.findOne({ _id: courseId, teacher: req.user._id });
  if (!course) throw new ApiError(403, 'You are not assigned to this course.');

  const assignment = await Assignment.findOne({ _id: req.params.id, teacher: req.user._id });
  if (!assignment) throw new ApiError(404, 'Assignment not found.');

  assignment.course = courseId;
  assignment.title = title;
  assignment.description = description;
  assignment.dueDate = dueDate;
  await assignment.save();

  res.status(200).json({ success: true, message: 'Assignment updated.', data: assignment });
});

// ── GET: Assignments uploaded by this teacher ─────────────────────────────────
exports.getMyAssignments = asyncHandler(async (req, res) => {
  const assignments = await Assignment.find({ teacher: req.user._id })
    .populate('course', 'name code');
  res.status(200).json({ success: true, count: assignments.length, data: assignments });
});

// ── DELETE: Remove an assignment ──────────────────────────────────────────────
exports.deleteAssignment = asyncHandler(async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw new ApiError(400, 'Invalid assignment ID.');
  const assignment = await Assignment.findOne({ _id: req.params.id, teacher: req.user._id });
  if (!assignment) throw new ApiError(404, 'Assignment not found.');

  await assignment.deleteOne();
  res.status(200).json({ success: true, message: 'Assignment deleted.' });
});

// ── POST: Upload marks ────────────────────────────────────────────────────────
exports.uploadMarks = asyncHandler(async (req, res) => {
  const parsed = marksSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const { courseId, studentId, examType, marks, maxMarks } = parsed.data;

  const course = await Course.findOne({ _id: courseId, teacher: req.user._id });
  if (!course) throw new ApiError(403, 'You are not assigned to this course.');

  const student = await User.findOne({ _id: studentId, role: 'student' });
  if (!student) throw new ApiError(404, 'Student not found.');
  if (student.department !== course.department) {
    throw new ApiError(400, 'Marks can only be uploaded for a student in this course branch.');
  }

  // Upsert marks
  const record = await Marks.findOneAndUpdate(
    { course: courseId, student: studentId, examType },
    { course: courseId, teacher: req.user._id, student: studentId, examType, marks, maxMarks },
    { upsert: true, new: true, runValidators: true }
  );

  res.status(200).json({ success: true, message: 'Marks saved.', data: record });
});

// ── GET: Marks for a course ───────────────────────────────────────────────────
exports.getCourseMarks = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  if (!/^[a-f\d]{24}$/i.test(courseId)) throw new ApiError(400, 'Invalid course ID.');

  const course = await Course.findOne({ _id: courseId, teacher: req.user._id });
  if (!course) throw new ApiError(403, 'You are not assigned to this course.');

  const marks = await Marks.find({ course: courseId })
    .populate('student', 'name erpId');

  res.status(200).json({ success: true, count: marks.length, data: marks });
});

// ── DELETE: Remove a mark record owned by this teacher ────────────────────────
exports.deleteMarks = asyncHandler(async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw new ApiError(400, 'Invalid marks ID.');
  const record = await Marks.findOneAndDelete({ _id: req.params.id, teacher: req.user._id });
  if (!record) throw new ApiError(404, 'Marks record not found.');

  res.status(200).json({ success: true, message: 'Marks record deleted.' });
});

// ── GET: Timetable for this teacher ──────────────────────────────────────────
exports.getMyTimetable = asyncHandler(async (req, res) => {
  const timetable = await Timetable.find({ teacher: req.user._id })
    .populate('course', 'name code')
    .sort({ day: 1, startTime: 1 });

  res.status(200).json({ success: true, data: timetable });
});
