const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const db = require('../db');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const sessions = {};

const SYSTEM_PROMPT = `You are ExamBot AI, a helpful assistant for the Online Exam Registration System (OERS).

You help students with:
- Subjects: CS401-Data Structures, CS402-DBMS, CS403-OS, CS404-Networks, CS405-Software Engg, MA401-Maths IV
- Fee: Rs.500 per subject. Late fine: Rs.200. Payment: UPI, Net Banking, Debit/Credit cards.
- Exam: End Semester April 2026. Date: April 20 2026. Time: 10AM-1PM. Mode: Offline.
- Deadlines: Registration opens Mar 15, Last date Mar 31, Late fine till Apr 5, Hall ticket Apr 10
- Registration steps: Login → Exam Registration → Select subjects → Pay fee → Download hall ticket
- Documents needed: Student ID, Enrollment Number, Fee receipt, 75% attendance, passport photo
- Cancellation: Before last date only. Refund in 7 working days.
- Exam centers: JNTU Hall A, Osmania University Centre, CBIT Block — all in Hyderabad

When student asks about their personal subjects or registration → use their personal data provided.
Keep replies short, friendly and helpful. Use emojis naturally.`;

router.post('/ask', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.json({ reply: 'Please type a message!' });

  const studentId = req.session?.studentId;
  const sessionId = req.session?.id || 'guest-' + Date.now();

  let personalContext = '';

  try {
    // Fetch student's personal data if logged in
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
        const subjects = subjectRows.length
          ? subjectRows.map(s => `${s.subject_code} - ${s.subject_name}`).join(', ')
          : 'No subjects registered yet';
        const reg = regRows[0];

        personalContext = `
Student name: ${student.full_name} (PRN: ${student.prn})
Their registered subjects: ${subjects}
Registration status: ${reg?.admin_status || 'Not registered'}
Payment status: ${reg?.payment_status || 'Not paid'}
Total fee: Rs.${reg?.total_fee || 0}`;
      }
    }

    // Initialize session
    if (!sessions[sessionId]) sessions[sessionId] = [];

    // Add user message
    sessions[sessionId].push({ role: 'user', content: message });

    // Keep history to last 10 messages only
    if (sessions[sessionId].length > 10) {
      sessions[sessionId] = sessions[sessionId].slice(-10);
    }

    const fullSystem = personalContext
      ? `${SYSTEM_PROMPT}\n\nPersonal student info:\n${personalContext}`
      : SYSTEM_PROMPT;

    // Call Groq AI
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 512,
      messages: [
        { role: 'system', content: fullSystem },
        ...sessions[sessionId]
      ]
    });

    const reply = response.choices[0]?.message?.content || "Sorry, I couldn't get a response.";

    // Save reply to history
    sessions[sessionId].push({ role: 'assistant', content: reply });

    res.json({ reply });

  } catch (err) {
    console.error('Chatbot error:', err.message);
    res.json({ reply: '⚠️ Sorry, something went wrong. Please try again.' });
  }
});

module.exports = router;