const express = require('express');
const router  = express.Router();
const sc      = require('../controllers/studentController');
const pc      = require('../controllers/profileController');
const upload  = require('../config/upload');
const cleanupFailedUpload = require('../middlewares/cleanupFailedUpload');
const validateImageUpload = require('../middlewares/validateImageUpload');

// ── Profile ───────────────────────────────────────────────────────────────────
router.get('/profile',                    pc.getProfile);

// ── Courses ───────────────────────────────────────────────────────────────────
router.get('/courses',                    sc.getMyCourses);

// ── Attendance ────────────────────────────────────────────────────────────────
router.get('/attendance',                 sc.getMyAttendance);
router.get('/attendance/:courseId',       sc.getCourseAttendance);

// ── Marks ─────────────────────────────────────────────────────────────────────
router.get('/marks',                      sc.getMyMarks);

// ── Timetable ─────────────────────────────────────────────────────────────────
router.get('/timetable',                  sc.getMyTimetable);

// ── Assignments ───────────────────────────────────────────────────────────────
router.get('/assignments',                sc.getMyAssignments);

module.exports = router;
