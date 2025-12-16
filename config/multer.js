    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');

    const uploadPath = path.join(__dirname, '../public/uploads/profileImages');
    if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
    }

    const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${req.user._id}-${Date.now()}${ext}`;
        cb(null, filename);
    },
    });

    const fileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif/;
    const extname = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowed.test(file.mimetype);
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
    };

    const upload = multer({ storage, fileFilter });
    module.exports = upload;
