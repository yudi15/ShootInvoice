const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Update the User schema to better define document customization fields
const documentCustomizationSchema = {
  primaryColor: { type: String, default: '#3498db' },
  accentColor: { type: String, default: '#2ecc71' },
  font: { type: String, default: 'Helvetica' },
  termsAndConditions: { type: String, default: '' },
  footer: { type: String, default: '' }
};

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  businessInfo: {
    name: { type: String },
    address: { type: String },
    phone: { type: String },
    email: { type: String },
    website: { type: String },
    taxId: { type: String },
    logo: { type: String }
  },
  documentCustomization: documentCustomizationSchema,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema); 