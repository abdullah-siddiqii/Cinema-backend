const express = require("express");
const Showtime = require("../models/ShowTimesModal.js");
const Booking = require("../models/BookingModal.js");


const router = express.Router();

/**
 * ✅ Create a new showtime
 */
router.post("/", async (req, res) => {
  try {
    const { movie, room, date, times } = req.body;

    if (!movie || !room || !date || !times || !Array.isArray(times)) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const showtime = new Showtime({ movie, room, date, times });
    await showtime.save();

    res.status(201).json(showtime);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * ✅ Get booked seats for a specific showtime
 */
router.get("/:id/booked-seats", async (req, res) => {
  try {
    const showtimeId = req.params.id;

    // find all bookings for this showtime
    const bookings = await Booking.find({ showtimeId});

    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * ✅ Get all showtimes (populate movie & room)
 */
router.get("/", async (req, res) => {
  try {
    const showtimes = await Showtime.find()
      .populate("movie", "title year poster") // only required fields
      .populate("room", "name seatingCapacity location seats"); // only required fields

    res.json(showtimes);
  } catch (err) {
    console.error("Error fetching showtimes:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Get a single showtime by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate("movie", "title year poster")
      .populate("room", "name seatingCapacity location seats");

    if (!showtime) {
      return res.status(404).json({ error: "Showtime not found" });
    }

    res.json(showtime);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ✅ Update a showtime
 */
router.put("/:id", async (req, res) => {
  try {
    const updatedShowtime = await Showtime.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true } // return updated doc
    )
      .populate("movie", "title year poster")
      .populate("room", "name seatingCapacity location");

    if (!updatedShowtime) {
      return res.status(404).json({ error: "Showtime not found" });
    }

    res.json(updatedShowtime);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

/**
 * ✅ Delete a showtime
 */
router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Showtime.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Showtime not found" });
    }

    res.json({ message: "Showtime deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
