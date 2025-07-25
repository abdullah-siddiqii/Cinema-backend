const express = require('express');
const router = express.Router();
const Student = require('../models/Students');
const authMiddleware = require('../middleware/authMiddleware');

// GET all students
router.get('/', authMiddleware, async (req, res) => {
  const students = await Student.find();
  res.json(students);
});

// POST new student
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

module.exports = router;
