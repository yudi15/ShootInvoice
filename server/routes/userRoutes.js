const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// Set up multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `logo_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  } 
});

// @route   GET api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, userController.getProfile);

// @route   PUT api/users/business-info
// @desc    Update business information
// @access  Private
router.put('/business-info', auth, upload.single('logo'), userController.updateBusinessInfo);

// @route   PUT api/users/document-customization
// @desc    Update document customization
// @access  Private
router.put('/document-customization', auth, userController.updateDocumentCustomization);

// Add this route temporarily to fix existing logo paths
router.get('/fix-logo-paths', async (req, res) => {
  try {
    // Find all users
    const users = await User.find();
    let fixedCount = 0;
    
    for (const user of users) {
      if (user.businessInfo && user.businessInfo.logo) {
        const oldPath = user.businessInfo.logo;
        let newPath = oldPath;
        
        // Fix /document/uploads/ paths
        if (newPath.includes('/document/uploads/')) {
          newPath = newPath.replace('/document/uploads/', '/uploads/');
        }
        
        // Fix double /uploads/uploads/ paths
        if (newPath.includes('/uploads/uploads/')) {
          newPath = newPath.replace('/uploads/uploads/', '/uploads/');
        }
        
        // Only update if the path changed
        if (newPath !== oldPath) {
          user.businessInfo.logo = newPath;
          await user.save();
          fixedCount++;
          console.log(`Fixed logo path for user ${user._id}: ${oldPath} -> ${newPath}`);
        }
      }
    }
    
    res.json({ msg: `Fixed logo paths for ${fixedCount} users` });
  } catch (err) {
    console.error('Error fixing logo paths:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// Add a debug endpoint to see current logo paths
router.get('/debug-logo-paths', async (req, res) => {
  try {
    const users = await User.find({'businessInfo.logo': {$exists: true}});
    const logoPaths = users.map(user => ({
      userId: user._id,
      logoPath: user.businessInfo?.logo || 'No logo'
    }));
    
    console.log('Current logo paths:', logoPaths);
    res.json(logoPaths);
  } catch (err) {
    console.error('Error getting logo paths:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router; 