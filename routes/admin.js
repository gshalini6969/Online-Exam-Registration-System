// // const express = require('express');
// // const db      = require('../db');
// // const router  = express.Router();

// // // All registrations
// // router.get('/registrations', async (req, res) => {
// //   try {
// //     const [rows] = await db.execute('SELECT * FROM vw_registration_summary');
// //     res.json(rows);
// //   } catch (err) {
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // });

// // // Approve a registration
// // router.post('/registrations/:regId/approve', async (req, res) => {
// //   const admin_id  = req.session.user.id;
// //   const center_id = req.body.center_id || 1;
// //   try {
// //     await db.execute(
// //       'CALL sp_approve_registration(?, ?, ?, @roll)',
// //       [req.params.regId, admin_id, center_id]
// //     );
// //     const [[out]] = await db.execute('SELECT @roll AS roll_no');
// //     res.json({ success: true, roll_no: out.roll_no });
// //   } catch (err) {
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // });

// // // Reject a registration
// // router.post('/registrations/:regId/reject', async (req, res) => {
// //   try {
// //     const { remark } = req.body;
// //     await db.execute(
// //       `UPDATE registrations
// //        SET admin_status = 'Rejected', admin_remark = ?,
// //            reviewed_by = ?, reviewed_at = NOW()
// //        WHERE reg_id = ?`,
// //       [remark, req.session.user.id, req.params.regId]
// //     );
// //     res.json({ success: true });
// //   } catch (err) {
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // });

// // // All exams with report
// // router.get('/exams', async (req, res) => {
// //   try {
// //     const [rows] = await db.execute('SELECT * FROM vw_exam_report');
// //     res.json(rows);
// //   } catch (err) {
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // });

// // // Add new exam
// // router.post('/exams', async (req, res) => {
// //   try {
// //     const { exam_name, exam_code, exam_date, mode, fee_per_subject,
// //             reg_open_date, reg_deadline, late_deadline,
// //             hall_ticket_date, center_id } = req.body;
// //     await db.execute(
// //       `INSERT INTO exams
// //        (exam_name, exam_code, exam_date, mode, fee_per_subject,
// //         reg_open_date, reg_deadline, late_deadline,
// //         hall_ticket_date, center_id, created_by)
// //        VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
// //       [exam_name, exam_code, exam_date, mode, fee_per_subject,
// //        reg_open_date, reg_deadline, late_deadline,
// //        hall_ticket_date, center_id, req.session.user.id]
// //     );
// //     res.json({ success: true, message: 'Exam created!' });
// //   } catch (err) {
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // });

// // // All hall tickets
// // router.get('/hall-tickets', async (req, res) => {
// //   try {
// //     const [rows] = await db.execute('SELECT * FROM vw_hall_tickets');
// //     res.json(rows);
// //   } catch (err) {
// //     res.status(500).json({ success: false, message: err.message });
// //   }
// // });

// // module.exports = router;

// const express = require('express');
// const db = require('../db');
// const requireAdmin = require('../middleware/requireAdmin');

// const router = express.Router();

// /* =========================================================
//    ADMIN DASHBOARD
//    Matches:
//    - Total Students
//    - Active Exams
//    - Pending Approvals
//    - Hall Tickets Issued
// ========================================================= */
// router.get('/dashboard', requireAdmin, async (req, res) => {
//   try {
//     const [[students]] = await db.execute(`
//       SELECT COUNT(*) AS total_students FROM students
//     `);

//     const [[activeExams]] = await db.execute(`
//       SELECT COUNT(*) AS active_exams
//       FROM exams
//       WHERE status IN ('Open', 'Upcoming')
//     `);

//     const [[pendingRegs]] = await db.execute(`
//       SELECT COUNT(*) AS pending_approvals
//       FROM registrations
//       WHERE admin_status = 'Pending'
//     `);

//     const [[hallTickets]] = await db.execute(`
//       SELECT COUNT(*) AS total_hall_tickets
//       FROM hall_tickets
//     `);

//     const [recentRegistrations] = await db.execute(`
//       SELECT 
//         r.reg_id,
//         s.full_name AS student_name,
//         s.prn,
//         e.exam_name,
//         r.total_fee,
//         r.admin_status,
//         r.applied_on
//       FROM registrations r
//       JOIN students s ON r.student_id = s.student_id
//       JOIN exams e ON r.exam_id = e.exam_id
//       ORDER BY r.applied_on DESC
//       LIMIT 10
//     `);

