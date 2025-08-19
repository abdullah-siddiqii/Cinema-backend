// routes/students.js
const express = require('express');
const router = express.Router();
const Student = require('../models/Students'); // keep your existing model import
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET students with filters & pagination
router.get('/', async (req, res) => {
  try {
    const search = req.query.search || '';
    const minAge = parseInt(req.query.minAge) || 16;
    const maxAge = parseInt(req.query.maxAge) || 99;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;

    const query = {
      age: { $gte: minAge, $lte: maxAge },
      $or: [
        { name: new RegExp(search, 'i') },
        { course: new RegExp(search, 'i') }
      ]
    };

    const total = await Student.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    const students = await Student.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ name: 1 });

    res.json({ students, totalPages, currentPage: page });
  } catch (err) {
    console.error('Error fetching students:', err);
    res.status(500).json({ message: 'Server error while fetching students' });
  }
});

// Validation helpers
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateName = (name) => /^[A-Za-z\s]{2,50}$/.test(name);

// Create student — store RELATIVE image path (e.g. "/uploads/filename.jpg")
router.post('/', upload.single('image'), async (req, res) => {
  const { name, email, age, course } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : '';

  if (!name || !email || !age || !course) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (name.length < 3) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: "At least 3 letters required in name." });
  }
  if (!validateEmail(email)) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: "Incorrect email." });
  }
  if (!validateName(name)) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: "Incorrect name." });
  }

  try {
    const student = new Student({ name, email, age, course, image });
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    console.error('Error creating student:', err);
    if (req.file) fs.unlinkSync(req.file.path);
    if (err.code === 11000 && err.keyPattern?.email) {
      res.status(400).json({ message: 'Email already exists' });
    } else {
      res.status(500).json({ message: 'Server error while creating student' });
    }
  }
});

// Update student — handle new image and delete old
// Update student — handle new image and delete old
router.put('/:id', upload.single('image'), async (req, res) => {
  const { name, email, age, course } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;

  if (!name || !email || !age || !course) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingStudent = await Student.findById(req.params.id);
    if (!existingStudent) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Student not found' });
    }

    const updateData = { name, email, age, course };
    if (image) {
      updateData.image = image;
      // Delete old image file if exists
      if (existingStudent.image) {
        const oldFilename = path.basename(existingStudent.image);
        const oldImagePath = path.join(uploadDir, oldFilename);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedStudent);
  } catch (error) {
    console.error('Update error:', error);
    if (req.file) fs.unlinkSync(req.file.path);

    if (error.code === 11000 && error.keyPattern?.email) {
      res.status(400).json({ message: 'Email already exists' });
    } else if (error.code === 11000 && error.keyPattern?.image) {
      res.status(400).json({ message: 'Image already exists' });
    } else {
      res.status(500).json({ message: 'Server error while updating student' });
    }
  }
});

// Delete student — remove DB entry and file if present
router.delete('/:id', async (req, res) => {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);

    if (!deletedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (deletedStudent.image) {
      const imageFilename = path.basename(deletedStudent.image);
      const imagePath = path.join(uploadDir, imageFilename);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ message: 'Student deleted successfully', deletedStudent });
  } catch (err) {
    console.error('Error deleting student:', err);
    res.status(500).json({ message: 'Server error while deleting student' });
  }
});

module.exports = router;
