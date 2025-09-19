const mongoose = require("mongoose");

const SeatSchema = new mongoose.Schema({
  seatNumber: { type: String, required: true },
  row: { type: Number, required: true },
  column: { type: Number, required: true },
  type: { type: String, enum: ["Normal", "VIP", "Disabled"], default: "Normal" },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", default: null }
});

const RoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    seatingCapacity: { type: Number, required: true },
    rows: { type: Number, required: true },
    columns: { type: Number, required: true },
    location: { type: String, required: true },
    seats: [SeatSchema] // Embed seats
  },
  { timestamps: true }
);

// 🔹 Pre-save hook to auto-generate seats if empty
RoomSchema.pre("save", function (next) {
  if (!this.seats || this.seats.length === 0) {
    let seatArray = [];
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        seatArray.push({
          seatNumber: `${alphabet[r]}${c + 1}`,
          row: r + 1,
          column: c + 1,
          type: "Normal", // ✅ FIXED: default type ko "Normal" rakho, empty string mat do
          bookingId: null
        });
      }
    }

    this.seats = seatArray;
    this.seatingCapacity = seatArray.length; // auto update capacity
  }
  next();
});

module.exports = mongoose.model("Room", RoomSchema);
