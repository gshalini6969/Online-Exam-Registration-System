// const express = require('express');
// const db      = require('../db');
// const router  = express.Router();

// // ─── Middleware: ensure student is logged in ──────────────────────────────────
// function requireStudent(req, res, next) {
//   if (!req.session.user || req.session.user.role !== 'student')
//     return res.status(401).json({ success: false, message: 'Not authenticated.' });
//   next();
// }

// // ─── GET all available exams filtered by course + semester ───────────────────
// // Exams are linked to a course/semester via exam_course_map table (see SQL note below)
// // Fallback: if no mapping exists for an exam it is shown to everyone (open exams)
// router.get('/exams', requireStudent, async (req, res) => {
//   const { course, semester } = req.session.user;
//   try {
//     // Returns exams that either:
//     //   a) are mapped to the student's exact course+semester, OR
//     //   b) have no course/semester restrictions at all (open to all)
//     const [rows] = await db.execute(
//       `SELECT DISTINCT e.*
//        FROM exams e
//        LEFT JOIN exam_course_map ecm ON ecm.exam_id = e.exam_id
//        WHERE e.status = 'Open'
//          AND (
//                (ecm.course = ? AND ecm.semester = ?)
//                OR ecm.exam_id IS NULL
//              )
//        ORDER BY e.exam_date`,
//       [course, semester]
//     );
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ─── GET subjects for an exam ─────────────────────────────────────────────────
// router.get('/exams/:examId/subjects', requireStudent, async (req, res) => {
//   try {
//     const [rows] = await db.execute(
//       `SELECT s.* FROM subjects s
//        JOIN exam_subjects es ON s.subject_id = es.subject_id
//        WHERE es.exam_id = ?`,
//       [req.params.examId]
//     );
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ─── POST register for an exam ────────────────────────────────────────────────
// router.post('/register', requireStudent, async (req, res) => {
//   const { exam_id, subject_ids } = req.body;
//   const student_id = req.session.user.id;
//   try {
//     for (const sid of subject_ids) {
//       await db.execute('CALL sp_register_student(?, ?, ?)', [student_id, exam_id, sid]);
//     }
//     res.json({ success: true, message: 'Registered successfully!' });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ─── GET my registrations ─────────────────────────────────────────────────────
// router.get('/my-registrations', requireStudent, async (req, res) => {
//   try {
//     const [rows] = await db.execute(
//       `SELECT * FROM vw_registration_summary
//        WHERE student_name = (
//          SELECT full_name FROM students WHERE student_id = ?
//        )`,
//       [req.session.user.id]
//     );
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ─── GET my hall tickets ──────────────────────────────────────────────────────
// router.get('/hall-tickets', requireStudent, async (req, res) => {
//   try {
//     const [rows] = await db.execute(
//       `SELECT ht.* FROM vw_hall_tickets ht
//        JOIN registrations r ON r.reg_id = ht.ticket_id
//        WHERE r.student_id = ?`,
//       [req.session.user.id]
//     );
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ─── GET exam schedule ────────────────────────────────────────────────────────
// router.get('/schedule', requireStudent, async (req, res) => {
//   try {
//     const [rows] = await db.execute(
//       `SELECT es.*, e.exam_name FROM exam_schedule es
//        JOIN exams e ON es.exam_id = e.exam_id
//        ORDER BY es.event_date`
//     );
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// // ─── GET current student's profile (course + semester) ───────────────────────
// router.get('/profile', requireStudent, async (req, res) => {
//   try {
//     const [rows] = await db.execute(
//       'SELECT full_name, email, username, course, semester FROM students WHERE student_id = ?',
//       [req.session.user.id]
//     );
//     res.json(rows[0] || {});
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// module.exports = router;
const express = require('express');
const db = require('../db');
const requireStudent = require('../middleware/requireStudent');

const router = express.Router();

