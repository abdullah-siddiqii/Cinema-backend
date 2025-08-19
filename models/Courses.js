const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: true,
      unique: true, // sirf courseCode unique
      trim: true,
    },
    course: {
      type: String,
      required: true,
      unique: true, // course bhi unique
      trim: true,
    },
    creditH: {
      type: Number,
      required: true,
      // unique hata diya
    },
    duration: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", courseSchema);
  