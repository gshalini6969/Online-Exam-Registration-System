const express = require('express');
const db      = require('../db');
const router  = express.Router();

// ─── Middleware: ensure student is logged in ──────────────────────────────────
function requireStudent(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'student')
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  next();
}

// ─── GET all available exams filtered by course + semester ───────────────────
// Exams are linked to a course/semester via exam_course_map table (see SQL note below)
// Fallback: if no mapping exists for an exam it is shown to everyone (open exams)
router.get('/exams', requireStudent, async (req, res) => {
  const { course, semester } = req.session.user;
  try {
    // Returns exams that either:
    //   a) are mapped to the student's exact course+semester, OR
    //   b) have no course/semester restrictions at all (open to all)
    const [rows] = await db.execute(
      `SELECT DISTINCT e.*
       FROM exams e
       LEFT JOIN exam_course_map ecm ON ecm.exam_id = e.exam_id
       WHERE e.status = 'Open'
         AND (
               (ecm.course = ? AND ecm.semester = ?)
               OR ecm.exam_id IS NULL
             )
       ORDER BY e.exam_date`,
      [course, semester]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET subjects for an exam ─────────────────────────────────────────────────
router.get('/exams/:examId/subjects', requireStudent, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT s.* FROM subjects s
       JOIN exam_subjects es ON s.subject_id = es.subject_id
       WHERE es.exam_id = ?`,
      [req.params.examId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── POST register for an exam ────────────────────────────────────────────────
router.post('/register', requireStudent, async (req, res) => {
  const { exam_id, subject_ids } = req.body;
  const student_id = req.session.user.id;
  try {
    for (const sid of subject_ids) {
      await db.execute('CALL sp_register_student(?, ?, ?)', [student_id, exam_id, sid]);
    }
    res.json({ success: true, message: 'Registered successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET my registrations ─────────────────────────────────────────────────────
router.get('/my-registrations', requireStudent, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM vw_registration_summary
       WHERE student_name = (
         SELECT full_name FROM students WHERE student_id = ?
       )`,
      [req.session.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET my hall tickets ──────────────────────────────────────────────────────
router.get('/hall-tickets', requireStudent, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT ht.* FROM vw_hall_tickets ht
       JOIN registrations r ON r.reg_id = ht.ticket_id
       WHERE r.student_id = ?`,
      [req.session.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET exam schedule ────────────────────────────────────────────────────────
router.get('/schedule', requireStudent, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT es.*, e.exam_name FROM exam_schedule es
       JOIN exams e ON es.exam_id = e.exam_id
       ORDER BY es.event_date`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET current student's profile (course + semester) ───────────────────────
router.get('/profile', requireStudent, async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT full_name, email, username, course, semester FROM students WHERE student_id = ?',
      [req.session.user.id]
    );
    res.json(rows[0] || {});
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;