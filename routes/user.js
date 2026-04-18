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

// Image proxy to bypass hotlinking restrictions on Pixabay URLs
router.get('/image-proxy', async (req, res) => {
    try {
        const fetch = require('node-fetch');
        const url = req.query.url;
        if (!url) return res.status(400).send('No URL provided');
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        
        const contentType = response.headers.get('content-type');
        if (contentType) res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        
        response.body.pipe(res);
    } catch (err) {
        console.error('Image Proxy Error:', err.message);
        res.status(500).send('Error proxying image');
    }
});

router.get('/profile',protect, userController.profilePage);
router.post('/profile/update',protect, upload.single('profileImage'), userController.updateProfile);


router.post("/create-order", paymentController.createOrder);
router.post("/save-booking", paymentController.saveBooking);
router.post("/cancel-booking", paymentController.cancelBooking);

router.post('/apply-filters', userController.applyFilters);




module.exports = router;