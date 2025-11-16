// const mongoose = require("mongoose");

// const bookingSchema = new mongoose.Schema({
//   user: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User",
//     required: true,
//   },
//   resort: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Resort", // assuming you have a Resort model
//     required: true,
//   },
//   paymentId: {
//     type: String,
//     required: true,
//   },
//   amount: {
//     type: Number,
//     required: true,
//   },
//   status: {
//     type: String,
//     enum: ["Paid", "Cancelled"],
//     default: "Paid",
//   },
//   bookedAt: {
//     type: Date,
//     default: Date.now,
//   },
// });

// module.exports = mongoose.model("Booking", bookingSchema);


const mongoose = require("mongoose");
const place = require("./place");

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  place: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Place",
    required: true,
  },
  paymentId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ["Paid", "Cancelled"],
    default: "Paid",
  },
  bookedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Booking", bookingSchema);
