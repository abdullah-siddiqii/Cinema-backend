const mongoose = require("mongoose");

// ✅ Seat schema define karo
const seatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true }, // e.g. "A1", "B5"
  row: { type: Number, required: true },
  column: { type: Number, required: true },
  isBooked: { type: Boolean, default: false },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null } 
});

// ✅ Showtime schema
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
      type: [String], // multiple showtimes
      required: true,
    },
    seats: [seatSchema], // ✅ nested seats
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Showtime || mongoose.model("Showtime", showtimeSchema);
