const express = require("express");
const Room = require("../models/RoomModal");
const router = express.Router();

// ✅ Utility: Generate seats (Excel-style row letters)
const generateSeats = (rows, columns) => {
  const seats = [];

  const getRowLetter = (index) => {
    let letters = "";
    while (index >= 0) {
      letters = String.fromCharCode((index % 26) + 65) + letters;
      index = Math.floor(index / 26) - 1;
    }
    return letters;
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 1; c <= columns; c++) {
      seats.push({
        seatNumber: `${getRowLetter(r)}${c}`,
        row: r + 1,
        column: c,
        isBooked: false,
        isAvailable: true,
        type: "Normal",
      });
    }
  }
  return seats;
};

// 📌 GET all rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });
    
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 CREATE room (auto-generate seats)
router.post("/", async (req, res) => {
    console.log("📩 POST /api/rooms request body:", req.body); 
  try {
    const { name, rows, columns, location } = req.body;
    if (!name || !rows || !columns || !location) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const seats = generateSeats(rows, columns);
    const seatingCapacity = seats.length;

    const room = new Room({ name, rows, columns, location, seatingCapacity, seats });
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 📌 GET single room by ID
router.get("/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 UPDATE room OR seats
router.put("/:id", async (req, res) => {
  try {
    const { name, rows, columns, location, seats } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    // 🔹 Update basic info if present
    if (name) room.name = name;
    if (location) room.location = location;

    // 🔹 If `rows` and `columns` are provided, it's a room dimensions update.
    // This is the logic for when you edit the room size.
    if (rows && columns) {
      room.rows = rows;
      room.columns = columns;
      room.seats = generateSeats(rows, columns);
      room.seatingCapacity = rows * columns;
    } 
    // 🔹 If only `seats` is provided, it's a seat-level configuration update.
    // This is the logic for the seat modal where you change seat types.
    else if (Array.isArray(seats)) {
      room.seats = seats.map((s) => ({
        seatNumber: s.seatNumber,
        row: s.row,
        column: s.column,
        // ✅ Corrected: Handle the empty string from the frontend.
        // If the type is an empty string, set it to "Normal" to
        // avoid Mongoose validation errors.
        type: s.type === '' ? 'Normal' : s.type, 
        bookingId: s.bookingId ?? null,
      }));
      room.seatingCapacity = seats.length;
    }

    const updated = await room.save();
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 📌 DELETE room
router.delete("/:id", async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json({ message: "Room deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;