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
const { generateSVGPlaceholder } = require('./views/user/viewHelpers');



dotenv.config();
const app = express();


connectDB();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));


app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));




app.use('/auth',authrouter);
app.use('/admin',adminrouter);
app.use('/user',userrouter);

// app.get('/test',(req,res)=>{
//    res.render("user/home", {
//   title: "Traveezy - Discover Vythiri",
//   heroImage: "https://yourcdn.com/vythiri-banner.jpg"
// });

// });
app.get("/test", (req, res) => {
  // Use the same mock data and helper function as the /explore route
  const PLACES_DATA = [
      {name:'Edakkal Caves', time:'10:00 AM - 11:30 AM', rating:'4.8', loc:'Wayanad, Kerala', desc:'Ancient petroglyphs in a stunning natural cave setting.', reviews:234, dist:'15 km', status:'completed', dur:'90 min', type: 'cultural', icon: '🏛️'},
      {name:'Chembra Peak', time:'11:45 AM - 1:15 PM', rating:'4.7', loc:'Wayanad, Kerala', desc:'Trek to the heart-shaped lake on Wayanad\'s highest peak.', reviews:189, dist:'45 km', status:'completed', dur:'90 min', type: 'trekking', icon: '⛰️'},
      {name:'Banasura Sagar Dam', time:'1:30 PM - 2:30 PM', rating:'4.6', loc:'Wayanad, Kerala', desc:'India\'s largest earthen dam, offering speed boating.', reviews:156, dist:'70 km', status:'completed', dur:'60 min', type: 'water', icon: '🌊'},
      {name:'Soochipara Waterfalls', time:'2:45 PM - 4:00 PM', rating:'4.5', loc:'Wayanad, Kerala', desc:'A three-tiered waterfall surrounded by dense green forest.', reviews:301, dist:'25 km', status:'active', dur:'75 min', type: 'water', icon: '🏞️'},
      {name:'Muthanga Wildlife Sanctuary', time:'4:15 PM - 5:15 PM', rating:'4.7', loc:'Wayanad, Kerala', desc:'Home to elephants, tigers, and diverse flora.', reviews:122, dist:'100 km', status:'pending', dur:'60 min', type: 'wildlife', icon: '🐘'},
  ];

  res.render("user/Explore", { places: PLACES_DATA, generateSVGPlaceholder });
});


app.get('/', (req, res) => {
  res.redirect('/auth/login');
});




const Port =3000;
app.listen(Port,()=>{
    console.log(`server is running on: http://localhost:${Port}`)
})
