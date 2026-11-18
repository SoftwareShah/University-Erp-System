const express  = require('express');
const router   = express.Router();
const tc       = require('../controllers/teacherController');
const pc       = require('../controllers/profileController');
const upload   = require('../config/upload');
const cleanupFailedUpload = require('../middlewares/cleanupFailedUpload');
const validateImageUpload = require('../middlewares/validateImageUpload');

// ── Profile ───────────────────────────────────────────────────────────────────
router.get('/profile',                    pc.getProfile);
router.put('/profile',                    pc.updateProfile);
router.post('/profile/avatar', upload.single('avatar'), validateImageUpload, cleanupFailedUpload, pc.uploadAvatar);
router.delete('/profile/avatar',          pc.deleteAvatar);

// ── Courses ───────────────────────────────────────────────────────────────────
router.get('/dashboard',                 tc.getDashboardSummary);
router.get('/courses',                    tc.getMyCourses);
router.get('/courses/:courseId/students', tc.getCourseStudents);

// ── Attendance ────────────────────────────────────────────────────────────────
router.post('/attendance',           tc.markAttendance);
router.get('/attendance/:courseId',  tc.getAttendance);

// ── Assignments ───────────────────────────────────────────────────────────────
router.post('/assignments',          tc.uploadAssignment);
router.get('/assignments',           tc.getMyAssignments);
router.put('/assignments/:id',       tc.updateAssignment);
router.delete('/assignments/:id',    tc.deleteAssignment);

// ── Marks ─────────────────────────────────────────────────────────────────────
router.post('/marks',                tc.uploadMarks);
router.get('/marks/:courseId',       tc.getCourseMarks);
router.delete('/marks/:id',          tc.deleteMarks);

// ── Timetable ─────────────────────────────────────────────────────────────────
router.get('/timetable',             tc.getMyTimetable);

module.exports = router;
