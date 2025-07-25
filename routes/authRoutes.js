const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Hardcoded dummy user (you can use MongoDB for this too)
const user = {
  email: 'siddiqiimabdullah@outlook.com',
  password: bcrypt.hashSync('a.bdullah3', 10)
};

// Login route
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (email !== user.email || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1d' });

  res.cookie('token', token, {
    httpOnly: true,
    secure: false, // Set to true in production (HTTPS)
    sameSite: 'lax',
    maxAge: 86400000 // 1 day
  });

  res.json({ message: 'Login successful' });
});

// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

module.exports = router;
