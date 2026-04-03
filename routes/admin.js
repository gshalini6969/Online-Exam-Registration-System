const express = require('express');
const db      = require('../db');
const router  = express.Router();

// All registrations
router.get('/registrations', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM vw_registration_summary');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Approve a registration
router.post('/registrations/:regId/approve', async (req, res) => {
  const admin_id  = req.session.user.id;
  const center_id = req.body.center_id || 1;
  try {
    await db.execute(
      'CALL sp_approve_registration(?, ?, ?, @roll)',
      [req.params.regId, admin_id, center_id]
    );
    const [[out]] = await db.execute('SELECT @roll AS roll_no');
    res.json({ success: true, roll_no: out.roll_no });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reject a registration
router.post('/registrations/:regId/reject', async (req, res) => {
  try {
    const { remark } = req.body;
    await db.execute(
      `UPDATE registrations
       SET admin_status = 'Rejected', admin_remark = ?,
           reviewed_by = ?, reviewed_at = NOW()
       WHERE reg_id = ?`,
      [remark, req.session.user.id, req.params.regId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// All exams with report
router.get('/exams', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM vw_exam_report');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add new exam
router.post('/exams', async (req, res) => {
  try {
    const { exam_name, exam_code, exam_date, mode, fee_per_subject,
            reg_open_date, reg_deadline, late_deadline,
            hall_ticket_date, center_id } = req.body;
    await db.execute(
      `INSERT INTO exams
       (exam_name, exam_code, exam_date, mode, fee_per_subject,
        reg_open_date, reg_deadline, late_deadline,
        hall_ticket_date, center_id, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [exam_name, exam_code, exam_date, mode, fee_per_subject,
       reg_open_date, reg_deadline, late_deadline,
       hall_ticket_date, center_id, req.session.user.id]
    );
    res.json({ success: true, message: 'Exam created!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// All hall tickets
router.get('/hall-tickets', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM vw_hall_tickets');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;