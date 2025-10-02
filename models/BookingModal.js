const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    // 🔹 Relations
    showtimeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Showtime",
      required: true,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    seat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat", // ✅ Only if you have a Seat model
      required: true,
    },

    // 🔹 Customer Info
    customerName: { type: String, required: true, trim: true },
    customerPhone: { type: String, required: true, trim: true },

    // 🔹 Pricing
    ticketPrice: { type: Number, required: true },
    discountPrice: { type: Number, default: 0 },
    discountReference: { type: String, trim: true },
    totalPrice: { type: Number, required: true },

    // 🔹 Payment
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

    // 🔹 Timestamps
    bookedAt: { type: Date, default: Date.now },

    // 🔹 Cancellation
    isCancelled: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    cancelledBy: { type: String, trim: true },
  },
  {
    timestamps: true, // createdAt + updatedAt
    versionKey: false, // remove "__v"
  }
);

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

module.exports = Booking;
