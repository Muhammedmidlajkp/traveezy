const express = require('express');
const  dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const connectDB =require('./config/db');
const authrouter = require('./routes/auth');
const adminrouter = require('./routes/admin')
const userrouter = require('./routes/user');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer'); 
const http = require('http');              // 🧩 NEW: Required for Socket.io server
const { Server } = require('socket.io');   // 🧩 NEW: Import Socket.io
// const expressLayouts = require('express-ejs-layouts');  // 👈 ADD THIS LINE



dotenv.config();
const app = express();


connectDB();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
// app.use(express.static('public'));
// app.use('/uploads', express.static('public/uploads'));

app.use(express.static(path.join(__dirname, 'public')));



app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// app.use(expressLayouts);            // 👈 Enable layouts
// app.set('layout', 'layout');




app.use('/auth',authrouter);
app.use('/admin',adminrouter);
app.use('/user',userrouter);

// app.get('/test',(req,res)=>{
//    res.render("user/home", {
//   title: "Traveezy - Discover Vythiri",
//   heroImage: "https://yourcdn.com/vythiri-banner.jpg"
// });

// });



// app.get('/', (req, res) => {
//   res.redirect('/auth/login');
// });

app.get('/', (req, res) => {
  res.render('landing', { title: "Traveezy - Travel Smarter" });
});




const Port =3000;
app.listen(Port,()=>{
    console.log(`server is running on: http://localhost:${Port}`)
})
