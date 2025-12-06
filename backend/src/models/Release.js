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
  all_time_peak: Number
});

module.exports = mongoose.model("Release", ReleaseSchema, "steam_releases");
