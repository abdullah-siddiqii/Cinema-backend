// routes/courses.js
const express = require("express");
const mongoose = require("mongoose");
const Course = require("../models/Courses.js");

const router = express.Router();

/* =========================
   GET all courses
========================= */
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find().sort({ course: 1 });
    return res.status(200).json(courses);
  } catch (err) {
    console.error("Error fetching courses:", err);
    return res.status(500).json({ message: "Server Error" });
  }
});

/* =========================
   GET a single course by ID
========================= */
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid course ID" });
  }

  try {
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    return res.status(200).json(course);
  } catch (err) {
    console.error("Error fetching course:", err);
    return res.status(500).json({ message: "Server Error" });
  }
});

/* =========================
   ADD a new course
========================= */
router.post("/", async (req, res) => {
  const { courseCode, course, creditH, duration } = req.body;

  // Required fields check
  if (!courseCode || !course || !creditH || !duration) {
    return res.status(400).json({
      message: "All fields are required",
      missing: [
        !courseCode && "courseCode",
        !course && "course",
        !creditH && "creditH",
        !duration && "duration",
      ].filter(Boolean),
    });
  }

  try {
    const newCourse = new Course({ courseCode, course, creditH, duration });
    await newCourse.save();

    return res.status(201).json(newCourse);
  } catch (err) {
    console.error("Error adding course:", err);

    if (err.code === 11000) {
      // Duplicate error handling
      if (err.keyPattern?.courseCode) {
        return res.status(400).json({ message: "Duplicate courseCode" });
      }
      if (err.keyPattern?.course) {
        return res.status(400).json({ message: "Duplicate course" });
      }
    }

    return res.status(500).json({ message: "Server Error" });
  }
});

/* =========================
   UPDATE a course
========================= */
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { courseCode, course, creditH, duration } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid course ID" });
  }

  if (!courseCode || !course || !creditH || !duration) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { courseCode, course, creditH, duration },
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.status(200).json(updatedCourse);
  } catch (err) {
    console.error("Error updating course:", err);

    if (err.code === 11000) {
      // Duplicate error handling
      if (err.keyPattern?.courseCode) {
        return res.status(400).json({ message: "Duplicate courseCode" });
      }
      if (err.keyPattern?.course) {
        return res.status(400).json({ message: "Duplicate course" });
      }
    }

    return res.status(500).json({ message: "Server Error" });
  }
});

/* =========================
   DELETE a course
========================= */
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid course ID" });
  }

  try {
    const deletedCourse = await Course.findByIdAndDelete(id);
    if (!deletedCourse) {
      return res.status(404).json({ message: "Course not found" });
    }

    return res.status(200).json({ message: "Course deleted successfully" });
  } catch (err) {
    console.error("Error deleting course:", err);
    return res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
