const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['quotation', 'invoice', 'receipt', 'creditNote', 'purchaseOrder'],
    required: true
  },
  number: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  client: {
    name: {
      type: String,
      required: true
    },
    email: String,
    phone: String,
    address: String
  },
  items: [{
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1
    },
    price: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      default: 0
    },
    subtotal: Number
  }],
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  notes: String,
  footer: String,
  termsAndConditions: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ipAddress: String,
  isGuest: {
    type: Boolean,
    default: false
  },
  relatedDocuments: {
    originalQuotation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    resultingInvoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    resultingReceipt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    }
  },
  isLocal: {
    type: Boolean,
    default: false
  },
  localId: {
    type: String
  },
  synced: {
    type: Boolean,
    default: false
  },
  fromInfo: String,
  companyName: String,
  currency: {
    type: String,
    default: 'USD ($)'
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

module.exports = mongoose.model('Document', DocumentSchema); 