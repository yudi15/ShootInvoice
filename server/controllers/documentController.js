const Document = require('../models/Document');
const User = require('../models/User');
const PDFDocument = require('pdfmake');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Set up email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Create document
exports.createDocument = async (req, res) => {
  try {
    const documentData = req.body;
    let userId = null;
    let isGuest = true;
    const ipAddress = req.ip;

    // Check if user is authenticated
    if (req.user) {
      userId = req.user.id;
      isGuest = false;
    }

    // Create new document
    const newDocument = new Document({
      ...documentData,
      userId,
      ipAddress,
      isGuest
    });

    await newDocument.save();
    
    res.status(201).json(newDocument);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get all documents for a user
exports.getUserDocuments = async (req, res) => {
  try {
    const documents = await Document.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get documents for guest user by IP
exports.getGuestDocuments = async (req, res) => {
  try {
    const ipAddress = req.ip;
    const documents = await Document.find({ ipAddress, isGuest: true }).sort({ createdAt: -1 });
    res.json(documents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Get document by ID
exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    // Check ownership
    if (document.userId && document.userId.toString() !== req.user?.id && !document.isGuest) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    res.json(document);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Update document
exports.updateDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    // Check ownership
    if (document.userId && document.userId.toString() !== req.user?.id && !document.isGuest) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // Update the document
    const updatedDocument = await Document.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true }
    );

    res.json(updatedDocument);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Delete document
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);
    
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    // Check ownership
    if (document.userId && document.userId.toString() !== req.user?.id && !document.isGuest) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Document deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Convert document (Quotation -> Invoice -> Receipt)
exports.convertDocument = async (req, res) => {
  try {
    const { documentId, targetType } = req.body;
    
    // Get original document
    const originalDocument = await Document.findById(documentId);
    
    if (!originalDocument) {
      return res.status(404).json({ msg: 'Document not found' });
    }

    // Check ownership
    if (originalDocument.userId && originalDocument.userId.toString() !== req.user?.id && !originalDocument.isGuest) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // Validate conversion path
    const validConversion = 
      (originalDocument.type === 'quotation' && targetType === 'invoice') ||
      (originalDocument.type === 'invoice' && targetType === 'receipt');
    
    if (!validConversion) {
      return res.status(400).json({ 
        msg: 'Invalid conversion. Only Quotation -> Invoice or Invoice -> Receipt is allowed.' 
      });
    }

    // Create new document
    const newDocument = new Document({
      ...originalDocument.toObject(),
      _id: undefined,
      type: targetType,
      number: generateDocumentNumber(targetType),
      date: new Date(),
      relatedDocuments: {
        ...originalDocument.relatedDocuments
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    });

    // Update relation
    if (targetType === 'invoice') {
      newDocument.relatedDocuments.originalQuotation = originalDocument._id;
      // Update original quotation
      originalDocument.relatedDocuments.resultingInvoice = newDocument._id;
    } else if (targetType === 'receipt') {
      newDocument.relatedDocuments.originalQuotation = originalDocument.relatedDocuments.originalQuotation;
      // Update original invoice
      originalDocument.relatedDocuments.resultingReceipt = newDocument._id;
    }

    await newDocument.save();
    await originalDocument.save();
    
    res.json(newDocument);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Generate PDF
exports.generatePdf = async (req, res) => {
  try {
    const document = await Document.findById(req.params.documentId);
    
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }
    
    // Get the user data for business info
    let user = null;
    if (req.user) {
      // If authenticated, get user from request
      user = await User.findById(req.user.id);
    } else if (document.userId) {
      // If document has a userId, get that user
      user = await User.findById(document.userId);
    }
    
    // Log the user's business info for debugging
    console.log("User for PDF generation:", user?.email);
    console.log("Business info for PDF:", user?.businessInfo);
    
    // Create the PDF definition with user data
    const pdfDefinition = await createPdfDefinition(document, user);
    
    // Use the proper PDFMake library for PDF generation
    const PdfPrinter = require('pdfmake');
    // Define standard fonts that are available by default
    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      },
      // Add Roboto as an alias for Helvetica since some styles might reference it
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      },
      // Default font
      Courier: {
        normal: 'Courier',
        bold: 'Courier-Bold',
        italics: 'Courier-Oblique',
        bolditalics: 'Courier-BoldOblique'
      },
      Times: {
        normal: 'Times-Roman',
        bold: 'Times-Bold',
        italics: 'Times-Italic',
        bolditalics: 'Times-BoldItalic'
      }
    };
    
    const printer = new PdfPrinter(fonts);
    const pdfDoc = printer.createPdfKitDocument(pdfDefinition);
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.type}_${document.number}.pdf"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Pipe the PDF to the response
    pdfDoc.pipe(res);
    pdfDoc.end();
    
    // At the start of the generatePdf function
    console.log("=============================================================");
    console.log("GENERATING PDF FOR DOCUMENT:", req.params.documentId);
    console.log("USER AUTHENTICATED:", req.user ? "YES" : "NO");
    console.log("USER ID:", req.user?.id);
    console.log("DOCUMENT USER ID:", document.userId);
    console.log("USER EMAIL:", user?.email);
    console.log("BUSINESS INFO PRESENT:", user?.businessInfo ? "YES" : "NO");
    console.log("LOGO PATH:", user?.businessInfo?.logo || "NONE");
    console.log("=============================================================");
    
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).send(`Server error: ${err.message}`);
  }
};

// Email document
exports.emailDocument = async (req, res) => {
  try {
    console.log("Sending email for document:", req.params.documentId);
    const { to, subject, message } = req.body;
    
    if (!to || !subject) {
      return res.status(400).json({ msg: 'Please provide both email address and subject' });
    }
    
    // Get document
    const document = await Document.findById(req.params.documentId);
    if (!document) {
      return res.status(404).json({ msg: 'Document not found' });
    }
    
    // Get the user data for business info if authenticated
    let user = null;
    if (req.user) {
      // If authenticated, get user from request
      user = await User.findById(req.user.id);
      console.log("Found user for email:", user.email);
    } else if (document.userId) {
      // If document has a userId, get that user
      user = await User.findById(document.userId);
      console.log("Found document owner for email:", user?.email);
    }
    
    // Define businessInfoBlock outside to avoid reference error
    const businessInfo = user?.businessInfo || {};
    const businessInfoBlock = [
      { text: businessInfo.name || 'Your Business Name', style: 'businessName' },
      { text: businessInfo.address || 'Your Business Address', style: 'businessInfo' },
      { text: businessInfo.phone || 'Your Phone', style: 'businessInfo' },
      { text: businessInfo.email || 'Your Email', style: 'businessInfo' }
    ];
    
    // Create PDF
    console.log("Generating PDF for email...");
    
    // Use the proper PDFMake library for PDF generation
    const PdfPrinter = require('pdfmake');
    // Define standard fonts that are available by default
    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      },
      // Add Roboto as an alias for Helvetica since some styles might reference it
      Roboto: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique'
      },
      Courier: {
        normal: 'Courier',
        bold: 'Courier-Bold',
        italics: 'Courier-Oblique',
        bolditalics: 'Courier-BoldOblique'
      },
      Times: {
        normal: 'Times-Roman',
        bold: 'Times-Bold',
        italics: 'Times-Italic',
        bolditalics: 'Times-BoldItalic'
      }
    };
    
    const printer = new PdfPrinter(fonts);
    const pdfDefinition = await createPdfDefinition(document, user);
    const pdfDoc = printer.createPdfKitDocument(pdfDefinition);
    
    // Buffer to store PDF data
    let chunks = [];
    pdfDoc.on('data', (chunk) => chunks.push(chunk));
    
    pdfDoc.on('end', async () => {
      try {
        const pdfBuffer = Buffer.concat(chunks);
        
        // Check if email configuration exists
        if (!process.env.EMAIL_SERVICE || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
          console.error("Email configuration missing. Check your environment variables.");
          return res.status(500).json({ msg: 'Email service not configured' });
        }
        
        // Create email transporter
        const transporter = nodemailer.createTransport({
          service: process.env.EMAIL_SERVICE,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });
        
        // Prepare email data
        const emailData = {
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to,
          subject: subject || `${document.type.toUpperCase()} #${document.number}`,
          text: message || `Please find attached ${document.type} #${document.number}.`,
          attachments: [
            {
              filename: `${document.type}-${document.number}.pdf`,
              content: pdfBuffer
            }
          ]
        };
        
        console.log("Sending email to:", to);
        console.log("Email service:", process.env.EMAIL_SERVICE);
        console.log("From address:", emailData.from);
        
        // Send email
        await transporter.sendMail(emailData);
        console.log("Email sent successfully");
        
        res.json({ msg: 'Email sent successfully' });
      } catch (err) {
        console.error("Error in PDF end handler:", err);
        res.status(500).json({ msg: 'Failed to send email', error: err.message });
      }
    });
    
    // Finalize the PDF
    pdfDoc.end();
    
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ msg: 'Failed to send email', error: err.message });
  }
};