//     res.json({
//       success: true,
//       stats: {
//         total_students: students.total_students,
//         active_exams: activeExams.active_exams,
//         pending_approvals: pendingRegs.pending_approvals,
//         hall_tickets_issued: hallTickets.total_hall_tickets
//       },
//       recent_registrations: recentRegistrations
//     });

//   } catch (err) {
//     console.error('Admin dashboard error:', err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

// /* =========================================================
//    MANAGE EXAM DETAILS
//    Frontend uses this for exam list
// ========================================================= */
// router.get('/exams', requireAdmin, async (req, res) => {
//   try {
//     const [rows] = await db.execute(`
//       SELECT 
//         e.exam_id,
//         e.exam_name,
//         e.exam_code,
//         e.exam_date,
//         e.start_time,
//         e.end_time,
//         e.mode,
//         e.fee_per_subject,
//         e.late_fine,
//         e.reg_open_date,
//         e.reg_deadline,
//         e.late_deadline,
//         e.hall_ticket_date,
//         e.status,
//         ec.center_name,

//         COUNT(DISTINCT r.reg_id) AS total_registered,
//         SUM(CASE WHEN r.admin_status = 'Approved' THEN 1 ELSE 0 END) AS approved,
//         SUM(CASE WHEN r.admin_status = 'Pending' THEN 1 ELSE 0 END) AS pending,
//         SUM(CASE WHEN r.admin_status = 'Rejected' THEN 1 ELSE 0 END) AS rejected

//       FROM exams e
//       LEFT JOIN exam_centers ec ON e.center_id = ec.center_id
//       LEFT JOIN registrations r ON e.exam_id = r.exam_id
//       GROUP BY e.exam_id
//       ORDER BY e.created_at DESC
//     `);

//     res.json(rows);
//   } catch (err) {
//     console.error('Get exams error:', err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

// /* =========================================================
//    CREATE NEW EXAM
//    For Manage Exam Details page
// ========================================================= */
// router.post('/exams', requireAdmin, async (req, res) => {
//   try {
//     const {
//       exam_name,
//       exam_code,
//       exam_date,
//       start_time,
//       end_time,
//       mode,
//       fee_per_subject,
//       late_fine,
//       reg_open_date,
//       reg_deadline,
//       late_deadline,
//       hall_ticket_date,
//       center_id,
//       status
//     } = req.body;

//     if (!exam_name || !exam_code || !exam_date || !reg_open_date || !reg_deadline) {
//       return res.status(400).json({
//         success: false,
//         message: 'Required fields missing'
//       });
//     }

//     await db.execute(`
//       INSERT INTO exams (
//         exam_name, exam_code, exam_date, start_time, end_time,
//         mode, fee_per_subject, late_fine,
//         reg_open_date, reg_deadline, late_deadline,
//         hall_ticket_date, center_id, status, created_by
//       )
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//     `, [
//       exam_name,
//       exam_code,
//       exam_date,
//       start_time || null,
//       end_time || null,
//       mode || 'Offline',
//       fee_per_subject || 500,
//       late_fine || 200,
//       reg_open_date,
//       reg_deadline,
//       late_deadline || null,
//       hall_ticket_date || null,
//       center_id || null,
//       status || 'Upcoming',
//       req.session.user.id
//     ]);

//     res.json({
//       success: true,
//       message: 'Exam created successfully'
//     });

//   } catch (err) {
//     console.error('Create exam error:', err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

// /* =========================================================
//    UPDATE EXAM DETAILS
// ========================================================= */
// router.put('/exams/:examId', requireAdmin, async (req, res) => {
//   try {
//     const examId = req.params.examId;

//     const {
//       exam_name,
//       exam_code,
//       exam_date,
//       start_time,
//       end_time,
//       mode,
//       fee_per_subject,
//       late_fine,
//       reg_open_date,
//       reg_deadline,
//       late_deadline,
//       hall_ticket_date,
//       center_id,
//       status
//     } = req.body;

