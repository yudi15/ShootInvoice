/**
 * LocalDocumentPreview.js
 * 
 * PURPOSE:
 * This page provides a preview of an invoice/document stored in localStorage and
 * offers options to print or download it as a PDF. It renders a visual representation
 * of the invoice that matches the PDF output format.
 * 
 * IMPORTANCE:
 * - Allows users to preview their documents before printing or downloading
 * - Provides a consistent view that matches the final PDF output
 * - Enables printing directly from the browser
 * - Offers PDF download option without server involvement
 * - Accesses document data exclusively from localStorage
 */

import React, { useState, useEffect } from 'react'; // Import React and hooks
import { useLocation, Link } from 'react-router-dom'; // Import routing utilities
import { toast } from 'react-toastify'; // Import toast notifications
import { generateLocalPdf } from '../utils/LocalPdfGenerator'; // Import PDF generator utility
import './LocalDocumentPreview.css'; // Import styling

/**
 * Component to preview and download/print documents from localStorage
 */
const LocalDocumentPreview = () => {
  // State management for component
  const [document, setDocument] = useState(null); // Stores the document data
  const [loading, setLoading] = useState(true); // Tracks loading state
  const [error, setError] = useState(null); // Stores any error messages
  const [logo, setLogo] = useState(null); // Stores the document logo
  const location = useLocation(); // Access URL parameters
  
  // Load document data from localStorage when component mounts or URL changes
  useEffect(() => {
    const loadDocument = () => {
      try {
        // Extract document ID from URL parameters
        const searchParams = new URLSearchParams(location.search);
        const documentId = searchParams.get('id');
        
        // Handle missing document ID
        if (!documentId) {
          setError('Document ID not provided');
          setLoading(false);
          return;
        }
        
        // Retrieve document from localStorage using the ID
        const savedDocuments = JSON.parse(localStorage.getItem('invoiceDocuments') || '[]');
        const documentToView = savedDocuments.find(doc => doc.id === documentId);
        
        // Handle document not found
        if (!documentToView) {
          setError('Document not found');
          setLoading(false);
          return;
        }
        
        // Load logo for this document if it exists
        const savedLogo = localStorage.getItem(`invoiceLogoPreview_${documentId}`);
        if (savedLogo) {
          setLogo(savedLogo);
        }
        
        // Update state with the found document
        setDocument(documentToView);
        setLoading(false);
      } catch (error) {
        // Handle any errors during loading
        console.error('Error loading document from localStorage:', error);
        setError('Error loading document');
        setLoading(false);
      }
    };
    
    // Execute the loading function
    loadDocument();
  }, [location.search]); // Re-run when URL changes

  /**
   * Get the appropriate currency symbol
   * @param {string} currency - Currency code
   * @returns {string} - Currency symbol
   */
  const getCurrencySymbol = (currency) => {
    const currencyMap = {
      'USD ($)': '$',
      'EUR (€)': '€',
      'GBP (£)': '£'
    };
    return currencyMap[currency] || '$';
  };
  
  /**
   * Format numeric amount to currency string
   * @param {number} amount - Amount to format
   * @param {string} currency - Currency type
   * @returns {string} - Formatted currency string
   */
  const formatCurrency = (amount, currency) => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
  };
  
  /**
   * Format date to locale-specific string
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  /**
   * Generate and download PDF from document data
   * @param {string} documentId - Document ID to generate PDF for
   */
  const generatePdf = async (documentId) => {
    try {
      // Generate PDF using the utility function
      const pdf = await generateLocalPdf(documentId);
      
      // Get document details for the filename
      const savedDocuments = JSON.parse(localStorage.getItem('invoiceDocuments') || '[]');
      const document = savedDocuments.find(doc => doc.id === documentId);
      
      // Create a meaningful filename
      const filename = document ? 
        `${document.type || 'invoice'}_${document.invoiceNumber || 'document'}.pdf` : 
        'document.pdf';
      
      // Trigger PDF download
      pdf.save(filename);
      
      // Show success message
      toast.success('PDF downloaded successfully');
    } catch (error) {
      // Handle errors
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    }
  };
  
  /**
   * Trigger browser's print dialog
   */
  const handlePrint = () => {
    window.print(); // Browser built-in print function
  };
  
  // Display loading message while fetching data
  if (loading) return <div className="loading">Loading document...</div>;
  
  // Display error message if something went wrong
  if (error) return <div className="error-message">{error}</div>;
  
  // Display error if document wasn't found
  if (!document) return <div className="error-message">Document not found</div>;

  // Main component render
  return (
    <div className="document-preview-container">
      {/* Header with navigation and action buttons */}
      <div className="preview-header">
        <Link to="/classic-form" className="back-button">
          Back to Invoice Form
        </Link>
        <h1>Invoice Preview</h1>
        <div className="preview-actions">
          <button className="print-button" onClick={handlePrint} style={{ marginRight: '10px' }}>
            Print
          </button>
          <button className="download-button" onClick={() => generatePdf(document.id)}>
            Download PDF
          </button>
        </div>
      </div>
      
      {/* Document preview section */}
      <div className="document-preview">
        {/* Document header with title and logo */}
        <div className="preview-header">
          <div className="preview-title">
            <h2>{document.type.toUpperCase()}</h2>
            <p className="document-number">#{document.invoiceNumber}</p>
          </div>
          {logo && (
            <div className="logo">
              <img 
                src={logo} 
                alt="Business Logo" 
                onError={(e) => {
                  e.target.onerror = null; // Prevent infinite error loop
                  e.target.style.display = 'none'; // Hide broken image
                }}
              />
            </div>
          )}
        </div>

        {/* Date information section */}
        <div className="preview-metadata">
          <div className="preview-dates">
            <p><strong>Date:</strong> {formatDate(document.issueDate)}</p>
            {document.dueDate && (
              <p><strong>Due Date:</strong> {formatDate(document.dueDate)}</p>
            )}
            {document.poNumber && (
              <p><strong>PO Number:</strong> {document.poNumber}</p>
            )}
          </div>
        </div>

        {/* Business and client information section */}
        <div className="preview-parties">
          <div className="preview-from">
            <h3>From</h3>
            <p>{document.companyName || 'Your Business Name'}</p>
            <p>{document.fromInfo || ''}</p>
          </div>
          <div className="preview-to">
            <h3>Bill To</h3>
            <p>{document.billTo}</p>
            {document.shipTo && (
              <div>
                <h3>Ship To</h3>
                <p>{document.shipTo}</p>
              </div>
            )}
          </div>
        </div>

        {/* Items table */}
        <table className="preview-items">
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Rate</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {document.items.map((item, index) => (
              <tr key={index}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{formatCurrency(item.rate, document.currency)}</td>
                <td>{formatCurrency(item.amount, document.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals section */}
        <div className="preview-totals">
          <div className="total-row">
            <span>Subtotal:</span>
            <span>{formatCurrency(document.subtotal, document.currency)}</span>
          </div>
          {document.tax > 0 && (
            <div className="total-row">
              <span>Tax:</span>
              <span>{formatCurrency(document.subtotal * (document.tax / 100), document.currency)}</span>
            </div>
          )}
          {document.discount > 0 && (
            <div className="total-row">
              <span>Discount:</span>
              <span>-{formatCurrency(document.discount, document.currency)}</span>
            </div>
          )}
          {document.shipping > 0 && (
            <div className="total-row">
              <span>Shipping:</span>
              <span>{formatCurrency(document.shipping, document.currency)}</span>
            </div>
          )}
          <div className="total-row total">
            <span>Total:</span>
            <span>{formatCurrency(document.total, document.currency)}</span>
          </div>
          {document.amountPaid > 0 && (
            <div className="total-row">
              <span>Amount Paid:</span>
              <span>{formatCurrency(document.amountPaid, document.currency)}</span>
            </div>
          )}
          {document.balanceDue > 0 && (
            <div className="total-row balance">
              <span>Balance Due:</span>
              <span>{formatCurrency(document.balanceDue, document.currency)}</span>
            </div>
          )}
        </div>

        {/* Notes section */}
        {document.notes && (
          <div className="preview-notes">
            <h3>Notes</h3>
            <p>{document.notes}</p>
          </div>
        )}

        {/* Terms and conditions section */}
        {document.terms && (
          <div className="preview-terms">
            <h3>Terms and Conditions</h3>
            <p>{document.terms}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LocalDocumentPreview; // Export component 