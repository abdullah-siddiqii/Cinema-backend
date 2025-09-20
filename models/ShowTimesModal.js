const mongoose = require("mongoose");

// ✅ Seat schema
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
    time: {
      type: String, // ek hi time
      required: true,
    },
    ticketPrices: {
      VIP: { type: Number, required: true, default: 700 },
      Normal: { type: Number, required: true, default: 400 },
    },
    seats: [seatSchema], // 👈 array of seatSchema
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Showtime || mongoose.model("Showtime", showtimeSchema);
