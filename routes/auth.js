// const express = require('express');
// const router = express.Router();
// const authController = require('../controllers/authController');

// router.get('/signup', authController.signupPage);
// router.post('/signup', authController.signup);

// router.get('/login', authController.loginPage);
// router.post('/login', authController.login);
// router.get('/logout', authController.logout);

// // 🔹 Reset password routes
// router.get('/reset', authController.resetPasswordPage);
// router.post('/send-otp', authController.sendResetOTP);
// router.get('/verify-otp', authController.verifyOtpPage);
// router.post('/verify-otp', authController.verifyOtp);
// router.get('/new-password', authController.newPasswordPage);
// router.post('/new-password', authController.updatePassword);
// router.post('/send-reset-otp', authController.sendResetOTP);


// module.exports = router;


const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 🔹 Signup & Login
router.get('/signup', authController.signupPage);
router.post('/signup', authController.signup);
router.get('/verify-signup-otp', authController.verifySignupOtppage);
router.post('/verify-signup-otp', authController.verifySignupOtp);
router.get('/login', authController.loginPage);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// 🔹 Reset Password Flow
router.get('/reset', authController.resetPasswordPage);         // Show email input
router.post('/send-otp', authController.sendResetOTP); 
router.get('/verify-otp', authController.verifyOtpPage); 
router.post('/verify-otp', authController.verifyOtp); 
router.post('/newOtpverification', authController.newOtpverification); 
router.get('/new-password', authController.newPasswordPage);           // Verify OTP
router.post('/new-password', authController.updatePassword);   
router.post('/logout',authController.logout);

module.exports = router;