// Helper functions
function generateDocumentNumber(type) {
  const prefix = type.charAt(0).toUpperCase();
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}-${randomNum}`;
}

// This is the function that creates the PDF content structure
const createPdfDefinition = async (document, user) => {
  console.log("Creating PDF definition with user:", user?.email);
  
  // Get the business info from the user object
  const businessInfo = user?.businessInfo || {};
  console.log("Business info available:", businessInfo);
  console.log("Business info for PDF:", JSON.stringify(businessInfo, null, 2));
  
  // Define logoPath and logoError at the function level
  let logoPath = null;
  let logoError = null;
  
  // Define businessInfoBlock at the function level to avoid reference error
  const businessInfoBlock = [
    { text: businessInfo.name || 'Your Business Name', style: 'businessName' },
    { text: businessInfo.address || 'Your Business Address', style: 'businessInfo' },
    { text: businessInfo.phone || 'Your Phone', style: 'businessInfo' },
    { text: businessInfo.email || 'Your Email', style: 'businessInfo' }
  ];
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Calculate document totals
  const { subtotal = 0, tax = 0, discount = 0, total = 0 } = document;
  
  // Content array for PDF
  let content = [];
  
  // HEADER SECTION WITH BUSINESS INFO AND LOGO
  if (user && user.businessInfo) {
    // Check if logo exists
    if (businessInfo.logo) {
      try {
        // Fix the logo path to use the server's file system path
        const logoFilePath = path.join(__dirname, '..', businessInfo.logo.replace(/^\//, ''));
        console.log("Trying to access logo at path:", logoFilePath);
        
        if (fs.existsSync(logoFilePath)) {
          logoPath = logoFilePath;
          console.log("Logo file found at:", logoPath);
          
          // Add business info with logo
          content.push({
            columns: [
              {
                stack: businessInfoBlock,
                width: '*'
              },
              {
                image: logoPath,
                width: 100,
                alignment: 'right'
              }
            ],
            margin: [0, 0, 0, 20]
          });
        } else {
          console.error("Logo file not found at:", logoFilePath);
          logoError = new Error("Logo file not found");
          
          // If logo file doesn't exist, just add business info without logo
          content.push({
            stack: businessInfoBlock,
            margin: [0, 0, 0, 20]
          });
        }
      } catch (err) {
        console.error("Error adding logo to PDF:", err);
        logoError = err;
        
        // If there's an error with the logo, still add the business info without logo
        content.push({
          stack: businessInfoBlock,
          margin: [0, 0, 0, 20]
        });
      }
    } else {
      // No logo, just add business info
      console.log("No logo in business info, adding text-only header");
      content.push({
        stack: businessInfoBlock,
        margin: [0, 0, 0, 20]
      });
    }
  } else {
    console.log("No business info available, using generic header");
    // No business info at all - add generic header
    content.push({
      text: document.type.toUpperCase() + ' ' + document.number,
      style: 'header',
      margin: [0, 0, 0, 20]
    });
  }
  
  // DOCUMENT TITLE AND INFO
  content.push({
    text: document.type.toUpperCase(),
    style: 'documentTitle',
    margin: [0, 0, 0, 10]
  });
  
  content.push({
    columns: [
      {
        width: '*',
        text: [
          { text: 'Number: ', style: 'label' },
          { text: document.number, style: 'value' }
        ]
      },
      {
        width: '*',
        text: [
          { text: 'Date: ', style: 'label' },
          { text: formatDate(document.date), style: 'value' }
        ]
      }
    ],
    margin: [0, 0, 0, 10]
  });
  
  if (document.dueDate) {
    content.push({
      text: [
        { text: 'Due Date: ', style: 'label' },
        { text: formatDate(document.dueDate), style: 'value' }
      ],
      margin: [0, 0, 0, 10]
    });
  }
  
  // CLIENT INFORMATION
  content.push({
    text: 'Client Information',
    style: 'sectionHeader',
    margin: [0, 10, 0, 5]
  });
  
  content.push({
    text: [
      { text: 'Name: ', style: 'label' },
      { text: document.client.name, style: 'value' }
    ],
    margin: [0, 0, 0, 5]
  });
  
  if (document.client.address) {
    content.push({
      text: [
        { text: 'Address: ', style: 'label' },
        { text: document.client.address, style: 'value' }
      ],
      margin: [0, 0, 0, 5]
    });
  }
  
  if (document.client.email) {
    content.push({
      text: [
        { text: 'Email: ', style: 'label' },
        { text: document.client.email, style: 'value' }
      ],
      margin: [0, 0, 0, 5]
    });
  }
  
  if (document.client.phone) {
    content.push({
      text: [
        { text: 'Phone: ', style: 'label' },
        { text: document.client.phone, style: 'value' }
      ],
      margin: [0, 0, 0, 10]
    });
  }
  
  // ITEMS TABLE
  content.push({
    text: 'Items',
    style: 'sectionHeader',
    margin: [0, 10, 0, 5]
  });
  
  const tableBody = [
    [
      { text: 'Item', style: 'tableHeader' },
      { text: 'Description', style: 'tableHeader' },
      { text: 'Quantity', style: 'tableHeader', alignment: 'right' },
      { text: 'Price', style: 'tableHeader', alignment: 'right' },
      { text: 'Total', style: 'tableHeader', alignment: 'right' }
    ]
  ];
  
  document.items.forEach(item => {
    tableBody.push([
      item.name,
      item.description || '',
      { text: item.quantity.toString(), alignment: 'right' },
      { text: `$${parseFloat(item.price).toFixed(2)}`, alignment: 'right' },
      { text: `$${parseFloat(item.quantity * item.price).toFixed(2)}`, alignment: 'right' }
    ]);
  });
  
  content.push({
    table: {
      widths: ['*', '*', 'auto', 'auto', 'auto'],
      body: tableBody
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 10]
  });
  
  // TOTALS
  content.push({
    columns: [
      { width: '*', text: '' },
      {
        width: 'auto',
        table: {
          widths: ['*', 'auto'],
          body: [
            [
              { text: 'Subtotal:', style: 'totalsLabel', alignment: 'right' },
              { text: `$${parseFloat(subtotal).toFixed(2)}`, style: 'totalsValue', alignment: 'right' }
            ],
            [
              { text: 'Tax:', style: 'totalsLabel', alignment: 'right' },
              { text: `$${parseFloat(tax).toFixed(2)}`, style: 'totalsValue', alignment: 'right' }
            ],
            [
              { text: 'Discount:', style: 'totalsLabel', alignment: 'right' },
              { text: `$${parseFloat(discount).toFixed(2)}`, style: 'totalsValue', alignment: 'right' }
            ],
            [
              { text: 'Total:', style: 'totalLabel', alignment: 'right' },
              { text: `$${parseFloat(total).toFixed(2)}`, style: 'totalValue', alignment: 'right' }
            ]
          ]
        },
        layout: 'noBorders'
      }
    ],
    margin: [0, 10, 0, 10]
  });
  
  // NOTES
  if (document.notes) {
    content.push({
      text: 'Notes',
      style: 'sectionHeader',
      margin: [0, 10, 0, 5]
    });
    
    content.push({
      text: document.notes,
      margin: [0, 0, 0, 10]
    });
  }
  
  // TERMS AND CONDITIONS
  if (user?.documentCustomization?.termsAndConditions) {
    content.push({
      text: 'Terms and Conditions',
      style: 'sectionHeader',
      margin: [0, 10, 0, 5]
    });
    
    content.push({
      text: user.documentCustomization.termsAndConditions,
      margin: [0, 0, 0, 10]
    });
  }
  
  // FOOTER FROM USER CUSTOMIZATION
  if (user?.documentCustomization?.footers) {
    content.push({
      text: user.documentCustomization.footers,
      style: 'footer',
      margin: [0, 20, 0, 0]
    });
  }
  
  // If logo path can't be found or used, use a text-only header
  if (!logoPath || logoError) {
    console.log("Using text-only header because logo couldn't be loaded");
    // Add just the business info without logo
    content.push({
      stack: businessInfoBlock,
      margin: [0, 0, 0, 20]
    });
  }
  
  // Create the PDF definition with styles
  return {
    content: content,
    styles: {
      businessName: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 5]
      },
      businessInfo: {
        fontSize: 10,
        margin: [0, 0, 0, 2]
      },
      documentTitle: {
        fontSize: 16,
        bold: true,
        margin: [0, 20, 0, 5]
      },
      sectionHeader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      header: {
        fontSize: 16,
        bold: true
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5]
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: 'black'
      },
      label: {
        bold: true,
        fontSize: 10
      },
      value: {
        fontSize: 10
      },
      totalsLabel: {
        fontSize: 10,
        bold: true,
        margin: [0, 2, 5, 2]
      },
      totalsValue: {
        fontSize: 10,
        margin: [0, 2, 0, 2]
      },
      totalLabel: {
        fontSize: 12,
        bold: true,
        margin: [0, 5, 5, 2]
      },
      totalValue: {
        fontSize: 12,
        bold: true,
        margin: [0, 5, 0, 2]
      },
      footer: {
        fontSize: 10,
        italics: true,
        alignment: 'center'
      }
    },
    defaultStyle: {
      fontSize: 10,
      font: 'Helvetica'
    }
  };
}; 