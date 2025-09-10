const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  title: String,
  year: String,
  plot: String,
  poster: String,
});

module.exports = mongoose.models.Movie || mongoose.model('Movie', MovieSchema);
