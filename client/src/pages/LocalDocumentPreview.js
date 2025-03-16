import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { generateLocalPdf } from '../utils/LocalPdfGenerator';
import './DocumentPreview.css'; // Reuse existing styles

const LocalDocumentPreview = () => {
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [logo, setLogo] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const loadDocument = () => {
      try {
        // Get document ID from URL
        const searchParams = new URLSearchParams(location.search);
        const documentId = searchParams.get('id');
        
        if (!documentId) {
          setError('Document ID not provided');
          setLoading(false);
          return;
        }
        
        // Load document from localStorage
        const savedDocuments = JSON.parse(localStorage.getItem('invoiceDocuments') || '[]');
        const documentToView = savedDocuments.find(doc => doc.id === documentId);
        
        if (!documentToView) {
          setError('Document not found');
          setLoading(false);
          return;
        }
        
        // Load logo if exists
        const savedLogo = localStorage.getItem(`invoiceLogoPreview_${documentId}`);
        if (savedLogo) {
          setLogo(savedLogo);
        }
        
        setDocument(documentToView);
        setLoading(false);
      } catch (error) {
        console.error('Error loading document from localStorage:', error);
        setError('Error loading document');
        setLoading(false);
      }
    };
    
    loadDocument();
  }, [location.search]);

  // Get currency symbol
  const getCurrencySymbol = (currency) => {
    const currencyMap = {
      'USD ($)': '$',
      'EUR (€)': '€',
      'GBP (£)': '£'
    };
    return currencyMap[currency] || '$';
  };
  
  // Format currency
  const formatCurrency = (amount, currency) => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  // Generate PDF using our local PDF generator
  const generatePdf = async (documentId) => {
    try {
      // Generate PDF using our local PDF generator
      const pdf = await generateLocalPdf(documentId);
      
      // Get document data for filename
      const savedDocuments = JSON.parse(localStorage.getItem('invoiceDocuments') || '[]');
      const document = savedDocuments.find(doc => doc.id === documentId);
      
      // Save with meaningful filename
      const filename = document ? 
        `${document.type || 'invoice'}_${document.invoiceNumber || 'document'}.pdf` : 
        'document.pdf';
      
      pdf.save(filename);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + error.message);
    }
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  if (loading) return <div className="loading">Loading document...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!document) return <div className="error-message">Document not found</div>;

  return (
    <div className="document-preview-container">
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
      
      <div className="document-preview">
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
                  e.target.onerror = null; 
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

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

        {document.notes && (
          <div className="preview-notes">
            <h3>Notes</h3>
            <p>{document.notes}</p>
          </div>
        )}

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

export default LocalDocumentPreview; 