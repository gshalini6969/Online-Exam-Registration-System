// routes/chatbot.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.post('/ask', async (req, res) => {
  const { message } = req.body;
  const q = message.toLowerCase();

  try {

    // 1. Subjects query
    if (q.match(/subject|course|paper/)) {
      const [rows] = await db.query('SELECT subject_code, subject_name, credits FROM subjects');
      const list = rows.map(r => `${r.subject_code} - ${r.subject_name} (${r.credits} credits)`).join('\n');
      return res.json({ reply: `📚 Available subjects:\n${list}` });
    }

    // 2. Deadline / dates query
    if (q.match(/deadline|date|when|schedule/)) {
      const [rows] = await db.query(
        'SELECT event_name, event_date, event_status FROM exam_schedule ORDER BY event_date'
      );
      const list = rows.map(r => `📅 ${r.event_name}: ${new Date(r.event_date).toDateString()} [${r.event_status}]`).join('\n');
      return res.json({ reply: `Exam Schedule:\n${list}` });
    }

    // 3. Fee query
    if (q.match(/fee|pay|cost|price|amount/)) {
      const [rows] = await db.query(
        'SELECT fee_per_subject, late_fine FROM exams WHERE status = "Open" LIMIT 1'
      );
      if (rows.length) {
        return res.json({ reply: `💰 Fee: ₹${rows[0].fee_per_subject}/subject. Late fine: ₹${rows[0].late_fine}. Accepted: UPI, Net Banking, Debit/Credit card.` });
      }
    }

    // 4. Exam info query
    if (q.match(/exam|register|registration/)) {
      const [rows] = await db.query(
        'SELECT exam_name, exam_date, reg_deadline, status FROM exams WHERE status = "Open" LIMIT 1'
      );
      if (rows.length) {
        const e = rows[0];
        return res.json({ reply: `📝 ${e.exam_name}\nExam Date: ${new Date(e.exam_date).toDateString()}\nRegistration Deadline: ${new Date(e.reg_deadline).toDateString()}\nStatus: ${e.status}` });
      }
    }

    // 5. Hall ticket query
    if (q.match(/hall ticket|admit card|ticket/)) {
      const [rows] = await db.query(
        'SELECT hall_ticket_date FROM exams WHERE status = "Open" LIMIT 1'
      );
      if (rows.length && rows[0].hall_ticket_date) {
        return res.json({ reply: `🎫 Hall tickets will be available from ${new Date(rows[0].hall_ticket_date).toDateString()}. Login → My Registrations → Download Hall Ticket.` });
      }
    }

    // Default fallback
    return res.json({ reply: `I can help with: subjects, fees, deadlines, exam info, or hall tickets. What would you like to know?` });

  } catch (err) {
    console.error(err);
    return res.json({ reply: '⚠️ Sorry, I could not fetch data right now. Please try again.' });
  }
});

module.exports = router;