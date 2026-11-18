const path         = require('path');
const fs           = require('fs');
const { z }        = require('zod');
const User         = require('../models/User');
const ApiError     = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const uploadDirectory = require('../config/uploadDirectory');

// ── Zod schema for profile update ─────────────────────────────────────────────
const updateProfileSchema = z.object({
  name:       z.string().min(3).max(60).optional(),
  mobile:     z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits').optional(),
  department: z.string().min(2).max(100).optional(),
  bio:        z.string().max(300).optional(),
  address:    z.string().max(200).optional(),
});

// ── GET /profile ──────────────────────────────────────────────────────────────
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) throw new ApiError(404, 'User not found.');
  res.status(200).json({ success: true, data: user });
});

// ── PUT /profile ──────────────────────────────────────────────────────────────
// Update name, mobile, department, bio, address
exports.updateProfile = asyncHandler(async (req, res) => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0].message);
  }
  if (req.user.role === 'student' && parsed.data.department !== undefined) {
    throw new ApiError(403, 'Students cannot change their assigned branch.');
  }
  if (parsed.data.mobile && await User.exists({
    mobile: parsed.data.mobile,
    _id: { $ne: req.user._id },
  })) {
    throw new ApiError(409, 'Mobile number already registered.');
  }

  // Only allow these fields — never let user change role/erpId/empId/dob/password here
  const allowed = ['name', 'mobile', 'department', 'bio', 'address'];
  const updates = {};
  allowed.forEach(field => {
    if (parsed.data[field] !== undefined) updates[field] = parsed.data[field];
  });

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password');
  if (!user) throw new ApiError(404, 'User not found.');

  res.status(200).json({ success: true, message: 'Profile updated.', data: user });
});

// ── POST /profile/avatar ──────────────────────────────────────────────────────
// Upload or replace profile photo
exports.uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'Please upload an image file.');
  }

  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found.');

  const previousAvatar = user.avatar;
  const avatarUrl = `/uploads/profiles/${req.file.filename}`;
  user.avatar = avatarUrl;
  await user.save();
  if (previousAvatar) {
    const oldPath = path.join(uploadDirectory, 'profiles', path.basename(previousAvatar));
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  res.status(200).json({
    success: true,
    message: 'Profile photo updated.',
    avatar:  avatarUrl,
  });
});

// ── DELETE /profile/avatar ────────────────────────────────────────────────────
// Remove profile photo and reset to null
exports.deleteAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new ApiError(404, 'User not found.');

  if (!user.avatar) {
    throw new ApiError(400, 'No profile photo to remove.');
  }

  const filePath = path.join(uploadDirectory, 'profiles', path.basename(user.avatar));
  user.avatar = null;
  await user.save();

  // Remove the file only after the database update succeeds.
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  res.status(200).json({ success: true, message: 'Profile photo removed.' });
});
