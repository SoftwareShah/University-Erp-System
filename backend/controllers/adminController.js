const path         = require('path');
const fs           = require('fs');
const crypto       = require('crypto');
const User         = require('../models/User');
const Course       = require('../models/Course');
const AcademicProgram = require('../models/AcademicProgram');
const uploadDirectory = require('../config/uploadDirectory');
const Timetable    = require('../models/Timetable');
const Attendance   = require('../models/Attendance');
const Assignment   = require('../models/Assignment');
const Marks        = require('../models/Marks');
const ApiError     = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { z }        = require('zod');
const { dateOnlySchema } = require('../utils/validation');
const { getDateKey, getRecentDateRange } = require('../utils/dateRange');

exports.getDashboardSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const today = getDateKey(now);
  const { startDate: weekStart } = getRecentDateRange(7, now);
  const { startDate: monthStart } = getRecentDateRange(now.getUTCDate(), now);
  const { startDate: monthAttendanceStart } = getRecentDateRange(30, now);

  const [
    totalStudents,
    activeStudents,
    instructors,
    activeInstructors,
    courses,
    programs,
    assignments,
    marks,
    newStudentsThisMonth,
    enrollmentByBranch,
    dailyAttendance,
    courseAttendance,
    recentEnrollments,
  ] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'student', isActive: true }),
    User.countDocuments({ role: 'teacher' }),
    User.countDocuments({ role: 'teacher', isActive: true }),
    Course.countDocuments(),
    AcademicProgram.countDocuments(),
    Assignment.countDocuments(),
    Marks.countDocuments(),
    User.countDocuments({
      role: 'student',
      createdAt: { $gte: new Date(`${monthStart}T00:00:00.000Z`), $lte: now },
    }),
    User.aggregate([
      { $match: { role: 'student' } },
      {
        $group: {
          _id: { $ifNull: ['$department', 'Unassigned'] },
          students: { $sum: 1 },
          activeStudents: { $sum: { $cond: ['$isActive', 1, 0] } },
        },
      },
      { $sort: { students: -1, _id: 1 } },
    ]),
    Attendance.aggregate([
      { $match: { date: { $gte: weekStart, $lte: today } } },
      { $unwind: '$records' },
      {
        $group: {
          _id: '$date',
          total: { $sum: 1 },
          attended: { $sum: { $cond: [{ $in: ['$records.status', ['present', 'late']] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$records.status', 'absent'] }, 1, 0] } },
          late: { $sum: { $cond: [{ $eq: ['$records.status', 'late'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Attendance.aggregate([
      { $match: { date: { $gte: monthAttendanceStart, $lte: today } } },
      { $unwind: '$records' },
      {
        $group: {
          _id: '$course',
          total: { $sum: 1 },
          attended: { $sum: { $cond: [{ $in: ['$records.status', ['present', 'late']] }, 1, 0] } },
          absent: { $sum: { $cond: [{ $eq: ['$records.status', 'absent'] }, 1, 0] } },
        },
      },
    ]),
    User.find({ role: 'student' })
      .select('name erpId department admissionDate avatar createdAt')
      .populate('program', 'name branch')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean(),
  ]);

  const attendanceByDate = new Map(dailyAttendance.map(item => [item._id, item]));
  const attendanceTrend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${weekStart}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + index);
    const key = getDateKey(date);
    const item = attendanceByDate.get(key);
    return {
      date: key,
      total: item?.total || 0,
      attended: item?.attended || 0,
      absent: item?.absent || 0,
      late: item?.late || 0,
    };
  });

  const attendanceTotals = attendanceTrend.reduce((totals, day) => ({
    total: totals.total + day.total,
    attended: totals.attended + day.attended,
    absent: totals.absent + day.absent,
  }), { total: 0, attended: 0, absent: 0 });
  const coursesById = await Course.find()
    .select('name code department')
    .sort({ name: 1 })
    .lean();
  const attendanceByCourseId = new Map(courseAttendance.map(item => [String(item._id), item]));

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalStudents,
        activeStudents,
        instructors,
        activeInstructors,
        courses,
        programs,
        assignments,
        marks,
        newStudentsThisMonth,
        attendanceRate: attendanceTotals.total
          ? Math.round((attendanceTotals.attended / attendanceTotals.total) * 100)
          : null,
        attendanceRecords: attendanceTotals.total,
        absentRecords: attendanceTotals.absent,
      },
      enrollmentByBranch: enrollmentByBranch.map(item => ({
        branch: item._id,
        students: item.students,
        activeStudents: item.activeStudents,
      })),
      attendanceTrend,
      attendanceByCourse: coursesById.map(course => {
        const summary = attendanceByCourseId.get(String(course._id));
        const total = summary?.total || 0;
        return {
          _id: course._id,
          name: course.name,
          code: course.code,
          department: course.department,
          total,
          attended: summary?.attended || 0,
          absent: summary?.absent || 0,
          attendanceRate: total ? Math.round((summary.attended / total) * 100) : null,
        };
      }),
      recentEnrollments,
      generatedAt: now.toISOString(),
    },
  });
});

// ── ERP ID generator ──────────────────────────────────────────────────────────
const BRANCH_MAP = {
  'Computer Science & Engineering':  'BTCSE',
  'Electronics & Communication':     'BTECE',
  'Mechanical Engineering':          'BTME',
  'Civil Engineering':               'BTCE',
  'Business Administration':         'BBA',
  'Pharmacy':                        'BPHARM',
  'Law':                             'LLB',
  'Agriculture':                     'BAGRI',
  'Hotel Management':                'BHM',
  'Architecture':                    'BARCH',
};

const studentFields = z.object({
  name: z.string().trim().min(3, 'Full name must be at least 3 characters.').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  mobile: z.string().trim().regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits.'),
  dob: dateOnlySchema,
  admissionDate: dateOnlySchema.optional(),
  programId: z.string().regex(/^[a-f\d]{24}$/i, 'Select a valid academic program.'),
  address: z.string().trim().max(200, 'Address must be 200 characters or fewer.').optional(),
  registrationNo: z.string().trim().max(50).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().or(z.literal('')),
  bloodGroup: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional().or(z.literal('')),
  college: z.string().trim().max(150).optional(),
  session: z.string().trim().max(30).optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
  rollNo: z.string().trim().max(30).optional(),
  quota: z.string().trim().max(60).optional(),
  section: z.string().trim().max(20).optional(),
  lateralEntry: z.preprocess(value => value === true || value === 'true', z.boolean()).optional(),
  status: z.enum(['active', 'inactive', 'graduated', 'withdrawn']).optional(),
  feeCategory: z.string().trim().max(60).optional(),
  fatherName: z.string().trim().min(1, 'Father name is required.').max(100),
  fatherMobile: z.union([z.string().trim().regex(/^\d{10}$/, 'Father mobile must be 10 digits.'), z.literal('')]).optional(),
  fatherEmail: z.union([z.string().trim().toLowerCase().email('Enter a valid father email address.'), z.literal('')]).optional(),
  motherName: z.string().trim().min(1, 'Mother name is required.').max(100),
  motherMobile: z.union([z.string().trim().regex(/^\d{10}$/, 'Mother mobile must be 10 digits.'), z.literal('')]).optional(),
  motherEmail: z.union([z.string().trim().toLowerCase().email('Enter a valid mother email address.'), z.literal('')]).optional(),
});
const studentRegistrationFields = studentFields.extend({
  fatherName: z.string().trim().min(1, 'Father name is required.').max(100),
  motherName: z.string().trim().min(1, 'Mother name is required.').max(100),
});

const instructorFields = z.object({
  name: z.string().trim().min(3, 'Full name must be at least 3 characters.').max(60),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.'),
  mobile: z.string().trim().regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits.'),
  department: z.string().trim().min(2).max(100),
  empId: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4,20}$/, 'Employee ID must be 4–20 uppercase letters or digits.').optional(),
  dob: dateOnlySchema,
});

