const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Vercel has a read-only filesystem — use memoryStorage in production
const isProduction = process.env.NODE_ENV === 'production';

let storage;

if (isProduction) {
  // On Vercel: store file in memory (access via req.file.buffer)
  storage = multer.memoryStorage();
} else {
  // Locally: use disk storage
  const uploadDir = 'public/uploads/profileImages';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = req.user._id + '-' + Date.now() + path.extname(file.originalname);
      cb(null, uniqueSuffix);
    },
  });
}

// Filter for image files
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'), false);
  }
};

module.exports = multer({ storage, fileFilter });
