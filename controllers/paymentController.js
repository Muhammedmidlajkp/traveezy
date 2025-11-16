const Razorpay = require("razorpay");
const Booking = require("../models/booking");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const { amount, resortId, userId } = req.body;

    const options = {
      amount: amount * 100, // in paise
      currency: "INR",
      receipt: "rcpt_" + Math.random().toString(36).substring(7),
    };

    const order = await razorpay.orders.create(options);
    res.json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error creating order" });
  }
};

// 🧾 Save booking after payment success
exports.saveBooking = async (req, res) => {
  try {
    const { userId, resortId, paymentId, amount } = req.body;

    const booking = new Booking({
      user: userId,
      place: resortId,
      paymentId,
      amount,
      status: "Paid",
    });

    await booking.save();
    res.json({ success: true, message: "Booking saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error saving booking" });
  }
};

// ❌ Cancel booking
exports.cancelBooking = async (req, res) => {
  try {
    const { userId, resortId } = req.body;
    // Find and delete the booking instead of updating its status
    const deletedBooking = await Booking.findOneAndDelete({
      user: userId,
      place: resortId,
      status: "Paid", // Ensure we only cancel paid bookings
    });

    if (!deletedBooking) {
      return res.status(404).json({ success: false, message: "Booking not found or already cancelled." });
    }

    res.json({ success: true, message: "Booking cancelled" });
  } catch (err) {
    console.error("Error cancelling booking:", err);
    res.status(500).json({ success: false, message: "Error cancelling booking" });
  }
};
