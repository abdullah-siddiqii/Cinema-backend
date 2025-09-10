const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  seatingCapacity: { type: Number, required: true },
  rows: { type: Number, required: true },
  columns: { type: Number, required: true },
  location: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Room', RoomSchema);