//     await db.execute(`
//       UPDATE exams
//       SET exam_name = ?,
//           exam_code = ?,
//           exam_date = ?,
//           start_time = ?,
//           end_time = ?,
//           mode = ?,
//           fee_per_subject = ?,
//           late_fine = ?,
//           reg_open_date = ?,
//           reg_deadline = ?,
//           late_deadline = ?,
//           hall_ticket_date = ?,
//           center_id = ?,
//           status = ?
//       WHERE exam_id = ?
//     `, [
//       exam_name,
//       exam_code,
//       exam_date,
//       start_time || null,
//       end_time || null,
//       mode || 'Offline',
//       fee_per_subject || 500,
//       late_fine || 200,
//       reg_open_date,
//       reg_deadline,
//       late_deadline || null,
//       hall_ticket_date || null,
//       center_id || null,
//       status || 'Upcoming',
//       examId
//     ]);

//     res.json({
//       success: true,
//       message: 'Exam updated successfully'
//     });

//   } catch (err) {
//     console.error('Update exam error:', err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

// /* =========================================================
//    DELETE EXAM
// ========================================================= */
// router.delete('/exams/:examId', requireAdmin, async (req, res) => {
//   try {
//     await db.execute(`DELETE FROM exams WHERE exam_id = ?`, [req.params.examId]);

//     res.json({
//       success: true,
//       message: 'Exam deleted successfully'
//     });
//   } catch (err) {
//     console.error('Delete exam error:', err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

// /* =========================================================
//    APPROVE / REJECT REGISTRATIONS
//    Frontend already calls this page
// ========================================================= */
// router.get('/registrations', requireAdmin, async (req, res) => {
//   try {
//     const [rows] = await db.execute(`
//       SELECT 
//         r.reg_id,
//         s.student_id,
//         s.full_name AS student_name,
//         s.prn,
//         s.email,
//         s.course,
//         s.branch,
//         s.semester,
//         e.exam_id,
//         e.exam_name,
//         e.exam_code,
//         r.total_fee,
//         r.admin_status,
//         r.admin_remark,
//         r.applied_on,
//         p.status AS payment_status,
//         COUNT(rs.subject_id) AS subject_count
//       FROM registrations r
//       JOIN students s ON r.student_id = s.student_id
//       JOIN exams e ON r.exam_id = e.exam_id
//       LEFT JOIN payments p ON r.reg_id = p.reg_id
//       LEFT JOIN registration_subjects rs ON r.reg_id = rs.reg_id
//       GROUP BY r.reg_id
//       ORDER BY r.applied_on DESC
//     `);

//     res.json(rows);
//   } catch (err) {
//     console.error('Registrations error:', err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

// /* =========================================================
//    APPROVE REGISTRATION
//    Also auto-generates hall ticket
// ========================================================= */
// router.post('/registrations/:regId/approve', requireAdmin, async (req, res) => {
//   const regId = req.params.regId;
//   const adminId = req.session.user.id;
//   const center_id = req.body.center_id || 1;

//   try {
//     const [regRows] = await db.execute(
//       `SELECT * FROM registrations WHERE reg_id = ?`,
//       [regId]
//     );

//     if (!regRows.length) {
//       return res.status(404).json({
//         success: false,
//         message: 'Registration not found'
//       });
//     }

//     const registration = regRows[0];

//     if (registration.admin_status === 'Approved') {
//       return res.status(400).json({
//         success: false,
//         message: 'Already approved'
//       });
//     }

//     await db.execute(`
//       UPDATE registrations
//       SET admin_status = 'Approved',
//           reviewed_by = ?,
//           reviewed_at = NOW(),
//           admin_remark = 'Approved by admin'
//       WHERE reg_id = ?
//     `, [adminId, regId]);

//     const rollNo = `ROLL${Date.now().toString().slice(-6)}${regId}`;

//     const [ticketRows] = await db.execute(
//       `SELECT * FROM hall_tickets WHERE reg_id = ?`,
//       [regId]
//     );

//     if (!ticketRows.length) {
//       await db.execute(`
//         INSERT INTO hall_tickets (reg_id, roll_number, center_id, seat_number, issued_by)
//         VALUES (?, ?, ?, ?, ?)
//       `, [
//         regId,
//         rollNo,
//         center_id,
//         `S${Math.floor(Math.random() * 900 + 100)}`,
//         adminId
//       ]);
//     }

//     res.json({
//       success: true,
//       message: 'Registration approved successfully',
//       roll_number: rollNo
//     });

//   } catch (err) {
//     console.error('Approve error:', err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

