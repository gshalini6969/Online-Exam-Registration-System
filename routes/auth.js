<<<<<<< HEAD
const express    = require('express');
const bcrypt     = require('bcryptjs');
const nodemailer = require('nodemailer');
const db         = require('../db');
const router     = express.Router();

console.log('Auth routes loaded');

// Gmail transporter with your credentials
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS.replace(/\s/g, '') // Remove spaces from app password
  }
});

// Verify email connection on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email service ready to send OTPs');
  }
});

const genOtp = () => String(Math.floor(100000 + Math.random() * 900000));

// ─── SEND OTP ──────────────────────────────────────────────────────────────
router.post('/send-otp', async (req, res) => {
  console.log('Send OTP request:', req.body);
  const { email, role } = req.body;
  
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email required.' });
  }

  const code      = genOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  try {
    // Check if otp_verifications table exists, if not create it
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS otp_verifications (
          otp_id INT AUTO_INCREMENT PRIMARY KEY,
          email VARCHAR(120) NOT NULL,
          otp_code VARCHAR(10) NOT NULL,
          purpose VARCHAR(50) DEFAULT 'signup',
          is_used TINYINT DEFAULT 0,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } catch (tableErr) {
      console.log('Table creation check:', tableErr.message);
    }

    // Invalidate old OTPs
    await db.execute(
      `UPDATE otp_verifications SET is_used = 1
       WHERE email = ? AND purpose = 'signup' AND is_used = 0`,
      [email]
    );

    // Insert new OTP
    await db.execute(
      `INSERT INTO otp_verifications (email, otp_code, purpose, expires_at)
       VALUES (?, ?, 'signup', ?)`,
      [email, code, expiresAt]
    );

    // Send email
    await transporter.sendMail({
      from   : `"ExamPortal" <${process.env.MAIL_USER}>`,
      to     : email,
      subject: 'Your OTP for ExamPortal Registration',
      html   : `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #d4ead9;border-radius:12px">
          <h2 style="color:#2d6a4f;">ExamPortal Email Verification</h2>
          <p>Use the OTP below to complete your <strong>${role === 'admin' ? 'Admin' : 'Student'}</strong> registration.</p>
          <div style="font-size:32px;font-weight:800;letter-spacing:5px;color:#2d6a4f;background:#eef8f1;border-radius:10px;padding:15px;text-align:center;margin:20px 0">
            ${code}
          </div>
          <p>This OTP expires in 10 minutes.</p>
        </div>`
    });

    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('send-otp error:', err);
    res.status(500).json({ success: false, message: 'Failed to send OTP: ' + err.message });
  }
});

// ─── VERIFY OTP ──────────────────────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  console.log('Verify OTP request:', req.body);
  const { email, code } = req.body;
  
  try {
    const [rows] = await db.execute(
      `SELECT * FROM otp_verifications
       WHERE email = ? AND otp_code = ? AND purpose = 'signup'
         AND is_used = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, code]
    );

    if (!rows.length) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
    }

    await db.execute(
      'UPDATE otp_verifications SET is_used = 1 WHERE otp_id = ?',
      [rows[0].otp_id]
    );

    res.json({ success: true, message: 'OTP verified!' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CREATE STUDENTS TABLE IF NOT EXISTS ──────────────────────────────────────
async function ensureStudentsTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS students (
        student_id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(120) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        course VARCHAR(50) DEFAULT 'Btech',
        branch VARCHAR(50) DEFAULT 'CSE',
        semester VARCHAR(10) DEFAULT '1',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Students table ready');
  } catch (err) {
    console.error('Table creation error:', err.message);
  }
}

// ─── CREATE ADMINS TABLE IF NOT EXISTS ───────────────────────────────────────
async function ensureAdminsTable() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        admin_id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(120) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Admins table ready');
  } catch (err) {
    console.error('Table creation error:', err.message);
  }
}

// Run table creation
ensureStudentsTable();
ensureAdminsTable();

// ─── STUDENT SIGNUP ──────────────────────────────────────────────────────────
router.post('/signup/student', async (req, res) => {
  console.log('Student signup:', req.body);
  const { email, username, password, course, branch, semester } = req.body;

  if (!course || !branch || !semester) {
    return res.status(400).json({ success: false, message: 'Course, branch and semester are required.' });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    
    await db.execute(
      `INSERT INTO students (full_name, email, username, password_hash, course, branch, semester)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, username, hash, course, branch, semester]
    );
    
    res.json({ success: true, message: 'Account created! Please login.' });
  } catch (err) {
    console.error('Signup error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Email or username already exists.' });
    }
=======
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
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
    res.status(500).json({ success: false, message: err.message });
  }
});

<<<<<<< HEAD
// ─── ADMIN SIGNUP ─────────────────────────────────────────────────────────────
router.post('/signup/admin', async (req, res) => {
  console.log('Admin signup:', req.body);
  const { email, username, password } = req.body;
  
  try {
    const hash = await bcrypt.hash(password, 10);
    await db.execute(
      'INSERT INTO admins (full_name, email, username, password_hash) VALUES (?, ?, ?, ?)',
      [username, email, username, hash]
    );
    res.json({ success: true, message: 'Admin account created! Please login.' });
  } catch (err) {
    console.error('Admin signup error:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Email or username already exists.' });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── STUDENT LOGIN ────────────────────────────────────────────────────────────
router.post('/login/student', async (req, res) => {
  console.log('Student login:', req.body.username);
  const { username, password } = req.body;
  
  try {
    const [rows] = await db.execute(
      'SELECT * FROM students WHERE username = ? OR email = ?',
      [username, username]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const student = rows[0];
    const match = await bcrypt.compare(password, student.password_hash);
    
    if (!match) {
      return res.status(401).json({ success: false, message: 'Wrong password.' });
    }

    req.session.user = {
      id: student.student_id,
      role: 'student',
      username: student.username,
      course: student.course || '',
      semester: student.semester || ''
    };
    
    req.session.save(() => {
      res.json({
        success: true,
        role: 'student',
        username: student.username,
        course: student.course || '',
        semester: student.semester || ''
      });
    });
    
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// ─── ADMIN LOGIN ──────────────────────────────────────────────────────────────
router.post('/login/admin', async (req, res) => {
  console.log('Admin login:', req.body.username);
  const { username, password } = req.body;
  
  try {
    const [rows] = await db.execute(
      'SELECT * FROM admins WHERE username = ? OR email = ?',
      [username, username]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Admin not found.' });
    }

    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    
    if (!match) {
      return res.status(401).json({ success: false, message: 'Wrong password.' });
    }

    req.session.user = {
      id: admin.admin_id,
      name: admin.full_name,
      role: 'admin'
    };
    
    req.session.save(() => {
      res.json({ success: true, role: 'admin' });
    });
    
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
=======
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
>>>>>>> 2964563196274385a9786c7e453a884b53b6e663
});

module.exports = router;