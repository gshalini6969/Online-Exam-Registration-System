const express  = require('express');
const bcrypt   = require('bcryptjs');
const db       = require('../db');
const router   = express.Router();

// STUDENT SIGNUP
router.post('/signup/student', async (req, res) => {
  const { email, username, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.execute(
    'INSERT INTO students (full_name, email, username, password_hash) VALUES (?,?,?,?)',
    [username, email, username, hash]
    );
    res.json({ success: true, message: 'Account created!' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ success: false, message: 'Email or username already exists.' });
    console.log(err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADMIN SIGNUP
router.post('/signup/admin', async (req, res) => {
  const { email, username, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO admins (full_name, email, username, password_hash) VALUES (?,?,?,?)',
      [username, email, username, hash]
    );
    res.json({ success: true, message: 'Admin account created!' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(400).json({ success: false, message: 'Email or username already exists.' });
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// STUDENT LOGIN
router.post('/login/student', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM students WHERE username = ?', [username]
    );
    if (!rows.length)
      return res.status(401).json({ success: false, message: 'User not found.' });

    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match)
      return res.status(401).json({ success: false, message: 'Wrong password.' });

    req.session.user = { id: rows[0].student_id, name: rows[0].full_name, role: 'student' };
    res.json({ success: true, role: 'student' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ADMIN LOGIN
router.post('/login/admin', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.execute(
      'SELECT * FROM admins WHERE username = ?', [username]
    );
    if (!rows.length)
      return res.status(401).json({ success: false, message: 'Admin not found.' });

    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match)
      return res.status(401).json({ success: false, message: 'Wrong password.' });

    req.session.user = { id: rows[0].admin_id, name: rows[0].full_name, role: 'admin' };
    res.json({ success: true, role: 'admin' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// LOGOUT
router.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

module.exports = router;