const Movie = require('../models/MoviesModal');

// Add Movie
exports.addMovie = async (req, res) => {
  try {
    const { title, year, plot, poster } = req.body;

    const movie = new Movie({ title, year, plot, poster });
    await movie.save();

    res.status(201).json({ message: 'Movie added successfully', movie });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// Get all movies
exports.getMovies = async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.status(200).json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong' });
  }
};
