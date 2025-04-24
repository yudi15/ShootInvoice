const mongoose = require('mongoose');

const DocumentAssetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  documentId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['logo', 'signature', 'stamp', 'other']
  },
  data: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
DocumentAssetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('documentAsset', DocumentAssetSchema); 