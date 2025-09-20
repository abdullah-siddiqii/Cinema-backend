const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  showtimeId: { 
    type: String, 
    required: true, 
    trim: true,
    comment: "ID of the showtime" 
  },
  roomId: { 
    type: String, 
    required: true, 
    trim: true, 
    comment: "ID of the room/hall" 
  },
  seat:{ 
    type: String, 
    required: true, 
    trim: true, 
    comment: "Seat number selected by the customer" 
  },
  customerName: { 
    type: String, 
    required: true, 
    trim: true, 
    comment: "Customer's full name" 
  },
  customerPhone: { 
    type: String, 
    required: true, 
    trim: true, 
    comment: "Customer's phone number" 
  },
  ticketPrice: { 
    type: Number, 
    required: true, 
    comment: "Price per ticket before discount" 
  },
  discountPrice: { 
    type: Number, 
    default: 0, 
    comment: "Discount per ticket (if any)" 
  },
  discountReference: {
    type: String,
    trim: true,
    comment: "Reference for discount or promo code"
  },
  paymentMethod: {
    type: String,
    enum: ["Cash", "JazzCash/EasyPaisa", "Bank"],
    default: "Cash",
    comment: "Payment method chosen by customer"
  },
  bankName: {
    type: String,
    enum:["HBL","Meezan","Allied","UBL"],
    trim: true,
    required: function () {
      return this.paymentMethod === "Bank";
    },
    comment: "Bank name if paymentMethod is Bank"
  },
  transactionId: {
    type: String,
    trim: true,
    comment: "Transaction ID for non-cash payments"
  },
  totalPrice: { 
    type: Number, 
    required: true, 
    comment: "Total price after any discounts" 
  },
  bookedAt: { 
    type: Date, 
    default: Date.now, 
    comment: "Timestamp when the booking was made" 
  },
  
}, {
  versionKey: false // Removes __v field
});

// Avoid model overwrite
const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);

module.exports = Booking;
