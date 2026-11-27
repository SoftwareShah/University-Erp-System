const jwt          = require('jsonwebtoken');
const { z }        = require('zod');
const User         = require('../models/User');
const ApiError     = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { dateOnlySchema } = require('../utils/validation');

// ── Zod schemas ───────────────────────────────────────────────────────────────
const studentSignupSchema = z.object({
  name:       z.string({ error: 'Full name is required.' })
               .min(3, 'Full name must be at least 3 characters.')
               .max(60, 'Full name must be at most 60 characters.'),
  email:      z.string({ error: 'Email is required.' })
               .email('Enter a valid email address.'),
  mobile:     z.string({ error: 'Mobile number is required.' })
               .regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits.'),
  department: z.string({ error: 'Department is required.' })
               .min(2, 'Please select a valid department.'),
  erpId:      z.string({ error: 'ERP ID is required.' })
               .regex(/^[A-Z0-9]{4,20}$/, 'ERP ID must be 4–20 uppercase letters/digits (e.g. DBUU2024001).'),
  dob:        dateOnlySchema,
});

const teacherSignupSchema = z.object({
  name:       z.string({ error: 'Full name is required.' })
               .min(3, 'Full name must be at least 3 characters.')
               .max(60, 'Full name must be at most 60 characters.'),
  email:      z.string({ error: 'Email is required.' })
               .email('Enter a valid email address.'),
  mobile:     z.string({ error: 'Mobile number is required.' })
               .regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits.'),
  department: z.string({ error: 'Department is required.' })
               .min(2, 'Please select a valid department.'),
  empId:      z.string({ error: 'Employee ID is required.' })
               .regex(/^[A-Z0-9]{4,20}$/, 'Employee ID must be 4–20 uppercase letters/digits (e.g. EMP20240001).'),
  dob:        dateOnlySchema,
});

const studentLoginSchema = z.object({
  erpId: z.string({ error: 'ERP ID is required.' }).min(1, 'ERP ID is required.'),
  dob:   dateOnlySchema,
});

const teacherLoginSchema = z.object({
  empId: z.string({ error: 'Employee ID is required.' }).min(1, 'Employee ID is required.'),
  dob:   dateOnlySchema,
});

const adminLoginSchema = z.object({
  email:    z.string({ error: 'Email is required.' }).trim().toLowerCase().email('Enter a valid email address.'),
  password: z.string({ error: 'Password is required.' }).min(6, 'Password must be at least 6 characters.'),
});

// ── Helper: sign JWT ──────────────────────────────────────────────────────────
const signToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const sendToken = (res, user, statusCode) => {
  const token = signToken(user._id, user.role);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id:         user._id,
      name:       user.name,
      role:       user.role,
      email:      user.email,
      department: user.department,
      avatar:     user.avatar || null,
      ...(user.erpId && { erpId: user.erpId }),
      ...(user.empId && { empId: user.empId }),
    },
  });
};

