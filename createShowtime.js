const mongoose = require("mongoose");
const Showtime = require("./models/ShowTimesModal");
const Room = require("./models/RoomModal");

// 🔹 MongoDB connection
mongoose.connect("mongodb://abdullah:abdullah@localhost:258/myDatabase?authSource=admin", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// 🔹 Replace these with your own Room ID and movie info
const roomId = "68c58045a2379c5093f3f3d5"; // DB se copied actual Room ID


const movieName = "Avengers: Endgame";
const date = "2025-09-15";
const time = "19:30";
const ticketPrice = 500;

async function createShowtime() {
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      console.log("❌ Room not found! Check roomId.");
      return process.exit();
    }

    const showtime = await Showtime.create({
      movieName,
      room: room._id,
      date,
      time,
      ticketPrice
    });

    console.log("🎬 Showtime created successfully!");
    console.log(showtime);

  } catch (err) {
    console.error("❌ Error creating showtime:", err);
  } finally {
    mongoose.connection.close();
  }
}

createShowtime();
