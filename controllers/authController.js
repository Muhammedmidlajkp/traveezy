const jwt = require('jsonwebtoken');
const User = require('../models/user');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { render } = require('ejs');
const OTPs = {}; // Temporary store (can use DB in production)

// Render signup and login pages
exports.signupPage = (req, res) => {
  res.render('signup');
};


exports.loginPage = (req, res) => {
  res.render('login');
};

// Signup controller
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

   // Create new user but not verified yet
    // const user = await User.create({ name, email, password, isVerified: false });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP temporarily
    OTPs[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000, tempUser: { name, email, password }
 }; // 5 minutes

    // Send OTP email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your email for Traveesy',
      html: `
        <div style="font-family:sans-serif;">
          <h2>Welcome to Traveesy, ${name}!</h2>
          <p>Use the OTP below to verify your email:</p>
          <h1 style="letter-spacing:5px;">${otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
        </div>
      `,
    });

    // ✅ Respond success
    return res.status(201).json({
      message: 'Signup successful! OTP sent to your email.',
    });

  } catch (error) {
    console.error('Signup Error:', error.message);
    return res.status(500).json({ message: 'Server Error. Try again later.' });
  }
};
exports.verifySignupOtppage = (req, res) => {
  const email = req.query.email; // ✅ get from ?email=...
  if (!email) return res.redirect('/auth/signup'); // fallback
  res.render('signupverifyotp', { email });
};