// /* =========================================================
//    REJECT REGISTRATION
// ========================================================= */
// router.post('/registrations/:regId/reject', requireAdmin, async (req, res) => {
//   const regId = req.params.regId;
//   const adminId = req.session.user.id;
//   const { remark } = req.body;

//   try {
//     await db.execute(`
//       UPDATE registrations
//       SET admin_status = 'Rejected',
//           admin_remark = ?,
//           reviewed_by = ?,
//           reviewed_at = NOW()
//       WHERE reg_id = ?
//     `, [remark || 'Rejected by admin', adminId, regId]);

//     res.json({
//       success: true,
//       message: 'Registration rejected successfully'
//     });

//   } catch (err) {
//     console.error('Reject error:', err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

// /* =========================================================
//    GENERATE / VIEW HALL TICKETS
// ========================================================= */
// router.get('/hall-tickets', requireAdmin, async (req, res) => {
//   try {
//     const [rows] = await db.execute(`
//       SELECT 
//         ht.ticket_id,
//         ht.roll_number,
//         ht.seat_number,
//         ht.issued_on,
//         ht.status,
//         s.full_name AS student_name,
//         s.prn,
//         s.email,
//         e.exam_name,
//         e.exam_code,
//         e.exam_date,
//         ec.center_name,
//         ec.city,
//         ec.address
//       FROM hall_tickets ht
//       JOIN registrations r ON ht.reg_id = r.reg_id
//       JOIN students s ON r.student_id = s.student_id
//       JOIN exams e ON r.exam_id = e.exam_id
//       LEFT JOIN exam_centers ec ON ht.center_id = ec.center_id
//       ORDER BY ht.issued_on DESC
//     `);

//     res.json(rows);
//   } catch (err) {
//     console.error('Hall tickets error:', err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

// /* =========================================================
//    GENERATE SINGLE HALL TICKET MANUALLY
// ========================================================= */
// router.post('/hall-tickets/generate', requireAdmin, async (req, res) => {
//   const { reg_id, center_id } = req.body;
//   const adminId = req.session.user.id;

//   try {
//     const [existing] = await db.execute(
//       `SELECT * FROM hall_tickets WHERE reg_id = ?`,
//       [reg_id]
//     );

//     if (existing.length > 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Hall ticket already exists'
//       });
//     }

//     const rollNo = `ROLL${Date.now().toString().slice(-6)}${reg_id}`;

//     await db.execute(`
//       INSERT INTO hall_tickets (reg_id, roll_number, center_id, seat_number, issued_by)
//       VALUES (?, ?, ?, ?, ?)
//     `, [
//       reg_id,
//       rollNo,
//       center_id || 1,
//       `S${Math.floor(Math.random() * 900 + 100)}`,
//       adminId
//     ]);

//     res.json({
//       success: true,
//       message: 'Hall ticket generated successfully',
//       roll_number: rollNo
//     });

//   } catch (err) {
//     console.error('Generate hall ticket error:', err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

// /* =========================================================
//    GENERATE REPORTS
// ========================================================= */

// /* Registration Report */
// router.get('/reports/registrations', requireAdmin, async (req, res) => {
//   try {
//     const [rows] = await db.execute(`
//       SELECT 
//         e.exam_name,
//         COUNT(r.reg_id) AS total_registrations,
//         SUM(CASE WHEN r.admin_status = 'Approved' THEN 1 ELSE 0 END) AS approved,
//         SUM(CASE WHEN r.admin_status = 'Pending' THEN 1 ELSE 0 END) AS pending,
//         SUM(CASE WHEN r.admin_status = 'Rejected' THEN 1 ELSE 0 END) AS rejected
//       FROM exams e
//       LEFT JOIN registrations r ON e.exam_id = r.exam_id
//       GROUP BY e.exam_id
//       ORDER BY e.exam_date DESC
//     `);

//     res.json({
//       success: true,
//       report_type: 'registration_report',
//       data: rows
//     });
//   } catch (err) {
//     console.error('Registration report error:', err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

