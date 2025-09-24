const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/isAdminMiddleware");

const Booking = require("../models/BookingModal");
const Showtime = require("../models/ShowTimesModal");
const Room = require("../models/RoomModal");

// =================== Admin Stats API ===================
router.get("/stats", async (req, res) => {
  try {
    // 1️⃣ Total bookings
    const totalBookings = await Booking.countDocuments();

    // 2️⃣ Total revenue
    const bookings = await Booking.find();
    const totalRevenue = bookings.reduce(
      (sum, b) => sum + (b.totalPrice || 0),
      0
    );

    // 3️⃣ Active movies (future showtimes)
    const today = new Date();
    const activeMoviesAgg = await Showtime.aggregate([
      { $match: { date: { $gte: today } } },
      { $group: { _id: "$movie" } },
      { $count: "count" },
    ]);
    const activeMovies = activeMoviesAgg[0]?.count || 0;

    // 4️⃣ Bookings over time
    const bookingsOverTimeAgg = await Booking.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const bookingsOverTime = bookingsOverTimeAgg.map((b) => ({
      date: b._id,
      bookings: b.bookings,
    }));

    // 5️⃣ Revenue by movie
    const revenueByMovieAgg = await Booking.aggregate([
      {
        $lookup: {
          from: "showtimes",
          localField: "showtimeId",
          foreignField: "_id",
          as: "showtime",
        },
      },
      { $unwind: "$showtime" },
      {
        $lookup: {
          from: "movies",
          localField: "showtime.movie",
          foreignField: "_id",
          as: "movie",
        },
      },
      { $unwind: "$movie" },
      {
        $group: {
          _id: "$movie.title",
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { revenue: -1 } },
    ]);
    const revenueByMovie = revenueByMovieAgg.map((r) => ({
      movie: r._id,
      revenue: r.revenue,
    }));

    // 6️⃣ Top Customers (by total spent)
    const topCustomersAgg = await Booking.aggregate([
      {
        $group: {
          _id: "$customerName",
          totalSpent: { $sum: "$totalPrice" },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 5 },
    ]);
    const topCustomers = topCustomersAgg.map((c) => ({
      customer: c._id || "Unknown",
      totalSpent: c.totalSpent,
      bookings: c.bookings,
    }));

    // 7️⃣ Latest bookings (last 5)
    const latestBookingsRaw = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: "showtimeId",
        populate: {
          path: "movie",
          select: "title",
        },
      });

    const latestBookings = latestBookingsRaw.map((b) => ({
      customer: b.customerName || "Unknown",
      movie: b.showtimeId?.movie?.title || "Unknown",
      seats: Array.isArray(b.seats)
        ? b.seats.length
        : b.seat
        ? 1
        : 0,
      date: b.createdAt ? b.createdAt.toISOString().split("T")[0] : "N/A",
    }));

    // ✅ Send all stats
    res.json({
      totalBookings,
      totalRevenue,
      activeMovies,
      bookingsOverTime,
      revenueByMovie,
      topCustomers, // 👈 seatOccupancy ki jagah
      latestBookings,
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
