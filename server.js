require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path    = require('path');

const authRoutes    = require('./routes/auth');
const studentRoutes = require('./routes/student');
const adminRoutes   = require('./routes/admin');
const chatbotRoutes = require('./routes/chatbot');

const app  = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));


// Session configuration
app.use(session({
  secret           : process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave           : true,
  saveUninitialized: true,
  cookie           : { 
    secure: false,
    maxAge: 3600000,
    httpOnly: true
  }
}));
app.use(session({
  secret           : process.env.SESSION_SECRET,
  resave           : false,
  saveUninitialized: false,
  cookie           : { secure: false, maxAge: 3600000 }
}));

// Routes
app.use('/api/auth',    authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin',   adminRoutes);
//app.use('/api/chatbot', chatbotRoutes);

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'combined_page.html'));
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.listen(PORT, () => {
  console.log(`✅ OERS server running at http://localhost:${PORT}`);
  console.log(`📝 Environment variables loaded: ${Object.keys(process.env).filter(k => k.includes('DB_')).join(', ')}`);
});
app.listen(PORT, () => {
  console.log(`✅ OERS server running at http://localhost:${PORT}`);

});

