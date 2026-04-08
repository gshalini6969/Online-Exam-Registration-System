const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const db = require('../db');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const sessions = {};

router.post('/ask', async (req, res) => {
  const { message } = req.body;

  // Get logged in student from session
  const studentId = req.session?.studentId;

  let studentContext = '';

  try {
    // If student is logged in → fetch THEIR subjects from DB
    if (studentId) {
      const [studentRows] = await db.query(
        'SELECT full_name, prn FROM students WHERE student_id = ?',
        [studentId]
      );

      const [subjectRows] = await db.query(
        `SELECT s.subject_code, s.subject_name, s.credits
         FROM registration_subjects rs
         JOIN subjects s ON rs.subject_id = s.subject_id
         JOIN registrations r ON rs.reg_id = r.reg_id
         WHERE r.student_id = ?`,
        [studentId]
      );

      const [regRows] = await db.query(
        `SELECT r.total_fee, r.admin_status, p.status as payment_status
         FROM registrations r
         LEFT JOIN payments p ON r.reg_id = p.reg_id
         WHERE r.student_id = ?`,
        [studentId]
      );

      if (studentRows.length) {
        const student = studentRows[0];
        const subjects = subjectRows.map(s =>
          `${s.subject_code} - ${s.subject_name} (${s.credits} credits)`
        ).join(', ');

        const reg = regRows[0];

        studentContext = `
The student asking is: ${student.full_name} (PRN: ${student.prn})
Their registered subjects: ${subjects || 'No subjects registered yet'}
Their registration status: ${reg?.admin_status || 'Not registered'}
Their payment status: ${reg?.payment_status || 'Not paid'}
Total fee: Rs.${reg?.total_fee || 0}
        `;
      }
    } else {
      studentContext = 'The student is not logged in. Answer generally.';
    }

    // Build system prompt with student context
    const SYSTEM_PROMPT = `You are ExamBot AI, a helpful assistant for the Online Exam Registration System (OERS).

${studentContext}

General exam info:
- All subjects available: CS401-Data Structures, CS402-DBMS, CS403-OS, CS404-Networks, CS405-Software Engg, MA401-Maths IV
- Fee: Rs.500 per subject. Late fine: Rs.200. Payment: UPI, Net Banking, Debit/Credit cards.
- Exam: End Semester April 2026. Date: April 20 2026. Time: 10AM-1PM. Mode: Offline.
- Deadlines: Registration opens Mar 15, Last date Mar 31, Late fine till Apr 5, Hall ticket Apr 10
- Registration steps: Login → Exam Registration → Select subjects → Pay fee → Download hall ticket
- Documents needed: Student ID, Enrollment Number, Fee receipt, 75% attendance, passport photo
- Cancellation: Before last date only. Refund in 7 working days.

When student asks about "my subjects" or "my registration" → use their personal data above.
Keep replies short, friendly and helpful. Use emojis naturally.`;

    // Session history
    const sessionId = req.session?.id || 'default';
    if (!sessions[sessionId]) sessions[sessionId] = [];

    sessions[sessionId].push({ role: 'user', content: message });

    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: sessions[sessionId]
    });

    const reply = response.content[0].text;
    sessions[sessionId].push({ role: 'assistant', content: reply });

    res.json({ reply });

  } catch (err) {
    console.error('Chatbot error:', err.message);
    res.json({ reply: '⚠️ Sorry, something went wrong. Please try again.' });
  }
});

module.exports = router;