const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');

const authrouter = require('./routes/auth');
const adminrouter = require('./routes/admin');
const userrouter = require('./routes/user');

dotenv.config();

const app = express();

// Serverless-Optimized MongoDB Connection Cache
let cachedDb = null;
const connectDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }
  try {
    const db = await mongoose.connect(process.env.MONGODB_URI);
    cachedDb = db;
    console.log('MongoDB Connected (Serverless Mode)...');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
  }
};

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Vercel handles static files via vercel.json, but keep this for local dev fallback
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Connect DB on every request (Mongoose handles the caching via the logic above)
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Routes
app.use('/auth', authrouter);
app.use('/admin', adminrouter);
app.use('/user', userrouter);

app.get('/', (req, res) => {
  res.render('landing', { title: "Traveezy - Travel Smarter" });
});

// Serverless Global Error Handler
app.use((err, req, res, next) => {
  console.error('Vercel Serverless Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
