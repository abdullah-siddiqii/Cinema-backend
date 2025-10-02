const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/isAdminMiddleware");

const Booking = require("../models/BookingModal");
const Showtime = require("../models/ShowTimesModal");
const Room = require("../models/RoomModal");

// =================== Admin Stats API ===================
router.get("/stats", async (req, res) => {
  try {
    const now = new Date();

    // -------- 1️⃣ Total Bookings --------
    const totalBookings = await Booking.countDocuments();

    // -------- 1a️⃣ Total Bookings Today --------
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const totalBookingsToday = await Booking.countDocuments({
      createdAt: { $gte: startOfToday },
    });

    // -------- 2️⃣ Total Revenue --------
    const bookings = await Booking.find();
    const totalRevenue = Math.round(
      bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    );

    // -------- 3️⃣ Active Movies --------
    const activeMoviesAgg = await Showtime.aggregate([
      { $group: { _id: "$movie" } },
      { $count: "count" },
    ]);
    const activeMovies = activeMoviesAgg[0]?.count || 0;

    // -------- 4️⃣ Bookings Over Time --------
    const bookingsOverTimeAgg = await Booking.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const bookingsOverTime = bookingsOverTimeAgg.map(b => ({
      date: b._id,
      bookings: b.bookings,
    }));

    // -------- 5️⃣ Revenue By Movie --------
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
    const revenueByMovie = revenueByMovieAgg.map(r => ({
      movie: r._id,
      revenue: r.revenue,
    }));

    // -------- 6️⃣ Top Customers --------
    const topCustomersAgg = await Booking.aggregate([
      {
        $group: {
          _id: "$customerName",
          totalSpent: { $sum: "$totalPrice" },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
    ]);
    const topCustomers = topCustomersAgg.map(c => ({
      customer: c._id || "Unknown",
      totalSpent: c.totalSpent,
      bookings: c.bookings,
    }));

    // -------- 7️⃣ Cinema Progress --------
 // Get total bookings per movie
const cinemaProgressAgg = await Booking.aggregate([
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

  // Group by movie
  {
    $group: {
      _id: "$movie.title",
      bookedSeats: { $sum: 1 }, // total bookings
    },
  },

  // Determine max bookings
  {
    $group: {
      _id: null,
      movies: { $push: { movie: "$_id", bookedSeats: "$bookedSeats" } },
      maxBooked: { $max: "$bookedSeats" },
    },
  },

  { $unwind: "$movies" },

  {
    $project: {
      _id: 0,
      movie: "$movies.movie",
      bookedSeats: "$movies.bookedSeats",
      progress: {
        $cond: [
          { $eq: ["$maxBooked", 0] },
          0,
          { $multiply: [{ $divide: ["$movies.bookedSeats", "$maxBooked"] }, 100] },
        ],
      },
    },
  },

  { $sort: { progress: -1 } },
]);


    res.json({
      totalBookings,
      totalBookingsToday,
      totalRevenue,
      activeMovies,
      bookingsOverTime,
      revenueByMovie,
      topCustomers,
      cinemaProgress: cinemaProgressAgg,
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
