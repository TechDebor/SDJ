const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Ensure Cloudinary is configured with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Multer (memory storage for stream upload)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, JPEG, PNG and WEBP are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Middleware for uploading avatar to Cloudinary
const uploadAvatar = (req, res, next) => {
  const singleUpload = upload.single('avatar');
  
  singleUpload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    
    if (!req.file) {
      return next(); // No file uploaded, proceed normally
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'employee-management/users' },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json({ success: false, message: 'Image upload failed' });
        }
        
        req.body.avatar = result.secure_url;
        next();
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
  });
};

module.exports = { uploadAvatar };
