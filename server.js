const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');

const studentRoutes = require('./routes/studentRoutes');
const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes'); // ⬅️ New import
const verifyToken = require('./middleware/authMiddleware');

// Add this before app.listen()
dotenv.config();
const app = express();
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,

}));


// Middleware
app.use(express.json());
app.use(cookieParser());

// This line is crucial for serving the images from the 'uploads' directory
// The path module helps construct an absolute path to the directory.
// Go one folder up, because multer saves in project_root/uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Routes
app.use('/api/students', studentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes); // ⬅️ New route mounting

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out' });
});
app.get('/check-auth', verifyToken, (req, res) => {
    res.json({ message: 'Authenticated', user: req.user });
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