// ✅ Verify OTP for signup
exports.verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = OTPs[email]; // get the existing OTP data

    // ✅ Check if OTP exists
    if (!record) {
      return res.status(400).json({ message: 'OTP expired or invalid' });
    }

    // ✅ Check expiration
    if (Date.now() > record.expiresAt) {
      delete OTPs[email];
      return res.status(400).json({ message: 'OTP expired' });
    }

    // ✅ Compare entered OTP
    if (record.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // ✅ OTP is valid → SAVE USER TO DATABASE NOW
    const { name, password } = record.tempUser;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        password, // password will be hashed if model has pre-save hook
        isVerified: true
      });
    } else {
      user.isVerified = true;
      await user.save();
    }
    console.log("TempUser:", record.tempUser);


    delete OTPs[email]; // remove from temporary storage

    return res.status(200).json({ message: 'Email verified successfully! ✅' });

  } catch (error) {
    console.error('OTP Verification Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};




// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

    
//     if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      
//       const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
//         expiresIn: "1d",
//       });

   
//       res.cookie("token", token, {
//         httpOnly: true,
//         secure: false, 
//         maxAge: 24 * 60 * 60 * 1000,
//       });

    
//       return res.redirect("/admin/dashboard");
//     }

//     // 🔍 Otherwise check if user exists in DB
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(400).send("Invalid email or password");
//     }

//     // ✅ Check if the user is blocked
//     if (user.status === 'Blocked') {
//       // User is blocked, prevent login
//       return res.status(403).send("Your account has been blocked. Please contact an administrator.");
//     }

//     // 🔐 Compare password
//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).send("Invalid email or password");
//     }

//     user.lastLogin = new Date();
//     await user.save();

//     // 🪪 Generate JWT token for normal user
//     const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, {
//       expiresIn: "1d",
//     });

//     // 🍪 Store token in cookie
//     res.cookie("token", token, {
//       httpOnly: true,
//       secure: false, // set true in production
//       maxAge: 24 * 60 * 60 * 1000,
//     });

//     // ✅ Redirect user to home
//     return res.redirect("/user/onboarding");

//   } catch (error) {
//     console.error("Login Error:", error.message);
//     res.status(500).send("Server Error");
//   }
// };






// ✅ Render reset password page

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });

      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.redirect("/admin/dashboard");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.render("login", { error: "Invalid email or password" });
    }

    if (user.status === "Blocked") {
      return res.render("login", { error: "Your account has been blocked. Please contact an administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("login", { error: "Invalid email or password" });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, role: "user" }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.redirect("/user/onboarding");

  } catch (error) {
    console.error("Login Error:", error.message);
    return res.render("login", { error: "Server Error. Please try again later." });
  }
};
  


exports.resetPasswordPage = (req, res) => {
  res.render('resetpassword'); // your EJS file
};

// ✅ Send OTP to email
exports.sendResetOTP = async (req, res) => {
  try {
    const { email,flag } = req.body;
    let status = flag
    console.log(req.body);
    const user = await User.findOne({ email });

    
    if (!user) {
      return res.send('No account found with this email');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    
    

    // Store OTP temporarily
    OTPs[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // 5 min

    
    // Send email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    
    await transporter.sendMail({
  from: process.env.EMAIL_USER,
  to: email,
  subject: 'Your Password Reset OTP Code',
  html: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background-color: #f8fafc;
                color: #334155;
                line-height: 1.6;
            }
            
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            }
            
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 40px 30px;
                text-align: center;
                color: white;
            }
            
            .logo {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 10px;
            }
            
            .header h1 {
                font-size: 24px;
                font-weight: 600;
                margin: 0;
                opacity: 0.95;
            }
            
            .content {
                padding: 40px 30px;
            }
            
            .otp-container {
                text-align: center;
                margin: 30px 0;
            }
            
            .otp-code {
                font-size: 48px;
                font-weight: 700;
                color: #1e293b;
                letter-spacing: 8px;
                background: linear-gradient(135deg, #667eea, #764ba2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                padding: 10px;
                margin: 20px 0;
            }
            
            .message {
                text-align: center;
                color: #64748b;
                font-size: 16px;
                margin-bottom: 25px;
            }
            
            .warning {
                background-color: #fef3c7;
                border: 1px solid #f59e0b;
                border-radius: 12px;
                padding: 16px;
                margin: 25px 0;
                text-align: center;
            }
            
            .warning-text {
                color: #92400e;
                font-size: 14px;
                font-weight: 500;
            }
            
            .footer {
                background-color: #f1f5f9;
                padding: 25px 30px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            
            .footer-text {
                color: #64748b;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .support {
                margin-top: 15px;
                color: #475569;
                font-size: 14px;
            }
            
            @media (max-width: 600px) {
                .container {
                    margin: 10px;
                    border-radius: 12px;
                }
                
                .header {
                    padding: 30px 20px;
                }
                
                .content {
                    padding: 30px 20px;
                }
                
                .otp-code {
                    font-size: 36px;
                    letter-spacing: 6px;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">YourApp</div>
                <h1>Password Reset Verification</h1>
            </div>
            
            <div class="content">
                <p class="message">Hello,</p>
                <p class="message">You requested to reset your password. Use the OTP code below to verify your identity:</p>
                
                <div class="otp-container">
                    <div class="otp-code">${otp}</div>
                </div>
                
                <div class="warning">
                    <p class="warning-text">⚠️ This OTP will expire in 5 minutes</p>
                </div>
                
                <p class="message">If you didn't request this password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            
            <div class="footer">
                <p class="footer-text">
                    This is an automated message. Please do not reply to this email.
                </p>
                <p class="support">
                    Need help? Contact our support team at support@yourapp.com
                </p>
            </div>
        </div>
    </body>
    </html>
  `,
  text: `Password Reset OTP\n\nYour OTP code is: ${otp}\n\nThis OTP will expire in 5 minutes.\n\nIf you didn't request this password reset, please ignore this email.\n\nBest regards,\nYourApp Team`
});

    res.render('verifyotp', { email });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).send('Error sending OTP');
  }
};


exports.newOtpverification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with this email' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP temporarily for 5 minutes
    OTPs[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    // Create mail transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send OTP email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Password Reset OTP Code',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset OTP</title>
          <style>
            body {
              font-family: 'Inter', sans-serif;
              background-color: #f8fafc;
              color: #334155;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 16px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 40px 30px;
              text-align: center;
              color: white;
            }
            .otp-code {
              font-size: 48px;
              font-weight: 700;
              color: #1e293b;
              letter-spacing: 8px;
              background: linear-gradient(135deg, #667eea, #764ba2);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .warning {
              background-color: #fef3c7;
              border: 1px solid #f59e0b;
              border-radius: 12px;
              padding: 12px;
              margin: 25px 0;
              text-align: center;
              color: #92400e;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Verification</h1>
            </div>
            <div style="padding: 30px;">
              <p>Hello,</p>
              <p>Use the OTP below to verify your identity. This code will expire in 5 minutes.</p>
              <div style="text-align: center; margin: 30px 0;">
                <div class="otp-code">${otp}</div>
              </div>
              <div class="warning">⚠️ This OTP will expire in 5 minutes.</div>
              <p>If you didn’t request this password reset, please ignore this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `Your OTP code is: ${otp}. This OTP will expire in 5 minutes.`,
    });

    // ✅ Send success response
    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, message: 'Error sending OTP' });
  }
};

