const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
showtimeId: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true },

  roomId: { type: String, required: true, trim: true },
  seat: { type: String, required: true, trim: true },
  customerName: { type: String, required: true, trim: true },
  customerPhone: { type: String, required: true, trim: true },
  ticketPrice: { type: Number, required: true },
  discountPrice: { type: Number, default: 0 },
  discountReference: { type: String, trim: true },
  paymentMethod: {
    type: String,
    enum: ["Cash", "JazzCash/EasyPaisa", "Bank"],
    default: "Cash",
  },
  bankName: {
    type: String,
    enum: ["HBL", "Meezan", "Allied", "UBL"],
    trim: true,
    required: function () {
      return this.paymentMethod === "Bank";
    },
  },
  transactionId: { type: String, trim: true },
  totalPrice: { type: Number, required: true },
  bookedAt: { type: Date, default: Date.now },

  // 🔹 New Fields for Cancellation
  isCancelled: { type: Boolean, default: false },
  cancelledAt: { type: Date },
  cancelledBy: { type: String, trim: true },
},
  { timestamps: true }, 
{
  versionKey: false
});

const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
module.exports = Booking;
