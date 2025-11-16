const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = 'public/uploads/profileImages';

// Ensure the directory exists
fs.mkdirSync(uploadDir, { recursive: true });

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename: userId-timestamp.ext
    const uniqueSuffix = req.user._id + '-' + Date.now() + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  },
});

// Filter for image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'), false);
  }
};

module.exports = multer({ storage, fileFilter });
