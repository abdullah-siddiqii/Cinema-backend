const mongoose = require("mongoose");

const showtimeSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Movie",
      required: true,
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    times: {
      type: [String], // ✅ multiple showtimes
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Showtime || mongoose.model("Showtime", showtimeSchema);
