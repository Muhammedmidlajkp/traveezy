const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const http = require('http');
const { Server } = require('socket.io');

const authrouter = require('./routes/auth');
const adminrouter = require('./routes/admin');
const userrouter = require('./routes/user');

dotenv.config();

const app = express();

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('MONGODB_URI is missing in environment variables.');
      return;
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
  }
};
connectDB();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/auth', authrouter);
app.use('/admin', adminrouter);
app.use('/user', userrouter);

app.get('/', (req, res) => {
  res.render('landing', { title: "Traveezy - Travel Smarter" });
});

app.use((err, req, res, next) => {
  console.error('Serverless Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

module.exports = app;
