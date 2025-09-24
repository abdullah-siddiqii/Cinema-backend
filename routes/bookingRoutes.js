// routes/bookings.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const authMiddleware = require("../middleware/isAdminMiddleware");
const Booking = require("../models/BookingModal");
const Room = require("../models/RoomModal");
const Showtime = require("../models/ShowTimesModal");

// ======================= CREATE Booking (with Transaction) =======================
router.post("/", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { 
      showtimeId, 
      roomId, 
      seat, 
      customerName, 
      customerPhone, 
      ticketPrice, 
      discountPrice, 
      discountReference, 
      paymentMethod, 
      transactionId,
      bankName // 👈 new field
    } = req.body;

    if (!showtimeId || !roomId || !seat?.length || !customerName || !customerPhone || !ticketPrice) {
      throw new Error("All fields including ticketPrice are required");
    }

    // ✅ If payment method is Bank, bankName must be provided
    if (paymentMethod === "Bank" && !bankName) {
      throw new Error("Bank name is required when payment method is Bank");
    }

    // 1️⃣ Find showtime & room
    const showtime = await Showtime.findById(showtimeId).session(session);
    if (!showtime) throw new Error("Showtime not found");

    const room = await Room.findById(roomId).session(session);
    if (!room) throw new Error("Room not found");

    // 2️⃣ Check existing bookings for this showtime
    const existingBookings = await Booking.find({ showtimeId , isCancelled: false }).session(session);

    // 3️⃣ Find selected seats in room
    const selectedSeats = room.seats.filter((s) => seat.includes(s.seatNumber));

    // 4️⃣ Check if already booked
    const alreadyBooked = selectedSeats.filter((s) =>
      existingBookings.some((b) => b.seat.includes(s._id.toString()))
    );

    if (alreadyBooked.length > 0) {
      throw new Error(`Already booked: ${alreadyBooked.map((s) => s.seatNumber).join(", ")}`);
    }

    // 5️⃣ Create bookings one by one inside transaction
    const bookings = [];
    for (let seat of selectedSeats) {
      const booking = new Booking({
        showtimeId,
        roomId,
        seat: seat._id, // ek booking = ek seat
        customerName,
        customerPhone,
        ticketPrice,
        discountPrice: discountPrice || 0,
        discountReference: discountReference || null,
        paymentMethod: paymentMethod || "Cash",
        transactionId: transactionId || null,
        bankName: paymentMethod === "Bank" ? bankName : null, // ✅ save bank name only if Bank
        totalPrice: ticketPrice - (discountPrice || 0),
      });

      await booking.save({ session });

      // mark seat as booked
      seat.bookingId = booking._id;
      bookings.push(booking);
    }

    await room.save({ session });

    // 6️⃣ Commit transaction
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: "Bookings created successfully",
      bookingIds: bookings.map((b) => b._id),
      totalPrice: bookings.length * ticketPrice,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Booking Error:", error);
    res.status(400).json({ message: error.message });
  }
});


// ======================= UPDATE Booking (with Transaction) =======================
router.put("/:id", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { seats, customerName, customerPhone, ticketPrice } = req.body;

    const booking = await Booking.findById(req.params.id).session(session);
    if (!booking) throw new Error("Booking not found");

    const room = await Room.findById(booking.roomId).session(session);
    if (!room) throw new Error("Room not found");

    // ✅ Free old seats
    room.seats.forEach((s) => {
      if (booking.seats.map(id => id.toString()).includes(s._id.toString())) {
        s.bookingId = null;
      }
    });

    // ✅ Assign new seats if provided
    if (seats?.length > 0) {
      const newSeats = room.seats.filter((s) => seats.includes(s.seatNumber));
      newSeats.forEach((s) => {
        s.bookingId = booking._id;
      });

      booking.seats = newSeats.map((s) => s._id);
      if (ticketPrice) booking.totalPrice = newSeats.length * ticketPrice;
    }

    if (customerName) booking.customerName = customerName;
    if (customerPhone) booking.customerPhone = customerPhone;
    if (ticketPrice) booking.ticketPrice = ticketPrice;

    await booking.save({ session });
    await room.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Booking updated", booking });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Update Booking Error:", err);
    res.status(400).json({ message: err.message });
  }
});/// not use

// ======================= CANCEL Booking (soft cancel) =======================
// Cancel booking
// routes/bookings.js
router.put("/cancel/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.isCancelled) {
      return res.status(400).json({ message: "Booking already cancelled" });
    }

    // ✅ Cancelled by role, not from body
    const cancelledBy = req.user?.role || "Unknown"; 

    booking.isCancelled = true;
    booking.cancelledAt = new Date();
   booking.cancelledBy = req.body.cancelledBy || 'Unknown';


    // ✅ Free the seat in room
    const room = await Room.findById(booking.roomId);
    if (room) {
      room.seats.forEach((s) => {
        if (s._id.toString() === booking.seat.toString()) {
          s.bookingId = null;
        }
      });
      await room.save();
    }

    await booking.save();

    res.json({ message: "Booking cancelled successfully", booking });
  } catch (error) {
    res.status(500).json({ message: "Error cancelling booking", error });
  }
});



module.exports = router;
