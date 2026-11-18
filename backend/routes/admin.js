const express  = require('express');
const router   = express.Router();
const ac       = require('../controllers/adminController');
const pc       = require('../controllers/profileController');
const upload   = require('../config/upload');
const cleanupFailedUpload = require('../middlewares/cleanupFailedUpload');
const validateImageUpload = require('../middlewares/validateImageUpload');

router.get('/dashboard', ac.getDashboardSummary);

// ── Admin profile ────────────────────────────────────────────────────────────
router.get('/profile', pc.getProfile);
router.put('/profile', pc.updateProfile);
router.post('/profile/avatar', upload.single('avatar'), validateImageUpload, cleanupFailedUpload, pc.uploadAvatar);
router.delete('/profile/avatar', pc.deleteAvatar);

// ── Students ──────────────────────────────────────────────────────────────────
router.get('/students',                           ac.listStudents);
router.get('/students/:id',                       ac.getStudent);
router.post('/students',   upload.single('avatar'), validateImageUpload, cleanupFailedUpload, ac.registerStudent);
router.put('/students/:id', upload.single('avatar'), validateImageUpload, cleanupFailedUpload, ac.updateStudent);
router.patch('/students/:id/toggle',              ac.toggleStudent);
router.delete('/students/:id',                    ac.deleteStudent);

// ── Instructors ───────────────────────────────────────────────────────────────
router.get('/instructors',                              ac.listInstructors);
router.get('/instructors/:id',                          ac.getInstructor);
router.post('/instructors', upload.single('avatar'), validateImageUpload, cleanupFailedUpload, ac.createInstructor);
router.put('/instructors/:id', upload.single('avatar'), validateImageUpload, cleanupFailedUpload, ac.updateInstructor);
router.patch('/instructors/:id/toggle',                 ac.toggleInstructor);
router.delete('/instructors/:id',                       ac.deleteInstructor);

// ── Courses and programs ──────────────────────────────────────────────────────
router.get('/courses', ac.listCourses);
router.post('/courses', ac.createCourse);
router.put('/courses/:id', ac.updateCourse);
router.delete('/courses/:id', ac.deleteCourse);
router.get('/programs', ac.listAcademicPrograms);
router.post('/programs', ac.createAcademicProgram);
router.delete('/programs/:id', ac.deleteAcademicProgram);

// ── Timetable ─────────────────────────────────────────────────────────────────
router.get('/timetable',                  ac.listTimetable);
router.post('/timetable',                 ac.createTimetableEntry);
router.put('/timetable/:id',              ac.updateTimetableEntry);
router.delete('/timetable/:id',           ac.deleteTimetableEntry);
router.get('/timetable/:id/log',          ac.getTimetableLog);

module.exports = router;