const academicProgramSchema = z.object({
  name: z.string().trim().min(2, 'Program name must be at least 2 characters.').max(100),
  branch: z.string().trim().min(2, 'Branch name must be at least 2 characters.').max(100),
  erpPrefix: z.string().trim().toUpperCase()
    .regex(/^[A-Z0-9]{2,10}$/, 'ERP ID prefix must contain 2–10 letters or digits.'),
});

const courseSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{2,20}$/, 'Course code must contain 2–20 letters, digits or hyphens.'),
  department: z.string().trim().min(2).max(100),
  semester: z.coerce.number().int().min(1).max(8),
  teacherId: z.string().regex(/^[a-f\d]{24}$/i, 'Select a valid instructor.').optional().or(z.literal('')),
});

const timetableSchema = z.object({
  courseId: z.string().regex(/^[a-f\d]{24}$/i, 'Select a valid course.'),
  teacherId: z.string().regex(/^[a-f\d]{24}$/i, 'Select a valid instructor.'),
  day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must use 24-hour HH:MM format.'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'End time must use 24-hour HH:MM format.'),
  room: z.string().trim().max(50).optional(),
});

const isObjectId = value => /^[a-f\d]{24}$/i.test(value);

const generateErpId = async (department, customPrefix) => {
  const yy     = String(new Date().getFullYear()).slice(-2);
  const branch = customPrefix || BRANCH_MAP[department] || 'GEN';
  for (let i = 0; i < 10; i++) {
    const num   = String(Math.floor(1000 + Math.random() * 9000));
    const erpId = `${yy}${branch}${num}`;
    if (!(await User.findOne({ erpId }))) return erpId;
  }
  throw new ApiError(500, 'Could not generate unique ERP ID. Try again.');
};

