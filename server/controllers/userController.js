const User = require('../models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
    cb(null, `logo_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`);
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
}).single('logo');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update business information
exports.updateBusinessInfo = async (req, res) => {
  try {
    console.log("Received business info update:", req.body);
    console.log("File uploaded:", req.file);
    
    const updates = { ...req.body };
    
    // If there's a file uploaded (logo)
    if (req.file) {
      // Store the correct path - always starting with /uploads/
      updates.logo = `/uploads/${req.file.filename}`;
      console.log("Logo path saved as:", updates.logo);
    }
    
    // Update the user's business info
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { businessInfo: updates } },
      { new: true }
    );
    
    console.log("Updated business info:", user.businessInfo);
    
    res.json({ businessInfo: user.businessInfo });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update document customization
exports.updateDocumentCustomization = async (req, res) => {
  try {
    console.log("Received document customization update:", req.body);
    
    // Get all fields from the request
    const { primaryColor, accentColor, font, termsAndConditions, footer } = req.body;
    
    // Find the user and update
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Initialize documentCustomization if it doesn't exist
    if (!user.documentCustomization) {
      user.documentCustomization = {};
    }
    
    // Update document customization fields if provided
    if (primaryColor !== undefined) {
      user.documentCustomization.primaryColor = primaryColor;
    }
    
    if (accentColor !== undefined) {
      user.documentCustomization.accentColor = accentColor;
    }
    
    if (font !== undefined) {
      user.documentCustomization.font = font;
    }
    
    if (termsAndConditions !== undefined) {
      user.documentCustomization.termsAndConditions = termsAndConditions;
    }
    
    if (footer !== undefined) {
      user.documentCustomization.footer = footer;
    }
    
    console.log("Updated document customization:", user.documentCustomization);
    
    await user.save();
    res.json({ documentCustomization: user.documentCustomization });
  } catch (err) {
    console.error("Error updating document customization:", err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
}; 