const mongoose = require("mongoose");
const Room = require("./models/RoomModal"); // path check karo

mongoose.connect("mongodb://abdullah:abdullah@localhost:258/myDatabase?authSource=admin", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function createRoom() {
  const room = new Room({
    name: "Room A",
    rows: 5,
    columns: 5,
    location: "First Floor",
    seatingCapacity: 25 
  });

  await room.save();
  console.log("Room created:", room);
  mongoose.disconnect();
}

createRoom();
