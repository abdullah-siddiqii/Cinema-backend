// routes/bookings.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

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
      seat, // 👉 [{ id, price }]
      customerName,
      customerPhone,
      discountPrice,
      discountReference,
      paymentMethod,
      transactionId,
      bankName,
    } = req.body;

    // 🔹 Validation
    if (!showtimeId || !roomId || !seat?.length || !customerName || !customerPhone) {
      throw new Error("All required fields must be provided");
    }

    if (paymentMethod === "Bank" && !bankName) {
      throw new Error("Bank name is required when payment method is Bank");
    }

    // 1️⃣ Find showtime & room
    const showtime = await Showtime.findById(showtimeId).session(session);
    if (!showtime) throw new Error("Showtime not found");

    const room = await Room.findById(roomId).session(session);
    if (!room) throw new Error("Room not found");

    // 2️⃣ Get existing bookings
    const existingBookings = await Booking.find({
      showtimeId,
      isCancelled: false,
    }).session(session);

    // 3️⃣ Validate requested seats
    const selectedSeats = room.seats
      .filter((s) => seat.some((sel) => sel.id === s._id.toString()))
      .map((s) => {
        const sel = seat.find((sel) => sel.id === s._id.toString());
        return {
          _id: s._id.toString(),
          seatNumber: s.seatNumber,
          price: sel.price,
        };
      });

    if (!selectedSeats.length) throw new Error("No valid seats selected");

// 4️⃣ Check already booked
const alreadyBooked = selectedSeats.filter((s) =>
  existingBookings.some((b) => {
    if (!b || !b.seat) return false;
    return b.seat.toString() === s._id.toString();
  })
);

if (alreadyBooked.length > 0) {
  throw new Error(
    `Already booked: ${alreadyBooked.map((s) => s.seatNumber).join(", ")}`
  );
}


    // 5️⃣ Create bookings
    const bookings = [];
    const totalSeats = selectedSeats.length;
    const perSeatDiscount = discountPrice
      ? parseFloat((discountPrice / totalSeats).toFixed(2))
      : 0;

    for (const s of selectedSeats) {
      const booking = new Booking({
        showtimeId,
        roomId,
        seat: s._id,
        customerName,
        customerPhone,
        ticketPrice: s.price,
        discountPrice: perSeatDiscount,
        discountReference: discountReference || null,
        paymentMethod: paymentMethod || "Cash",
        transactionId: transactionId || null,
        bankName: paymentMethod === "Bank" ? bankName : null,
        totalPrice: s.price - perSeatDiscount,
      });

      await booking.save({ session });

      // mark seat as booked
      const roomSeat = room.seats.id(s._id);
      if (roomSeat) roomSeat.bookingId = booking._id;

      bookings.push(booking);
    }

    await room.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      message: "Bookings created successfully",
      bookingIds: bookings.map((b) => b._id),
      totalPrice: bookings.reduce((sum, b) => sum + b.totalPrice, 0),
    });
  } catch (error) {
    await session.abortTransaction();
    console.error("Booking Error:", error);
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// ======================= CANCEL Booking =======================
router.put("/cancel/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.isCancelled) {
      return res.status(400).json({ message: "Booking already cancelled" });
    }

    booking.isCancelled = true;
    booking.cancelledAt = new Date();
    booking.cancelledBy = req.user?.role || "Admin";

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
    console.error("Cancel Error:", error);
    res.status(500).json({ message: "Error cancelling booking", error });
  }
});

// ======================= Reports / Stats =======================
router.get("/stats/summary", async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments({ isCancelled: false });
    const cancelledBookings = await Booking.countDocuments({ isCancelled: true });

    const totalRevenue = await Booking.aggregate([
      { $match: { isCancelled: false } },
      { $group: { _id: null, revenue: { $sum: "$totalPrice" } } },
    ]);

    const revenueByPayment = await Booking.aggregate([
      { $match: { isCancelled: false } },
      { $group: { _id: "$paymentMethod", total: { $sum: "$totalPrice" } } },
    ]);

    const bookingsOverTime = await Booking.aggregate([
      { $match: { isCancelled: false } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          bookings: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      totalBookings,
      cancelledBookings,
      totalRevenue: totalRevenue[0]?.revenue || 0,
      revenueByPayment,
      bookingsOverTime,
    });
  } catch (err) {
    console.error("Stats Error:", err);
    res.status(500).json({ message: "Error generating reports", err });
  }
});

// ======================= GET All Bookings with Filters =======================
router.get("/", async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      showtimeId,
      roomId,
      customerName,
      customerPhone,
      paymentMethod,
      status,
    } = req.query;

    const filter = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    if (showtimeId) filter.showtimeId = showtimeId;
    if (roomId) filter.roomId = roomId;
    if (customerName) filter.customerName = new RegExp(customerName, "i");
    if (customerPhone) filter.customerPhone = new RegExp(customerPhone, "i");
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (status === "active") filter.isCancelled = false;
    if (status === "cancelled") filter.isCancelled = true;

  const bookings = await Booking.find(filter)
  .populate({
    path: "showtimeId",
    select: "movie time date", // ✅ correct fields
    populate: { path: "movie", select: "title poster" }, // ✅ nested populate
  })
  
  .populate({
    path: "roomId",
    select: "name capacity",
  })
  .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("Get Bookings Error:", err);
    res.status(500).json({ message: "Error fetching bookings" });
  }
});

// ======================= GET Single Booking =======================
router.get("/:id", async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: "showtimeId",
        select: "movie startTime endTime date",
        populate: { path: "movie", select: "title poster" },
      })
      .populate({
        path: "roomId",
        select: "name capacity",
      });

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    res.json(booking);
  } catch (err) {
    console.error("Get Single Booking Error:", err);
    res.status(500).json({ message: "Error fetching booking" });
  }
});


module.exports = router;
