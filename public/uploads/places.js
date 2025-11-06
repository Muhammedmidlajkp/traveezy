const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, enum: ['Published', 'Draft', 'Archived'], default: 'Draft' },
  rating: { type: Number, default: 0 },
  image: { type: String, default: 'https://via.placeholder.com/120?text=No+Image' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Place', placeSchema);
