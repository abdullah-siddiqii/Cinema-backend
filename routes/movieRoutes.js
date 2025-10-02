const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Movie = require('../models/MoviesModal');

const router = express.Router();

// ====================
// Multer Configuration
// ====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(process.cwd(), 'uploads')); // absolute path
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueName + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ====================
// Add a Movie
// ====================
router.post('/', upload.single('poster'), async (req, res) => {
  try {
    let posterPath = null;

    if (req.file) {
      posterPath = `/uploads/${req.file.filename}`;
    } else if (req.body.poster) {
      posterPath = req.body.poster;
    }

    const movie = new Movie({
      title: req.body.title,
      year: req.body.year,
      plot: req.body.plot,
      poster: posterPath,
    });

    await movie.save();
    res.status(201).json(movie);
  } catch (err) {
    console.error('❌ Error while saving movie:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// ====================
// Get All Movies
// ====================
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().sort({ createdAt: -1 });
    res.json(movies);
  } catch (err) {
    console.error('❌ Error fetching movies:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ====================
// Get Single Movie
// ====================
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }
    res.json(movie);
  } catch (err) {
    console.error('❌ Error fetching movie:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ====================
// Update Movie
// ====================
router.put('/:id', upload.single('poster'), async (req, res) => {
  try {
    let posterPath;

    // Agar nayi file upload hui
    if (req.file) {
      posterPath = `/uploads/${req.file.filename}`;
    }
    // Agar explicitly delete karna hai (frontend se empty string bheja gaya)
    else if (req.body.poster === '') {
      posterPath = ''; // clear poster
    }

    const updateData = {
      title: req.body.title,
      year: req.body.year,
      plot: req.body.plot,
    };

    if (posterPath !== undefined) {
      updateData.poster = posterPath;
    }

    const updatedMovie = await Movie.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedMovie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    res.json(updatedMovie);
  } catch (err) {
    console.error('❌ Error updating movie:', err.message);
    res.status(400).json({ error: err.message });
  }
});


// ====================
// Delete Movie + Image
// ====================
router.delete('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Agar local poster hai
    if (movie.poster && movie.poster.startsWith('/uploads/')) {
      const imagePath = path.resolve(process.cwd(), '.' + movie.poster);

      console.log('🛠️ Trying to delete:', imagePath);

      fs.access(imagePath, fs.constants.F_OK, (err) => {
        if (!err) {
          fs.unlink(imagePath, (unlinkErr) => {
            if (unlinkErr) {
              console.error('⚠️ File delete error:', unlinkErr.message);
            } else {
              console.log('🗑️ Poster deleted:', imagePath);
            }
          });
        } else {
          console.log('⚠️ File not found:', imagePath);
        }
      });
    }

    await Movie.findByIdAndDelete(req.params.id);

    return res.json({ message: '✅ Movie & poster deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting movie:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