// ── SIGNUP ────────────────────────────────────────────────────────────────────
// POST /api/auth/signup
exports.signup = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { role } = body;

  if (!role) throw new ApiError(400, 'Role is required. Must be student or teacher.');
  if (role === 'admin')   throw new ApiError(403, 'Admin accounts can only be created via the seed script.');
  if (role === 'student') throw new ApiError(403, 'Student accounts are created by the university admin only.');
  if (!['teacher'].includes(role)) throw new ApiError(400, 'Invalid role.');

  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_TEACHER_SIGNUP !== 'true') {
    throw new ApiError(403, 'Instructor accounts must be created by an administrator.');
  }

  // ── Student signup ──────────────────────────────────────────────────────────
  if (role === 'student') {
    const parsed = studentSignupSchema.safeParse({
      ...body,
      erpId: body.erpId?.trim().toUpperCase(),
    });

    if (!parsed.success) {
      // Return all field errors, not just the first one
      const messages = parsed.error.issues.map(e => e.message).join(' | ');
      throw new ApiError(400, messages);
    }

    const { name, email, mobile, department, erpId, dob } = parsed.data;

    // Check each unique field separately for clear error messages
    const emailExists  = await User.findOne({ email });
    if (emailExists) throw new ApiError(409, 'This email is already registered. Please use a different email.');

    const erpExists = await User.findOne({ erpId });
    if (erpExists) throw new ApiError(409, `ERP ID "${erpId}" is already registered. Each student has a unique ERP ID.`);

    const mobileExists = await User.findOne({ mobile });
    if (mobileExists) throw new ApiError(409, 'This mobile number is already registered.');

    const user = await User.create({ name, email, mobile, department, erpId, dob, role: 'student' });
    return sendToken(res, user, 201);
  }

  // ── Teacher signup ──────────────────────────────────────────────────────────
  if (role === 'teacher') {
    const parsed = teacherSignupSchema.safeParse({
      ...body,
      empId: body.empId?.trim().toUpperCase(),
    });

    if (!parsed.success) {
      const messages = parsed.error.issues.map(e => e.message).join(' | ');
      throw new ApiError(400, messages);
    }

    const { name, email, mobile, department, empId, dob } = parsed.data;

    const emailExists = await User.findOne({ email });
    if (emailExists) throw new ApiError(409, 'This email is already registered. Please use a different email.');

    const empExists = await User.findOne({ empId });
    if (empExists) throw new ApiError(409, `Employee ID "${empId}" is already registered.`);

    const mobileExists = await User.findOne({ mobile });
    if (mobileExists) throw new ApiError(409, 'This mobile number is already registered.');

    const user = await User.create({ name, email, mobile, department, empId, dob, role: 'teacher' });
    return sendToken(res, user, 201);
  }
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
// POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const body = req.body || {};
  const { role } = body;

  if (!role) throw new ApiError(400, 'Role is required.');
  if (!['admin', 'teacher', 'student'].includes(role)) throw new ApiError(400, 'Invalid role.');

  // ── Admin login ─────────────────────────────────────────────────────────────
  if (role === 'admin') {
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

    const { email, password } = parsed.data;
    const user = await User.findOne({ email, role: 'admin' }).select('+password');
    if (!user) throw new ApiError(401, 'Invalid email or password.');

    const match = await user.comparePassword(password);
    if (!match) throw new ApiError(401, 'Invalid email or password.');

    if (!user.isActive) throw new ApiError(401, 'Your account has been deactivated. Contact support.');
    return sendToken(res, user, 200);
  }

  // ── Student login ───────────────────────────────────────────────────────────
  if (role === 'student') {
    const parsed = studentLoginSchema.safeParse({
      erpId: body.erpId?.trim().toUpperCase(),
      dob:   body.dob,
    });
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

    const { erpId, dob } = parsed.data;
    const user = await User.findOne({ erpId, role: 'student' });

    if (!user || user.dob !== dob) throw new ApiError(401, 'Invalid ERP ID or date of birth.');
    if (!user.isActive) throw new ApiError(401, 'Your account has been deactivated. Contact admin.');

    return sendToken(res, user, 200);
  }

  // ── Teacher login ───────────────────────────────────────────────────────────
  if (role === 'teacher') {
    const parsed = teacherLoginSchema.safeParse({
      empId: body.empId?.trim().toUpperCase(),
      dob:   body.dob,
    });
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0].message);

    const { empId, dob } = parsed.data;
    const user = await User.findOne({ empId, role: 'teacher' });

    if (!user || user.dob !== dob) throw new ApiError(401, 'Invalid employee ID or date of birth.');
    if (!user.isActive) throw new ApiError(401, 'Your account has been deactivated. Contact admin.');

    return sendToken(res, user, 200);
  }
});

// ── GET CURRENT USER ──────────────────────────────────────────────────────────
// GET /api/auth/me  (requires token)
exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});
