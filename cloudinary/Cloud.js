const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dyhhpbjxo',
    api_key: process.env.CLOUDINARY_KEY || '176772411984864',
    api_secret: process.env.CLOUDINARY_SECRET || '7jqe358QZm31KPj1O2w4dkng4rk',
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'uploads', 
      allowed_formats: ['jpg', 'png', 'jpeg'], 
    },
});
  
const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };