const mongoose = require("mongoose");

const ReleaseSchema = new mongoose.Schema({
  index: Number,
  game: String,
  link: String,
  release: String,
  positive_reviews: Number,
  negative_reviews: Number,
  rating: Number,
  primary_genre: String,
  publisher: String,
  developer: String,
  all_time_peak: Number,
  embedding: {
    type: [Number],   
    default: []       // obligatoire sinon Mongoose peut l’ignorer
  }
});

module.exports = mongoose.model("Release", ReleaseSchema, "steam_releases");