/* =========================================================
   GET STUDENT PROFILE
========================================================= */
router.get('/profile', requireStudent, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
        student_id,
        full_name,
        username,
        email,
        course,
        branch,
        semester,
        prn,
        phone,
        date_of_birth,
        gender,
        address,
        photo_url,
        created_at
      FROM students
      WHERE student_id = ?`,
      [req.session.user.id]
    );

    res.json({
      success: true,
      profile: rows[0] || null
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =========================================================
   UPDATE STUDENT PROFILE (optional but useful)
========================================================= */
router.put('/profile', requireStudent, async (req, res) => {
  try {
    const {
      full_name,
      phone,
      address,
      branch,
      semester
    } = req.body;

    await db.execute(
      `UPDATE students
       SET full_name = ?, phone = ?, address = ?, branch = ?, semester = ?
       WHERE student_id = ?`,
      [
        full_name,
        phone,
        address,
        branch,
        semester,
        req.session.user.id
      ]
    );

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =========================================================
   GET AVAILABLE EXAMS FOR STUDENT
========================================================= */
router.get('/exams', requireStudent, async (req, res) => {
  const { course, semester } = req.session.user;

  try {
    const [rows] = await db.execute(
      `SELECT DISTINCT 
          e.exam_id,
          e.exam_name,
          e.exam_code,
          e.exam_date,
          e.start_time,
          e.end_time,
          e.mode,
          e.fee_per_subject,
          e.late_fine,
          e.reg_open_date,
          e.reg_deadline,
          e.late_deadline,
          e.hall_ticket_date,
          e.status,
          ec.center_name,
          ec.city
       FROM exams e
       LEFT JOIN exam_centers ec ON e.center_id = ec.center_id
       LEFT JOIN exam_course_map ecm ON ecm.exam_id = e.exam_id
       WHERE e.status IN ('Open', 'Upcoming')
         AND (
              (ecm.course = ? AND ecm.semester = ?)
              OR ecm.exam_id IS NULL
         )
       ORDER BY e.exam_date ASC`,
      [course, semester]
    );

    res.json({
      success: true,
      exams: rows
    });
  } catch (err) {
    console.error('Get exams error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =========================================================
   GET SUBJECTS FOR A PARTICULAR EXAM
========================================================= */
router.get('/exams/:examId/subjects', requireStudent, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
          s.subject_id,
          s.subject_code,
          s.subject_name,
          s.department,
          s.credits
       FROM subjects s
       JOIN exam_subjects es ON s.subject_id = es.subject_id
       WHERE es.exam_id = ?`,
      [req.params.examId]
    );

    res.json({
      success: true,
      subjects: rows
    });
  } catch (err) {
    console.error('Subjects error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =========================================================
   REGISTER FOR EXAM
========================================================= */
router.post('/register', requireStudent, async (req, res) => {
  const { exam_id, subject_ids } = req.body;
  const student_id = req.session.user.id;

  if (!exam_id || !subject_ids || !Array.isArray(subject_ids) || subject_ids.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Exam and subjects are required'
    });
  }

  try {
    // 1. Check already registered
    const [existing] = await db.execute(
      `SELECT * FROM registrations WHERE student_id = ? AND exam_id = ?`,
      [student_id, exam_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this exam'
      });
    }

    // 2. Get exam fee
    const [examRows] = await db.execute(
      `SELECT fee_per_subject FROM exams WHERE exam_id = ?`,
      [exam_id]
    );

    if (!examRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const feePerSubject = Number(examRows[0].fee_per_subject || 0);
    const totalFee = feePerSubject * subject_ids.length;

    // 3. Create registration
    const [regResult] = await db.execute(
      `INSERT INTO registrations (student_id, exam_id, total_fee, admin_status)
       VALUES (?, ?, ?, 'Pending')`,
      [student_id, exam_id, totalFee]
    );

    const regId = regResult.insertId;

    // 4. Insert selected subjects
    for (const subjectId of subject_ids) {
      await db.execute(
        `INSERT INTO registration_subjects (reg_id, subject_id)
         VALUES (?, ?)`,
        [regId, subjectId]
      );
    }

    // 5. Create payment placeholder
    await db.execute(
      `INSERT INTO payments (reg_id, amount, status, method)
       VALUES (?, ?, 'Pending', 'UPI')`,
      [regId, totalFee]
    );

    res.json({
      success: true,
      message: 'Registered successfully',
      reg_id: regId,
      total_fee: totalFee
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =========================================================
   GET MY REGISTRATIONS
========================================================= */
router.get('/my-registrations', requireStudent, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
          r.reg_id,
          e.exam_name,
          e.exam_code,
          e.exam_date,
          r.total_fee,
          r.admin_status,
          r.admin_remark,
          r.applied_on,
          p.status AS payment_status
       FROM registrations r
       JOIN exams e ON r.exam_id = e.exam_id
       LEFT JOIN payments p ON r.reg_id = p.reg_id
       WHERE r.student_id = ?
       ORDER BY r.applied_on DESC`,
      [req.session.user.id]
    );

    res.json({
      success: true,
      registrations: rows
    });
  } catch (err) {
    console.error('My registrations error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =========================================================
   GET MY HALL TICKETS
========================================================= */
router.get('/hall-tickets', requireStudent, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
          ht.ticket_id,
          ht.roll_number,
          ht.seat_number,
          ht.issued_on,
          ht.status,
          e.exam_name,
          e.exam_code,
          e.exam_date,
          e.start_time,
          e.end_time,
          ec.center_name,
          ec.city,
          ec.address
       FROM hall_tickets ht
       JOIN registrations r ON ht.reg_id = r.reg_id
       JOIN exams e ON r.exam_id = e.exam_id
       LEFT JOIN exam_centers ec ON ht.center_id = ec.center_id
       WHERE r.student_id = ?
       ORDER BY ht.issued_on DESC`,
      [req.session.user.id]
    );

    res.json({
      success: true,
      hall_tickets: rows
    });
  } catch (err) {
    console.error('Hall tickets error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* =========================================================
   GET EXAM SCHEDULE
========================================================= */
router.get('/schedule', requireStudent, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT 
          es.schedule_id,
          es.exam_id,
          es.event_name,
          es.event_date,
          es.event_status,
          e.exam_name,
          e.exam_code
       FROM exam_schedule es
       JOIN exams e ON es.exam_id = e.exam_id
       ORDER BY es.event_date ASC`
    );

    res.json({
      success: true,
      schedule: rows
    });
  } catch (err) {
    console.error('Schedule error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;