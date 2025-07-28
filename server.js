const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

const studentRoutes = require('../backend/routes/studentRoutes');
const authRoutes = require('../backend/routes/authRoutes');

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/students', studentRoutes);
app.use('/api/auth', authRoutes);
// Node.js + Express
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token'); // or your cookie name
  res.status(200).json({ message: 'Logged out' });
});


// MongoDB

mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
