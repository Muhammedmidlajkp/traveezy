const express = require('express');
const router = express.Router();
const admincontroller = require('../controllers/admincontroller');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const { verifyAdmin } = require('../middleware/authMiddleware');

// ✅ Apply middleware to load admin data for all admin routes
router.use(admincontroller.loadAdminData);

// ✅ Import the userController to access the toggleBlockUser function
const userController = require('../controllers/userController');

router.get('/dashboard' ,verifyAdmin,admincontroller.dashboardPage);
router.get('/usermanagement',verifyAdmin,admincontroller.getAllUsers);
router.post('/deleteuser/:id',verifyAdmin,admincontroller.deleteUser);
router.get('/viewuser/:id',verifyAdmin,admincontroller.viewUser);
router.get('/contentmanagement',verifyAdmin,admincontroller.getPlaces); // Changed to getPlaces
router.get('/analytics',verifyAdmin,admincontroller.renderAnalytics);


// ✅ Add the missing POST route for blocking/unblocking a user
router.post('/users/:id/toggle-block', userController.toggleBlockUser);


// Multer Storage for Places
const placeStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/uploads/places');
    // Ensure the directory exists.
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

// Multer Storage for Avatars
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../public/uploads/avatars');
    fs.mkdir(uploadPath, { recursive: true }, (err) => {
      if (err) return cb(err);
      cb(null, uploadPath);
    });
  },
  filename: function (req, file, cb) {
    // Create a unique filename for the avatar
    cb(null, 'admin-avatar-' + Date.now() + path.extname(file.originalname));
  }
});

const uploadPlace = multer({ storage: placeStorage });
const uploadAvatar = multer({ storage: avatarStorage });
// The route for contentmanagement was already defined as GET /contentmanagement, so this line is redundant.
// Routes
// router.get('/content', admincontroller.getPlaces); // This line is redundant as /contentmanagement already handles it
router.post('/addplace', uploadPlace.single('image'), admincontroller.addPlace);
router.get('/deleteplace/:id', admincontroller.deletePlace);
router.post('/updateplace', uploadPlace.single('image'), admincontroller.updatePlace);
router.get('/places/:id', admincontroller.getPlaceById);

// Availability Routes
router.get('/places/:id/blocked-dates', admincontroller.getBlockedDates);
router.post('/places/:id/toggle-blocked-date', admincontroller.toggleBlockedDate);

// Profile Route
router.get('/profile',verifyAdmin, admincontroller.profilePage);
router.post('/profile/update', uploadAvatar.single('avatar'), admincontroller.updateProfile);

router.get('/bookingmanagement', verifyAdmin, admincontroller.bookingManagementPage);
router.get("/deletebooking/:id", admincontroller.deleteBooking);



// 




module.exports = router;