// /* Payment Report */
// router.get('/reports/payments', requireAdmin, async (req, res) => {
//   try {
//     const [rows] = await db.execute(`
//       SELECT 
//         e.exam_name,
//         COUNT(p.payment_id) AS total_payments,
//         SUM(CASE WHEN p.status = 'Paid' THEN p.amount ELSE 0 END) AS total_collected,
//         SUM(CASE WHEN p.status = 'Pending' THEN p.amount ELSE 0 END) AS pending_amount
//       FROM exams e
//       LEFT JOIN registrations r ON e.exam_id = r.exam_id
//       LEFT JOIN payments p ON r.reg_id = p.reg_id
//       GROUP BY e.exam_id
//       ORDER BY e.exam_date DESC
//     `);

//     res.json({
//       success: true,
//       report_type: 'payment_report',
//       data: rows
//     });
//   } catch (err) {
//     console.error('Payment report error:', err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

// /* Hall Ticket Report */
// router.get('/reports/hall-tickets', requireAdmin, async (req, res) => {
//   try {
//     const [rows] = await db.execute(`
//       SELECT 
//         e.exam_name,
//         COUNT(r.reg_id) AS approved_students,
//         COUNT(ht.ticket_id) AS issued_hall_tickets,
//         (COUNT(r.reg_id) - COUNT(ht.ticket_id)) AS pending_hall_tickets
//       FROM exams e
//       LEFT JOIN registrations r 
//         ON e.exam_id = r.exam_id AND r.admin_status = 'Approved'
//       LEFT JOIN hall_tickets ht 
//         ON r.reg_id = ht.reg_id
//       GROUP BY e.exam_id
//       ORDER BY e.exam_date DESC
//     `);

//     res.json({
//       success: true,
//       report_type: 'hall_ticket_report',
//       data: rows
//     });
//   } catch (err) {
//     console.error('Hall ticket report error:', err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

// /* Custom Report */
// router.get('/reports/custom', requireAdmin, async (req, res) => {
//   try {
//     const { exam_id, status } = req.query;

//     let sql = `
//       SELECT 
//         s.full_name AS student_name,
//         s.prn,
//         s.course,
//         s.branch,
//         e.exam_name,
//         r.total_fee,
//         r.admin_status,
//         r.applied_on
//       FROM registrations r
//       JOIN students s ON r.student_id = s.student_id
//       JOIN exams e ON r.exam_id = e.exam_id
//       WHERE 1=1
//     `;

//     const params = [];

//     if (exam_id) {
//       sql += ` AND e.exam_id = ?`;
//       params.push(exam_id);
//     }

//     if (status) {
//       sql += ` AND r.admin_status = ?`;
//       params.push(status);
//     }

//     sql += ` ORDER BY r.applied_on DESC`;

//     const [rows] = await db.execute(sql, params);

//     res.json({
//       success: true,
//       report_type: 'custom_report',
//       data: rows
//     });
//   } catch (err) {
//     console.error('Custom report error:', err);
//     res.status(500).json({
//       success: false,
//       message: err.message
//     });
//   }
// });

// module.exports = router;

const express = require('express');
const db      = require('../db');
const router  = express.Router();

// ─── AUTH GUARD ───────────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'admin')
    return res.status(401).json({ success: false, message: 'Admin access required.' });
  next();
}

