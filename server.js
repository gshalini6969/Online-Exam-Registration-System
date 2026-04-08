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
app.use('/api/chatbot', chatbotRoutes);

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'combined_page.html'));
});

app.listen(PORT, () => {
  console.log(`✅ OERS server running at http://localhost:${PORT}`);
});