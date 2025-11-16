const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  status: { type: String, enum: ['Published', 'Draft', 'Archived'], default: 'Draft' },
  location: { type: String, trim: true },
  price: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  image: { type: String, default: 'https://via.placeholder.com/120?text=No+Image' },
  // 🧩 Added fields for filtering
  activity: { type: String }, // e.g., "Trekking", "Boating"
  bestTime: { type: String }, // e.g., "Morning", "Evening", "Anytime"
  distance: { type: Number }, // e.g., distance in km from a reference point
  createdAt: { type: Date, default: Date.now },
  blockedDates: {
    type: [Date],
    default: []
  }
});

module.exports = mongoose.model('Place', placeSchema);