const generateEmployeeId = async () => {
  const year = String(new Date().getFullYear()).slice(-2);
  for (let attempt = 0; attempt < 10; attempt++) {
    const empId = `EMP${year}${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    if (!await User.exists({ empId })) return empId;
  }
  throw new ApiError(500, 'Could not generate a unique employee ID. Try again.');
};

// ── Helper: delete avatar file from disk ─────────────────────────────────────
const removeAvatarFile = (avatarUrl) => {
  if (!avatarUrl) return;
  const filePath = path.join(uploadDirectory, 'profiles', path.basename(avatarUrl));
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

// ═══════════════════════════════════════════════════════════════════════════════
//  STUDENT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

exports.listStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student' }).select('-password')
    .populate('program', 'name branch').sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: students.length, data: students });
});

exports.getStudent = asyncHandler(async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw new ApiError(400, 'Invalid student ID.');
  const student = await User.findOne({ _id: req.params.id, role: 'student' })
    .select('-password').populate('program', 'name branch');
  if (!student) throw new ApiError(404, 'Student not found.');
  res.status(200).json({ success: true, data: student });
});

exports.registerStudent = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const parsed = studentRegistrationFields.safeParse({
    ...body,
    admissionDate: body.admissionDate || new Date().toISOString().slice(0, 10),
  });
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);
  const {
    name, email, mobile, dob, admissionDate, programId, address,
    fatherName, fatherMobile, fatherEmail, motherName, motherMobile, motherEmail,
    ...academicDetails
  } = parsed.data;

  if (await User.findOne({ email }))  throw new ApiError(409, 'Email already registered.');
  if (await User.findOne({ mobile })) throw new ApiError(409, 'Mobile number already registered.');

  const program = await AcademicProgram.findById(programId);
  if (!program) throw new ApiError(400, 'Selected academic program was not found. Refresh and try again.');

  const erpId     = await generateErpId(program.branch, program.erpPrefix);
  const avatarUrl = req.file ? `/uploads/profiles/${req.file.filename}` : null;

  const student = await User.create({
    name, email, mobile, department: program.branch, program: program._id,
    dob, admissionDate, address, erpId, role: 'student', avatar: avatarUrl,
    ...academicDetails, fatherName, fatherMobile, fatherEmail,
    motherName, motherMobile, motherEmail,
  });

  res.status(201).json({
    success: true,
    message: `Student registered. ERP ID: ${erpId}`,
    data: {
      id: student._id, name: student.name, email: student.email, erpId: student.erpId,
      department: student.department, program: { _id: program._id, name: program.name, branch: program.branch },
      admissionDate: student.admissionDate, avatar: student.avatar, isActive: student.isActive,
      fatherName: student.fatherName, motherName: student.motherName,
    },
  });
});

exports.updateStudent = asyncHandler(async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw new ApiError(400, 'Invalid student ID.');
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new ApiError(404, 'Student not found.');

  const studentUpdateSchema = studentFields.partial().omit({ programId: true }).extend({
    programId: studentFields.shape.programId.optional(),
    bio: z.string().trim().max(300).optional(),
  });
  const parsed = studentUpdateSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);
  const updates = parsed.data;
  const fatherName = updates.fatherName ?? student.fatherName;
  const motherName = updates.motherName ?? student.motherName;
  if (!fatherName?.trim()) throw new ApiError(400, 'Father name is required.');
  if (!motherName?.trim()) throw new ApiError(400, 'Mother name is required.');

  if (updates.email && await User.findOne({ email: updates.email, _id: { $ne: student._id } })) {
    throw new ApiError(409, 'Email already registered.');
  }
  if (updates.mobile && await User.findOne({ mobile: updates.mobile, _id: { $ne: student._id } })) {
    throw new ApiError(409, 'Mobile number already registered.');
  }

  let newProgram;
  if (updates.programId) {
    newProgram = await AcademicProgram.findById(updates.programId);
    if (!newProgram) throw new ApiError(400, 'Selected academic program was not found. Refresh and try again.');
    student.program = newProgram._id;
    student.department = newProgram.branch;
  }

  [
    'name', 'email', 'mobile', 'dob', 'admissionDate', 'address', 'bio',
    'registrationNo', 'gender', 'bloodGroup', 'college', 'session', 'semester',
    'rollNo', 'quota', 'section', 'lateralEntry', 'status', 'feeCategory',
    'fatherName', 'fatherMobile', 'fatherEmail', 'motherName', 'motherMobile', 'motherEmail',
  ].forEach(field => {
    if (updates[field] !== undefined) student[field] = updates[field];
  });
  if (updates.status !== undefined) student.isActive = updates.status === 'active';

  const previousAvatar = student.avatar;
  if (req.file) student.avatar = `/uploads/profiles/${req.file.filename}`;

  await student.save();
  await student.populate('program', 'name branch');
  if (req.file) removeAvatarFile(previousAvatar);
  res.status(200).json({ success: true, message: 'Student updated.', data: student });
});

exports.listAcademicPrograms = asyncHandler(async (req, res) => {
  const programs = await AcademicProgram.find().sort({ branch: 1, name: 1 });
  res.status(200).json({ success: true, count: programs.length, data: programs });
});

exports.createAcademicProgram = asyncHandler(async (req, res) => {
  const parsed = academicProgramSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

  const duplicate = await AcademicProgram.findOne({
    name: parsed.data.name,
    branch: parsed.data.branch,
  });
  if (duplicate) throw new ApiError(409, 'This program is already registered for that branch.');

  const program = await AcademicProgram.create(parsed.data);
  res.status(201).json({ success: true, message: 'Academic program added.', data: program });
});

exports.deleteAcademicProgram = asyncHandler(async (req, res) => {
  if (!/^[a-f\d]{24}$/i.test(req.params.id)) throw new ApiError(400, 'Invalid academic program ID.');
  const program = await AcademicProgram.findById(req.params.id);
  if (!program) throw new ApiError(404, 'Academic program not found.');

  if (await User.exists({ role: 'student', program: program._id })) {
    throw new ApiError(409, 'This program has enrolled students and cannot be deleted.');
  }
  const otherBranchPrograms = await AcademicProgram.exists({
    branch: program.branch,
    _id: { $ne: program._id },
  });
  if (!otherBranchPrograms && await Course.exists({ department: program.branch })) {
    throw new ApiError(409, 'This branch has courses and cannot be removed.');
  }

  await program.deleteOne();
  res.status(200).json({ success: true, message: 'Academic program deleted.' });
});

exports.toggleStudent = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) throw new ApiError(400, 'Invalid student ID.');
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new ApiError(404, 'Student not found.');
  student.isActive = !student.isActive;
  student.status = student.isActive ? 'active' : 'inactive';
  await student.save();
  res.status(200).json({ success: true, message: `Student ${student.isActive ? 'activated' : 'disabled'}.`, isActive: student.isActive });
});

exports.deleteStudent = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) throw new ApiError(400, 'Invalid student ID.');
  const student = await User.findOne({ _id: req.params.id, role: 'student' });
  if (!student) throw new ApiError(404, 'Student not found.');
  const [attendance, marks] = await Promise.all([
    Attendance.exists({ 'records.student': student._id }),
    Marks.exists({ student: student._id }),
  ]);
  if (attendance || marks) {
    throw new ApiError(409, 'This student has academic records and cannot be deleted.');
  }
  await student.deleteOne();
  removeAvatarFile(student.avatar);
  res.status(200).json({ success: true, message: 'Student deleted.' });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  INSTRUCTOR MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

exports.listInstructors = asyncHandler(async (req, res) => {
  const instructors = await User.find({ role: 'teacher' }).select('-password').sort({ createdAt: -1 });

  // Attach course count for each instructor
  const data = await Promise.all(instructors.map(async (ins) => {
    const courseCount = await Course.countDocuments({ teacher: ins._id });
    return { ...ins.toObject(), courseCount };
  }));

  res.status(200).json({ success: true, count: data.length, data });
});

exports.createInstructor = asyncHandler(async (req, res) => {
  const parsed = instructorFields.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);
  const { email, mobile } = parsed.data;

  if (await User.exists({ email })) throw new ApiError(409, 'Email already registered.');
  if (await User.exists({ mobile })) throw new ApiError(409, 'Mobile number already registered.');
  const empId = parsed.data.empId || await generateEmployeeId();
  if (await User.exists({ empId })) throw new ApiError(409, 'Employee ID already registered.');

  const instructor = await User.create({
    ...parsed.data,
    empId,
    role: 'teacher',
    avatar: req.file ? `/uploads/profiles/${req.file.filename}` : null,
  });
  res.status(201).json({
    success: true,
    message: 'Instructor account created.',
    data: instructor,
  });
});

exports.getInstructor = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) throw new ApiError(400, 'Invalid instructor ID.');
  const instructor = await User.findOne({ _id: req.params.id, role: 'teacher' }).select('-password');
  if (!instructor) throw new ApiError(404, 'Instructor not found.');

  const courses = await Course.find({ teacher: instructor._id }).select('name code department semester');
  res.status(200).json({ success: true, data: { ...instructor.toObject(), courses } });
});

exports.updateInstructor = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) throw new ApiError(400, 'Invalid instructor ID.');
  const instructor = await User.findOne({ _id: req.params.id, role: 'teacher' });
  if (!instructor) throw new ApiError(404, 'Instructor not found.');

  const instructorUpdateSchema = instructorFields.partial().omit({ empId: true, dob: true }).extend({
    bio: z.string().trim().max(300).optional(),
    address: z.string().trim().max(200).optional(),
  });
  const parsed = instructorUpdateSchema.safeParse(req.body || {});
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);
  const updates = parsed.data;

  if (updates.email && await User.exists({ email: updates.email, _id: { $ne: instructor._id } })) {
    throw new ApiError(409, 'Email already registered.');
  }
  if (updates.mobile && await User.exists({ mobile: updates.mobile, _id: { $ne: instructor._id } })) {
    throw new ApiError(409, 'Mobile number already registered.');
  }
  Object.assign(instructor, updates);

  const previousAvatar = instructor.avatar;
  if (req.file) {
    instructor.avatar = `/uploads/profiles/${req.file.filename}`;
  }

  await instructor.save();
  if (req.file) removeAvatarFile(previousAvatar);
  res.status(200).json({ success: true, message: 'Instructor updated.', data: instructor });
});

exports.toggleInstructor = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) throw new ApiError(400, 'Invalid instructor ID.');
  const instructor = await User.findOne({ _id: req.params.id, role: 'teacher' });
  if (!instructor) throw new ApiError(404, 'Instructor not found.');
  instructor.isActive = !instructor.isActive;
  await instructor.save();
  res.status(200).json({ success: true, message: `Instructor ${instructor.isActive ? 'activated' : 'disabled'}.`, isActive: instructor.isActive });
});

exports.deleteInstructor = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) throw new ApiError(400, 'Invalid instructor ID.');
  const instructor = await User.findOne({ _id: req.params.id, role: 'teacher' });
  if (!instructor) throw new ApiError(404, 'Instructor not found.');
  const [courses, timetable, assignments, attendance, marks] = await Promise.all([
    Course.exists({ teacher: instructor._id }),
    Timetable.exists({ teacher: instructor._id }),
    Assignment.exists({ teacher: instructor._id }),
    Attendance.exists({ teacher: instructor._id }),
    Marks.exists({ teacher: instructor._id }),
  ]);
  if (courses || timetable || assignments || attendance || marks) {
    throw new ApiError(409, 'This instructor has assigned courses or academic records. Deactivate the account instead.');
  }
  await instructor.deleteOne();
  removeAvatarFile(instructor.avatar);
  res.status(200).json({ success: true, message: 'Instructor deleted.' });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  TIMETABLE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

exports.listTimetable = asyncHandler(async (req, res) => {
  const entries = await Timetable.find()
    .populate('course',  'name code department')
    .populate('teacher', 'name empId')
    .sort({ day: 1, startTime: 1 });
  res.status(200).json({ success: true, count: entries.length, data: entries });
});

exports.createTimetableEntry = asyncHandler(async (req, res) => {
  const parsed = timetableSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);
  const { courseId, teacherId, day, startTime, endTime, room } = parsed.data;
  if (endTime <= startTime) throw new ApiError(400, 'End time must be later than start time.');

  const course  = await Course.findById(courseId);
  if (!course) throw new ApiError(404, 'Course not found.');
  const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
  if (!teacher || !teacher.isActive) throw new ApiError(404, 'Active instructor not found.');
  if (!course.teacher || course.teacher.toString() !== teacher._id.toString()) {
    throw new ApiError(409, 'Assign this instructor to the course before adding timetable entries.');
  }

  const conflicts = await findTimetableConflict({ day, startTime, endTime, teacherId, room });
  if (conflicts) throw new ApiError(409, 'This instructor or room already has a class during that time.');

  const entry = await Timetable.create({ course: courseId, teacher: teacherId, day, startTime, endTime, room });
  await entry.populate(['course', 'teacher']);
  res.status(201).json({ success: true, message: 'Timetable entry created.', data: entry });
});

exports.updateTimetableEntry = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) throw new ApiError(400, 'Invalid timetable entry ID.');
  const entry = await Timetable.findById(req.params.id)
    .populate('course',  'name teacher')
    .populate('teacher', 'name');
  if (!entry) throw new ApiError(404, 'Timetable entry not found.');

  const timetableUpdateSchema = timetableSchema.partial().extend({
    note: z.string().trim().max(300).optional(),
  });
  const parsed = timetableUpdateSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);
  const { courseId, teacherId, day, startTime, endTime, room, note } = parsed.data;
  const nextStartTime = startTime || entry.startTime;
  const nextEndTime = endTime || entry.endTime;
  if (nextEndTime <= nextStartTime) throw new ApiError(400, 'End time must be later than start time.');
  const logNote = note || '';

  const assignedCourse = courseId
    ? await Course.findById(courseId)
    : await Course.findById(entry.course._id);
  if (!assignedCourse) throw new ApiError(404, 'Course not found.');
  const assignedTeacherId = teacherId || entry.teacher?._id?.toString();
  const newTeacher = teacherId
    ? await User.findOne({ _id: teacherId, role: 'teacher', isActive: true })
    : entry.teacher;
  if (!newTeacher) throw new ApiError(404, 'Active instructor not found.');
  if (!assignedCourse.teacher || assignedCourse.teacher.toString() !== newTeacher._id.toString()) {
    throw new ApiError(409, 'Timetable instructor must match the course instructor. Update the course assignment first.');
  }
  const conflict = await findTimetableConflict({
    day: day || entry.day,
    startTime: nextStartTime,
    endTime: nextEndTime,
    teacherId: assignedTeacherId,
    room: room === undefined ? entry.room : room,
    excludeId: entry._id,
  });
  if (conflict) throw new ApiError(409, 'This instructor or room already has a class during that time.');

  // Build change log entries for each changed field
  const logs = [];

  if (teacherId && teacherId !== entry.teacher?._id?.toString()) {
    logs.push({ changedBy: req.user._id, field: 'teacher', oldValue: entry.teacher.name, newValue: newTeacher.name, note: logNote });
    entry.teacher = teacherId;
  }
  if (courseId && courseId !== entry.course._id.toString()) {
    const newCourse = await Course.findById(courseId);
    if (!newCourse) throw new ApiError(404, 'Course not found.');
    logs.push({ changedBy: req.user._id, field: 'course', oldValue: entry.course.name, newValue: newCourse.name, note: logNote });
    entry.course = courseId;
  }
  if (day       && day       !== entry.day)       { logs.push({ changedBy: req.user._id, field: 'day',       oldValue: entry.day,       newValue: day,       note: logNote }); entry.day = day; }
  if (startTime && startTime !== entry.startTime) { logs.push({ changedBy: req.user._id, field: 'startTime', oldValue: entry.startTime, newValue: startTime, note: logNote }); entry.startTime = startTime; }
  if (endTime   && endTime   !== entry.endTime)   { logs.push({ changedBy: req.user._id, field: 'endTime',   oldValue: entry.endTime,   newValue: endTime,   note: logNote }); entry.endTime = endTime; }
  if (room      !== undefined && room !== entry.room) { logs.push({ changedBy: req.user._id, field: 'room', oldValue: entry.room, newValue: room, note: logNote }); entry.room = room; }

  if (logs.length) entry.changeLog.push(...logs);

  await entry.save();
  await entry.populate([{ path: 'course', select: 'name code department' }, { path: 'teacher', select: 'name empId' }]);

  res.status(200).json({ success: true, message: 'Timetable entry updated.', data: entry });
});

const findTimetableConflict = ({ day, startTime, endTime, teacherId, room, excludeId }) => {
  const alternatives = [{ teacher: teacherId }];
  if (room) alternatives.push({ room });
  return Timetable.findOne({
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    day,
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
    $or: alternatives,
  }).select('_id');
};

exports.deleteTimetableEntry = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) throw new ApiError(400, 'Invalid timetable entry ID.');
  const entry = await Timetable.findById(req.params.id);
  if (!entry) throw new ApiError(404, 'Timetable entry not found.');
  await entry.deleteOne();
  res.status(200).json({ success: true, message: 'Timetable entry deleted.' });
});

exports.getTimetableLog = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) throw new ApiError(400, 'Invalid timetable entry ID.');
  const entry = await Timetable.findById(req.params.id)
    .populate('changeLog.changedBy', 'name role');
  if (!entry) throw new ApiError(404, 'Timetable entry not found.');
  res.status(200).json({ success: true, data: entry.changeLog });
});

// ═══════════════════════════════════════════════════════════════════════════════
//  COURSES (read-only list for dropdowns)
// ═══════════════════════════════════════════════════════════════════════════════

exports.listCourses = asyncHandler(async (req, res) => {
  const courses = await Course.find().select('name code department semester teacher')
    .populate('teacher', 'name empId').sort({ name: 1 });
  res.status(200).json({ success: true, count: courses.length, data: courses });
});

exports.createCourse = asyncHandler(async (req, res) => {
  const parsed = courseSchema.safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);
  const { teacherId, ...courseData } = parsed.data;

  if (!await AcademicProgram.exists({ branch: courseData.department })) {
    throw new ApiError(400, 'Add this branch under Programs & Branches before creating a course.');
  }
  const teacher = teacherId
    ? await User.findOne({ _id: teacherId, role: 'teacher', isActive: true })
    : null;
  if (teacherId && !teacher) throw new ApiError(404, 'Active instructor not found.');

  const course = await Course.create({ ...courseData, teacher: teacher?._id });
  await course.populate('teacher', 'name empId');
  res.status(201).json({ success: true, message: 'Course created.', data: course });
});

exports.updateCourse = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) throw new ApiError(400, 'Invalid course ID.');
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found.');

  const parsed = courseSchema.partial().safeParse(req.body);
  if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);
  const updates = parsed.data;

  if (updates.department && updates.department !== course.department) {
    const [attendance, assignments, marks, timetable] = await Promise.all([
      Attendance.exists({ course: course._id }),
      Assignment.exists({ course: course._id }),
      Marks.exists({ course: course._id }),
      Timetable.exists({ course: course._id }),
    ]);
    if (attendance || assignments || marks || timetable) {
      throw new ApiError(409, 'A course with academic records or timetable entries cannot be moved to another branch.');
    }
  }
  if (updates.department && !await AcademicProgram.exists({ branch: updates.department })) {
    throw new ApiError(400, 'Add this branch under Programs & Branches before assigning it to a course.');
  }
  if (updates.teacherId !== undefined) {
    const requestedTeacherId = updates.teacherId || null;
    const currentTeacherId = course.teacher ? course.teacher.toString().toLowerCase() : null;
    if (requestedTeacherId !== currentTeacherId) {
      if (await Timetable.exists({ course: course._id })) {
        throw new ApiError(409, 'Delete the course timetable entries before changing its instructor.');
      }
      const teacher = updates.teacherId
        ? await User.findOne({ _id: updates.teacherId, role: 'teacher', isActive: true })
        : null;
      if (updates.teacherId && !teacher) throw new ApiError(404, 'Active instructor not found.');
      course.teacher = teacher?._id || null;
    }
    delete updates.teacherId;
  }

  Object.assign(course, updates);
  await course.save();
  await course.populate('teacher', 'name empId');
  res.status(200).json({ success: true, message: 'Course updated.', data: course });
});

exports.deleteCourse = asyncHandler(async (req, res) => {
  if (!isObjectId(req.params.id)) throw new ApiError(400, 'Invalid course ID.');
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found.');

  const [hasAttendance, hasAssignments, hasMarks, hasTimetable] = await Promise.all([
    Attendance.exists({ course: course._id }),
    Assignment.exists({ course: course._id }),
    Marks.exists({ course: course._id }),
    Timetable.exists({ course: course._id }),
  ]);
  if (hasAttendance || hasAssignments || hasMarks || hasTimetable) {
    throw new ApiError(409, 'This course has academic records and cannot be deleted.');
  }

  await course.deleteOne();
  res.status(200).json({ success: true, message: 'Course deleted.' });
});
