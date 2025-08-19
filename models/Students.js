const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  email: {
    type:String,
    require:true,
    unique:true
  },
  age: Number,
  course: String,
  image: {
    type:String,
    required:true,
    unique:true
  }
});

module.exports = mongoose.model('Student', studentSchema);
