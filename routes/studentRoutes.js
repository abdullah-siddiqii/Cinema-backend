const express = require('express');
const router = express.Router();
const Student = require('../models/Students');
const authMiddleware = require('../middleware/authMiddleware');

// ✅ GET all students
router.get('/', authMiddleware, async (req, res) => {
  const students = await Student.find();
  res.json(students);
});

// ✅ POST new student
router.post('/', authMiddleware, async (req, res) => {
  const { name, email, age, course } = req.body;

  try {
    const student = new Student({ name, email, age, course });
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ message: 'Error creating student' });
  }
});

// ✅ DELETE a student by ID
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const deletedStudent = await Student.findByIdAndDelete(id);

    if (!deletedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting student' });
  }
});


module.exports = router;
