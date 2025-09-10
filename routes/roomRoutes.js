const express = require('express');
const Room = require('../models/RoomModal');
const router = express.Router();

// Create Room
router.post('/', async (req, res) => {
  try {
    const room = new Room(req.body);
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get All Rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find().sort({ createdAt: -1 });
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Single Room
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Room
router.put('/:id', async (req, res) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updatedRoom) return res.status(404).json({ message: 'Room not found' });
    res.json(updatedRoom);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Room
router.delete('/:id', async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json({ message: '✅ Room deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
