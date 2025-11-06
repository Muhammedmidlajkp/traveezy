const express = require('express');
const routes = express.Router();
const usercontroller = require('../controllers/userController');
const router = express.Router();
const userController = require('../controllers/userController');
const tripcontroller = require('../controllers/tripcontroller');

const { protect } = require('../middleware/authMiddleware'); // Assuming you have this middleware

// Onboarding page
router.get('/onboarding', protect, userController.onboardingpage);

router.post('/save-onboarding', protect, userController.saveOnboardingData);
router.get('/homepage', protect, userController.homePage);
router.get('/aitripplan', protect,tripcontroller.aiTripPlannerPage);


module.exports = router;