const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const auth = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');

// @route   POST api/documents
// @desc    Create a document
// @access  Public/Private
router.post('/', optionalAuth, documentController.createDocument);

// @route   GET api/documents/user
// @desc    Get all documents for a user
// @access  Private
router.get('/user', auth, documentController.getUserDocuments);

// @route   GET api/documents/guest
// @desc    Get all documents for a guest user
// @access  Public
router.get('/guest', documentController.getGuestDocuments);

// @route   GET api/documents/:id
// @desc    Get document by ID
// @access  Public/Private (with ownership check)
router.get('/:id', optionalAuth, documentController.getDocument);

// @route   PUT api/documents/:id
// @desc    Update document
// @access  Public/Private (with ownership check)
router.put('/:id', optionalAuth, documentController.updateDocument);

// @route   DELETE api/documents/:id
// @desc    Delete document
// @access  Public/Private (with ownership check)
router.delete('/:id', optionalAuth, documentController.deleteDocument);

// @route   POST api/documents/convert
// @desc    Convert document (Quotation -> Invoice -> Receipt)
// @access  Public/Private (with ownership check)
router.post('/convert', optionalAuth, documentController.convertDocument);

// Test endpoint to verify PDF route is working
router.get('/test-pdf', (req, res) => {
  res.send('PDF endpoint is accessible');
});

// @route   GET api/documents/:documentId/pdf
// @desc    Generate PDF
// @access  Public/Private (with ownership check)
router.get('/:documentId/pdf', optionalAuth, documentController.generatePdf);

// @route   POST api/documents/:documentId/email
// @desc    Email document
// @access  Public/Private (with ownership check)
router.post('/:documentId/email', optionalAuth, documentController.emailDocument);

module.exports = router; 