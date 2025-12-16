


const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');


router.get('/signup', authController.signupPage);
router.post('/signup', authController.signup);
router.get('/verify-signup-otp', authController.verifySignupOtppage);
router.post('/verify-signup-otp', authController.verifySignupOtp);
router.get('/login', authController.loginPage);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.get('/reset', authController.resetPasswordPage);         
router.post('/send-otp', authController.sendResetOTP); 
router.get('/verify-otp', authController.verifyOtpPage); 
router.post('/verify-otp', authController.verifyOtp); 
router.post('/newOtpverification', authController.newOtpverification);
router.post('/resend-signup-otp', authController.resendSignupOTP);
 
router.get('/new-password', authController.newPasswordPage);           
router.post('/new-password', authController.updatePassword);   
router.post('/logout',authController.logout);

module.exports = router;
