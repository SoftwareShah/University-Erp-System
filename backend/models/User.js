const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const userSchema = new mongoose.Schema({
  name:       { type: String, required: [true, 'Name is required'], trim: true, maxlength: 60 },
  email:      { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true },
  role:       { type: String, enum: ['admin', 'teacher', 'student'], required: true },
  isActive:   { type: Boolean, default: true },
  department: { type: String, trim: true },
  mobile:     { type: String, trim: true },

  // Student-specific
  erpId: { type: String, trim: true, uppercase: true, sparse: true, unique: true },
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicProgram' },
  admissionDate: { type: String },
  registrationNo: { type: String, trim: true, uppercase: true },
  gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  college: { type: String, trim: true, maxlength: 150 },
  session: { type: String, trim: true, maxlength: 30 },
  semester: { type: Number, min: 1, max: 12 },
  rollNo: { type: String, trim: true, uppercase: true, maxlength: 30 },
  quota: { type: String, trim: true, maxlength: 60 },
  section: { type: String, trim: true, uppercase: true, maxlength: 20 },
  lateralEntry: { type: Boolean, default: false },
  status: { type: String, enum: ['active', 'inactive', 'graduated', 'withdrawn'], default: 'active' },
  feeCategory: { type: String, trim: true, maxlength: 60 },
  fatherName: { type: String, trim: true, maxlength: 100 },
  fatherMobile: { type: String, trim: true },
  fatherEmail: { type: String, trim: true, lowercase: true },
  motherName: { type: String, trim: true, maxlength: 100 },
  motherMobile: { type: String, trim: true },
  motherEmail: { type: String, trim: true, lowercase: true },

  // Teacher-specific
  empId: { type: String, trim: true, uppercase: true, sparse: true, unique: true },

  // DOB — used as login credential for student & teacher
  dob: { type: String },

  // Admin-only password (bcrypt hashed)
  password: { type: String, select: false },

  // Profile photo — stored as relative URL e.g. /uploads/profiles/filename.jpg
  avatar: { type: String, default: null },

  // Optional profile fields
  bio:     { type: String, trim: true, maxlength: 300, default: '' },
  address: { type: String, trim: true, maxlength: 200, default: '' },

}, { timestamps: true });

// Hash password before saving (admin only)
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

// Compare plain password with hash
userSchema.methods.comparePassword = async function (plain) {
  return await bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', userSchema);
