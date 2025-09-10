const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser'); // optional, hum Bearer use kar rahe
const path = require('path');

dotenv.config();
const app = express();

// Routes
const movieRoutes = require('./routes/movieRoutes');
const authRoutes = require('./routes/authRoutes');
const showtimesRoutes = require('./routes/showtimesRoutes');

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "https://cinema-project-z9gt.vercel.app",
    "https://abdullah-test.whitescastle.com"
  ],
  credentials: true, // Bearer ke liye cookies ki zarurat nahi
}));

app.use(express.json());
app.use(cookieParser()); // rehne do, par hum use nahi kar rahe
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/showtimes', showtimesRoutes);
app.use('/api/rooms', require('./routes/roomRoutes'));

// (Optional) Default admin create
const bcrypt = require('bcryptjs');
const User = require('./models/UserModal');
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
  } catch (e) {
    console.error("Error creating default admin:", e);
  }
}
createDefaultAdmin();

// DB + Start
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on port ${process.env.PORT}`);
    });
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