// ══════════════════════════════════════════════════════════════════════════════
//  REGISTRATIONS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/registrations
router.get('/registrations', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.reg_id,
              s.full_name   AS student_name,
              s.prn,
              e.exam_name,
              e.exam_code,
              COUNT(rs.subject_id) AS subject_count,
              r.total_fee,
              COALESCE(p.status,'Unpaid') AS payment_status,
              r.admin_status,
              r.applied_on
       FROM registrations r
       JOIN students s   ON r.student_id = s.student_id
       JOIN exams e       ON r.exam_id   = e.exam_id
       LEFT JOIN registration_subjects rs ON r.reg_id  = rs.reg_id
       LEFT JOIN payments p               ON r.reg_id  = p.reg_id
       GROUP BY r.reg_id
       ORDER BY r.applied_on DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /registrations error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/registrations/:regId/approve
router.post('/registrations/:regId/approve', requireAdmin, async (req, res) => {
  const admin_id  = req.session.user.id;
  const center_id = req.body.center_id || 1;
  const regId     = req.params.regId;

  try {
    // Call stored procedure
    await db.execute(
      'CALL sp_approve_registration(?, ?, ?, @roll)',
      [regId, admin_id, center_id]
    );
    const [[out]] = await db.execute('SELECT @roll AS roll_no');
    res.json({ success: true, roll_no: out.roll_no });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/registrations/:regId/reject
router.post('/registrations/:regId/reject', requireAdmin, async (req, res) => {
  const { remark } = req.body;
  try {
    await db.execute(
      `UPDATE registrations
       SET admin_status  = 'Rejected',
           admin_remark  = ?,
           reviewed_by   = ?,
           reviewed_at   = NOW()
       WHERE reg_id = ?`,
      [remark || 'Rejected by admin', req.session.user.id, req.params.regId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  EXAMS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/exams  — returns exam list with registration counts
router.get('/exams', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT e.exam_id,
              e.exam_name,
              e.exam_code,
              e.exam_date,
              e.reg_deadline,
              e.fee_per_subject,
              e.mode,
              e.status,
              COUNT(r.reg_id)                              AS total_registered,
              SUM(r.admin_status = 'Approved')             AS approved,
              SUM(r.admin_status = 'Rejected')             AS rejected,
              SUM(r.admin_status = 'Pending')              AS pending,
              SUM(CASE WHEN p.status = 'Completed'
                       THEN p.amount ELSE 0 END)           AS fee_collected
       FROM exams e
       LEFT JOIN registrations r ON e.exam_id = r.exam_id
       LEFT JOIN payments p      ON r.reg_id  = p.reg_id
       GROUP BY e.exam_id
       ORDER BY e.exam_date DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /exams error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/exams  — add a new exam
router.post('/exams', requireAdmin, async (req, res) => {
  const {
    exam_name, exam_code, exam_date, last_date,
    exam_mode, fee, description, subjects, center
  } = req.body;

  if (!exam_name || !exam_code || !exam_date || !last_date || !fee)
    return res.status(400).json({ success: false, message: 'Name, code, dates and fee are required.' });

  try {
    // Insert exam
    const [result] = await db.execute(
      `INSERT INTO exams
         (exam_name, exam_code, exam_date, mode, fee_per_subject,
          reg_open_date, reg_deadline, status, created_by)
       VALUES (?, ?, ?, ?, ?, CURDATE(), ?, 'Open', ?)`,
      [exam_name, exam_code, exam_date,
       exam_mode || 'Offline', parseFloat(fee) || 500,
       last_date, req.session.user.id]
    );

    const newExamId = result.insertId;

    // If subjects provided, create them and link to exam
    if (subjects && subjects.trim()) {
      const subjectList = subjects.split(',').map(s => s.trim()).filter(Boolean);
      for (const subName of subjectList) {
        const subCode = subName.replace(/\s+/g, '_').toUpperCase().substring(0, 20);
        try {
          // Insert subject if not exists
          await db.execute(
            `INSERT IGNORE INTO subjects (subject_code, subject_name, department)
             VALUES (?, ?, 'General')`,
            [subCode, subName]
          );
          // Get the subject_id
          const [[sub]] = await db.execute(
            'SELECT subject_id FROM subjects WHERE subject_code = ?',
            [subCode]
          );
          if (sub) {
            await db.execute(
              'INSERT IGNORE INTO exam_subjects (exam_id, subject_id) VALUES (?, ?)',
              [newExamId, sub.subject_id]
            );
          }
        } catch (subErr) {
          console.warn('Subject insert warning:', subErr.message);
        }
      }
    }

    // Add default exam schedule events
    const scheduleEvents = [
      ['Registration Opens',   new Date().toISOString().split('T')[0], 'Upcoming'],
      ['Registration Deadline', last_date, 'Upcoming'],
      ['Examination Begins',    exam_date, 'Upcoming'],
    ];
    for (const [name, date, status] of scheduleEvents) {
      await db.execute(
        `INSERT INTO exam_schedule (exam_id, event_name, event_date, event_status)
         VALUES (?, ?, ?, ?)`,
        [newExamId, name, date, status]
      );
    }

    res.json({ success: true, message: 'Exam created!', exam_id: newExamId });
  } catch (err) {
    console.error('POST /exams error:', err);
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ success: false, message: 'Exam code already exists.' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// // POST /api/admin/exams — add a new exam
// router.post('/exams', requireAdmin, async (req, res) => {
//   let {
//     exam_name, exam_code, exam_date, last_date,
//     exam_mode, fee, description, subjects, center
//   } = req.body;

//   if (!exam_name || !exam_code || !exam_date || !last_date || !fee)
//     return res.status(400).json({ success: false, message: 'Name, code, dates and fee are required.' });

//   // ── FIX 1: Normalise date format ──────────────────────────────────────────
//   // Browser may send DD-MM-YYYY (Indian locale) or YYYY-MM-DD.
//   // MySQL needs YYYY-MM-DD strictly.
//   function toMysqlDate(d) {
//     if (!d) return null;
//     // Already YYYY-MM-DD
//     if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
//     // DD-MM-YYYY  →  YYYY-MM-DD
//     if (/^\d{2}-\d{2}-\d{4}$/.test(d)) {
//       const [dd, mm, yyyy] = d.split('-');
//       return `${yyyy}-${mm}-${dd}`;
//     }
//     // DD/MM/YYYY  →  YYYY-MM-DD
//     if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
//       const [dd, mm, yyyy] = d.split('/');
//       return `${yyyy}-${mm}-${dd}`;
//     }
//     return d; // fallback — let MySQL reject it with a clear error
//   }

//   exam_date = toMysqlDate(exam_date);
//   last_date = toMysqlDate(last_date);

//   if (!exam_date || !last_date)
//     return res.status(400).json({ success: false, message: 'Invalid date format. Please re-select dates.' });

//   // ── FIX 2: Safely resolve admin id ────────────────────────────────────────
//   const adminId = req.session.user.id ?? req.session.user.admin_id ?? null;

//   // ── FIX 3: Coerce fee to number, default 500 ──────────────────────────────
//   const parsedFee = parseFloat(fee) || 500;

//   try {
//     const [result] = await db.execute(
//       `INSERT INTO exams
//         (exam_name, exam_code, exam_date, mode, fee_per_subject,
//          reg_open_date, reg_deadline, status, created_by)
//        VALUES (?, ?, ?, ?, ?, CURDATE(), ?, 'Open', ?)`,
//       [
//         exam_name,
//         exam_code,
//         exam_date,
//         exam_mode || 'Offline',
//         parsedFee,
//         last_date,
//         adminId          // null is safe; undefined causes the crash
//       ]
//     );
//     const newExamId = result.insertId;

//     // Link subjects if provided
//     if (subjects && subjects.trim()) {
//       const subjectList = subjects.split(',').map(s => s.trim()).filter(Boolean);
//       for (const subName of subjectList) {
//         const subCode = subName.replace(/\s+/g, '_').toUpperCase().substring(0, 20);
//         try {
//           await db.execute(
//             `INSERT IGNORE INTO subjects (subject_code, subject_name, department)
//              VALUES (?, ?, 'General')`,
//             [subCode, subName]
//           );
//           const [[sub]] = await db.execute(
//             'SELECT subject_id FROM subjects WHERE subject_code = ?',
//             [subCode]
//           );
//           if (sub) {
//             await db.execute(
//               'INSERT IGNORE INTO exam_subjects (exam_id, subject_id) VALUES (?, ?)',
//               [newExamId, sub.subject_id]
//             );
//           }
//         } catch (subErr) {
//           console.warn('Subject insert warning:', subErr.message);
//         }
//       }
//     }

//     // Add default schedule events
//     const scheduleEvents = [
//       ['Registration Opens',  new Date().toISOString().split('T')[0], 'Upcoming'],
//       ['Registration Deadline', last_date,  'Upcoming'],
//       ['Examination Begins',    exam_date,  'Upcoming'],
//     ];
//     for (const [name, date, status] of scheduleEvents) {
//       await db.execute(
//         `INSERT INTO exam_schedule (exam_id, event_name, event_date, event_status)
//          VALUES (?, ?, ?, ?)`,
//         [newExamId, name, date, status]
//       );
//     }

//     res.json({ success: true, message: 'Exam created!', exam_id: newExamId });

//   } catch (err) {
//     console.error('POST /exams error:', err);
//     if (err.code === 'ER_DUP_ENTRY')
//       return res.status(400).json({ success: false, message: 'Exam code already exists.' });
//     res.status(500).json({ success: false, message: err.message });
//   }
// });

// ══════════════════════════════════════════════════════════════════════════════
//  HALL TICKETS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/hall-tickets  — all issued hall tickets
router.get('/hall-tickets', requireAdmin, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT ht.ticket_id,
              ht.roll_number,
              ht.seat_number,
              ht.issued_on,
              ht.status,
              s.full_name  AS student_name,
              s.prn,
              e.exam_name,
              e.exam_code,
              e.exam_date,
              e.start_time AS reporting_time,
              ec.center_name,
              ec.city,
              ec.address   AS center_address
       FROM hall_tickets ht
       JOIN registrations r   ON ht.reg_id    = r.reg_id
       JOIN students s        ON r.student_id  = s.student_id
       JOIN exams e           ON r.exam_id     = e.exam_id
       LEFT JOIN exam_centers ec ON ht.center_id = ec.center_id
       ORDER BY ht.issued_on DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /hall-tickets error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/hall-tickets/bulk  — generate hall tickets for all approved in an exam
router.post('/hall-tickets/bulk', requireAdmin, async (req, res) => {
  const { exam_id } = req.body;
  if (!exam_id)
    return res.status(400).json({ success: false, message: 'exam_id required.' });

  try {
    // Get all approved registrations for this exam that don't have a hall ticket yet
    const [regs] = await db.execute(
      `SELECT r.reg_id
       FROM registrations r
       LEFT JOIN hall_tickets ht ON r.reg_id = ht.reg_id
       WHERE r.exam_id = ? AND r.admin_status = 'Approved' AND ht.ticket_id IS NULL`,
      [exam_id]
    );

    if (!regs.length)
      return res.json({ success: true, message: 'No new approved registrations to process.', count: 0 });

    let count = 0;
    for (const reg of regs) {
      try {
        await db.execute('CALL sp_approve_registration(?, ?, ?, @roll)', [reg.reg_id, req.session.user.id, 1]);
        count++;
      } catch (e) {
        console.warn('Bulk ticket warn for reg_id', reg.reg_id, e.message);
      }
    }

    res.json({ success: true, message: `Generated ${count} hall tickets.`, count });
  } catch (err) {
    console.error('POST /hall-tickets/bulk error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/hall-tickets/lookup?prn=...&exam_id=...
router.get('/hall-tickets/lookup', requireAdmin, async (req, res) => {
  const { prn, exam_id } = req.query;
  if (!prn)
    return res.status(400).json({ success: false, message: 'PRN required.' });

  try {
    let sql = `
      SELECT ht.ticket_id, ht.roll_number, ht.seat_number, ht.issued_on,
             s.full_name AS student_name, s.prn,
             e.exam_name, e.exam_code, e.exam_date, e.start_time AS reporting_time,
             ec.center_name, ec.city, ec.address AS center_address,
             GROUP_CONCAT(sub.subject_name SEPARATOR ', ') AS subjects
      FROM hall_tickets ht
      JOIN registrations r   ON ht.reg_id   = r.reg_id
      JOIN students s        ON r.student_id = s.student_id
      JOIN exams e           ON r.exam_id    = e.exam_id
      LEFT JOIN exam_centers ec ON ht.center_id = ec.center_id
      LEFT JOIN registration_subjects rs ON r.reg_id = rs.reg_id
      LEFT JOIN subjects sub ON rs.subject_id = sub.subject_id
      WHERE (s.prn = ? OR ht.roll_number = ?)`;

    const params = [prn, prn];

    if (exam_id) {
      sql += ' AND e.exam_id = ?';
      params.push(exam_id);
    }

    sql += ' GROUP BY ht.ticket_id LIMIT 1';

    const [rows] = await db.execute(sql, params);

    if (!rows.length)
      return res.status(404).json({ success: false, message: 'No hall ticket found for this PRN.' });

    res.json(rows[0]);
  } catch (err) {
    console.error('GET /hall-tickets/lookup error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  DASHBOARD STATS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/admin/stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [[{ total_students }]] = await db.execute('SELECT COUNT(*) AS total_students FROM students');
    const [[{ active_exams }]]   = await db.execute("SELECT COUNT(*) AS active_exams FROM exams WHERE status = 'Open'");
    const [[{ pending }]]        = await db.execute("SELECT COUNT(*) AS pending FROM registrations WHERE admin_status = 'Pending'");
    const [[{ hall_tickets }]]   = await db.execute("SELECT COUNT(*) AS hall_tickets FROM hall_tickets WHERE status = 'Issued'");

    res.json({ total_students, active_exams, pending, hall_tickets });
  } catch (err) {
    console.error('GET /stats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;