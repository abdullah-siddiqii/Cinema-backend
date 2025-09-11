// server.js (or app.js)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');
const bcrypt = require('bcryptjs');

// Models
const User = require('./models/UserModal');

// Routes
const movieRoutes = require('./routes/movieRoutes');
const authRoutes = require('./routes/authRoutes');
const showtimesRoutes = require('./routes/showtimesRoutes');
const roomRoutes = require('./routes/roomRoutes');

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "https://cinema-project-z9gt.vercel.app",
    "https://abdullah-test.whitescastle.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/showtimes', showtimesRoutes);
app.use('/api/rooms', roomRoutes);

// Default Admin Creator (run once on startup)
async function createDefaultAdmin() {
  try {
    const adminEmail = "siddiqiimabdullah@outlook.com";
    const adminPassword = "a.bdullah3";

    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      const hashed = await bcrypt.hash(adminPassword, 10);
      await User.create({
        name: "Default Admin",
        email: adminEmail,
        password: hashed,
        role: "admin",
      });
      console.log("✅ Default admin created:", adminEmail, "/", adminPassword);
    } else {
      console.log("ℹ️ Admin already exists:", existing.email);
    }
  } catch (err) {
    console.error("❌ Error creating default admin:", err.message);
  }
}
createDefaultAdmin();

// DB + Server Start
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch(err => console.error('❌ MongoDB connection error:', err.message));
