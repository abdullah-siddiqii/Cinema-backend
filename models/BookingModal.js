const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  showtimeId: { type: String, required: true },    // Kaunsa showtime
  roomId: { type: String, required: true },        // Kaunsa hall/room
  seat: { type: String, required: true },       // Selected seats
  customerName: { type: String, required: true },  // Customer ka naam
  customerPhone: { type: String, required: true }, // Customer ka phone
  ticketPrice: { type: Number, required: true },   // ✅ Price per ticket
  totalPrice: { type: Number, required: true },    // Total price
  bookedAt: { type: Date, default: Date.now }      // Booking time
});

// Avoid model overwrite
const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

module.exports = Booking;
