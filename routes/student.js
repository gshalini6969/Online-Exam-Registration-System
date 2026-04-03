const express = require('express');
const db      = require('../db');
const router  = express.Router();

// Get all available exams
router.get('/exams', async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT * FROM exams WHERE status = 'Open'"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get subjects for an exam
router.get('/exams/:examId/subjects', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT s.* FROM subjects s
       JOIN exam_subjects es ON s.subject_id = es.subject_id
       WHERE es.exam_id = ?`, [req.params.examId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Register for an exam
router.post('/register', async (req, res) => {
  const { exam_id, subject_ids } = req.body;
  const student_id = req.session.user.id;
  try {
    for (const sid of subject_ids) {
      await db.execute('CALL sp_register_student(?, ?, ?)',
        [student_id, exam_id, sid]);
    }
    res.json({ success: true, message: 'Registered successfully!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// My registrations
router.get('/my-registrations', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM vw_registration_summary
       WHERE student_name = (
         SELECT full_name FROM students WHERE student_id = ?
       )`, [req.session.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// My hall tickets
router.get('/hall-tickets', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT ht.* FROM vw_hall_tickets ht
       JOIN registrations r ON r.reg_id = ht.ticket_id
       WHERE r.student_id = ?`, [req.session.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Exam schedule
router.get('/schedule', async (req, res) => {
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

module.exports = router;