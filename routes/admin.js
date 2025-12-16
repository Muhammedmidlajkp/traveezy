const express = require('express');
const router = express.Router();
const admincontroller = require('../controllers/admincontroller');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { verifyAdmin } = require('../middleware/authMiddleware');

router.use(admincontroller.loadAdminData);

const userController = require('../controllers/userController');

router.get('/dashboard' ,verifyAdmin,admincontroller.dashboardPage);
router.get('/usermanagement',verifyAdmin,admincontroller.getAllUsers);
router.post('/deleteuser/:id',verifyAdmin,admincontroller.deleteUser);
router.get('/viewuser/:id',verifyAdmin,admincontroller.viewUser);
router.get('/contentmanagement',verifyAdmin,admincontroller.getPlaces); 
router.get('/analytics',verifyAdmin,admincontroller.renderAnalytics);


router.post('/users/:id/toggle-block', userController.toggleBlockUser);



const placeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/uploads/places');
   
    fs.mkdir(uploadPath, { recursive: true }, (err) => {
      if (err) {
        return cb(err);
      }
      cb(null, uploadPath);
    });
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});


const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/uploads/avatars');
    fs.mkdir(uploadPath, { recursive: true }, (err) => {
      if (err) return cb(err);
      cb(null, uploadPath);
    });
  },
  filename: function (req, file, cb) {
  
    cb(null, 'admin-avatar-' + Date.now() + path.extname(file.originalname));
  }
});

const uploadPlace = multer({ storage: placeStorage });
const uploadAvatar = multer({ storage: avatarStorage });
router.post('/addplace', uploadPlace.single('image'), admincontroller.addPlace);
router.get('/deleteplace/:id', admincontroller.deletePlace);
router.post('/updateplace', uploadPlace.single('image'), admincontroller.updatePlace);
router.get('/places/:id', admincontroller.getPlaceById);


router.get('/places/:id/blocked-dates', admincontroller.getBlockedDates);
router.post('/places/:id/toggle-blocked-date', admincontroller.toggleBlockedDate);


router.get('/profile',verifyAdmin, admincontroller.profilePage);
router.post('/profile/update', uploadAvatar.single('avatar'), admincontroller.updateProfile);

router.get('/bookingmanagement', verifyAdmin, admincontroller.bookingManagementPage);
router.get("/deletebooking/:id", admincontroller.deleteBooking);



// 




module.exports = router;