// ✅ Render OTP verification page
exports.verifyOtpPage = (req, res) => {
  const { email } = req.query; // ✅ Get from URL
  res.render('verifyotp', { email });
};


// ✅ Verify OTP
exports.verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  const record = OTPs[email];

  if (!record) {
    return res.status(400).json({ message: 'OTP expired or invalid' });
  }
  if (Date.now() > record.expiresAt) {
    return res.status(400).json({ message: 'OTP expired' });
  }
  if (record.otp !== otp) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  // ✅ OTP is valid
  return res.status(200).json({ 
    message: 'OTP Verified Successfully!',
    email 
  });
};



// ✅ Render new password page
exports.newPasswordPage = (req, res) => {
    const { email } = req.query;
  res.render('newpassword', { email });
};


// updatePassword (for pre-save hook users)
exports.updatePassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    user.password = password; // just assign plain text
    await user.save(); // pre-save hook will hash automatically

    delete OTPs[email];
    return res.status(200).json({ message: 'Password reset successfully!' });
  } catch (error) {
    console.error('Error updating password:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};


// ✅ Logout Controller
// exports.logout = (req, res) => {
//   try {
//     // 1️⃣ Clear the JWT cookie
//     res.clearCookie('token', {
//       httpOnly: true,
//       secure: false, // change to true in production (HTTPS)
//       sameSite: 'lax'
//     });

//     // 2️⃣ If using sessions, destroy it (for admin safety)
//     if (req.session) {
//       req.session.destroy((err) => {
//         if (err) {
//           console.error('Error destroying session:', err);
//         }
//       });
//     }

//     // 3️⃣ Redirect depending on user role
//     const referer = req.headers.referer || '';
//     if (referer.includes('/admin')) {
//       return res.redirect('/admin/login'); // Admin logout
//     } else {
//       return res.redirect('/auth/login'); // Normal user logout
//     }

//   } catch (error) {
//     console.error('Logout Error:', error.message);
//     return res.status(500).json({ message: 'Logout failed. Try again later.' });
//   }
// };


exports.logout = (req, res) => {
  try {
    res.clearCookie('token', { httpOnly: true, sameSite: 'lax', secure: false });
    if (req.session) req.session.destroy(() => {});
    const referer = req.headers.referer || '';
    if (referer.includes('/admin')) return res.redirect('/auth/login');
    return res.redirect('/auth/login');
  } catch (error) {
    console.error('Logout Error:', error.message);
    res.status(500).json({ message: 'Logout failed. Try again later.' });
  }
};




exports.resendSignupOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    const record = OTPs[email];
    if (!record) {
      return res.status(400).json({ message: "Session expired. Signup again." });
    }

    // Generate new OTP
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    record.otp = newOtp;
    record.expiresAt = Date.now() + 5 * 60 * 1000; 

    // Send Email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your new OTP - Traveesy",
      html: `<h1>${newOtp}</h1><p>This OTP will expire in 5 minutes.</p>`
    });

    res.json({ message: "New OTP sent!" });

  } catch (err) {
    console.error("Resend OTP Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
