const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

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

Keep replies short, friendly and helpful. Use emojis naturally.`;

// Store conversation history per session
const sessions = {};

router.post('/ask', async (req, res) => {
  const { message, sessionId } = req.body;

  // Initialize session history if new
  if (!sessions[sessionId]) {
    sessions[sessionId] = [];
  }

  // Add user message to history
  sessions[sessionId].push({
    role: 'user',
    content: message
  });

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: sessions[sessionId]
    });

    const reply = response.content[0].text;

    // Add AI reply to history
    sessions[sessionId].push({
      role: 'assistant',
      content: reply
    });

    res.json({ reply });

  } catch (err) {
    console.error('Claude API error:', err.message);
    res.json({ reply: '⚠️ Sorry, AI is unavailable right now. Please try again.' });
  }
});

module.exports = router;