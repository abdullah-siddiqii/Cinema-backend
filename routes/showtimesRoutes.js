const express = require("express");
const Showtime = require("../models/ShowTimesModal.js");

const router = express.Router();

// ✅ Create a new showtime
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


// ✅ Get all showtimes (with movie & room populated)
router.get("/", async (req, res) => {
  try {
    const showtimes = await Showtime.find()
      .populate("movie", "Title Year Poster") // Only fetch needed fields
      .populate("room", "name seatingCapacity location");
    res.json(showtimes);
  } catch (err) {
      console.error("Error fetching showtimes:", err); 
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get a single showtime by ID
router.get("/:id", async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate("movie", "Title Year Poster")
      .populate("room", "name seatingCapacity location");

    if (!showtime) {
      return res.status(404).json({ error: "Showtime not found" });
    }

    res.json(showtime);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update a showtime
router.put("/:id", async (req, res) => {
  try {
    const updatedShowtime = await Showtime.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate("movie", "Title Year Poster")
      .populate("room", "name seatingCapacity location");

    if (!updatedShowtime) {
      return res.status(404).json({ error: "Showtime not found" });
    }

    res.json(updatedShowtime);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ✅ Delete a showtime
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
