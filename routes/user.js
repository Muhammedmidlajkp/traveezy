const express = require('express');
const routes = express.Router();
const usercontroller = require('../controllers/userController');
const router = express.Router();
const userController = require('../controllers/userController');
const tripcontroller = require('../controllers/tripcontroller');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/authMiddleware'); 
const paymentController = require('../controllers/paymentController');




// Onboarding page
router.get('/onboarding', protect, userController.onboardingpage);

router.post('/save-onboarding', protect, userController.saveOnboardingData);
router.get('/homepage', protect, userController.homePage);
router.get('/explore', protect, tripcontroller.explorePage);

router.get('/aitripplan', protect,tripcontroller.aiTripPlannerPage);
router.get('/resorts',protect, userController.viewAllResorts);

router.get('/support',protect, userController.supportPage);
router.post('/support/submit', userController.submitSupport);

router.get('/profile',protect, userController.profilePage);
router.post('/profile/update',protect, upload.single('profileImage'), userController.updateProfile);


router.post("/create-order", paymentController.createOrder);
router.post("/save-booking", paymentController.saveBooking);
router.post("/cancel-booking", paymentController.cancelBooking);

router.post('/apply-filters', userController.applyFilters);




module.exports = router;