import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './DocumentHistory.css';

const DocumentHistory = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Load documents from localStorage
    const loadDocuments = () => {
      try {
        const savedDocuments = JSON.parse(localStorage.getItem('invoiceDocuments') || '[]');
        
        // Sort documents by date (newest first)
        savedDocuments.sort((a, b) => {
          const dateA = a.updatedAt || a.createdAt;
          const dateB = b.updatedAt || b.createdAt;
          return new Date(dateB) - new Date(dateA);
        });
        
        setDocuments(savedDocuments);
        setLoading(false);
      } catch (error) {
        console.error('Error loading documents from localStorage:', error);
        setDocuments([]);
        setLoading(false);
      }
    };
    
    loadDocuments();
  }, []);

  // Get currency symbol
  const getCurrencySymbol = (currency) => {
    const currencyMap = {
      'USD ($)': '$',
      'EUR (€)': '€',
      'GBP (£)': '£'
    };
    return currencyMap[currency] || '$';
  };

  const viewDocument = (id) => {
    navigate(`/classic-form?id=${id}`);
  };

  const downloadPdf = (id) => {
    // For now just open a preview window
    // In a real implementation, this would generate a PDF using client-side library
    window.open(`/document-preview?id=${id}`, '_blank');
  };
  
  const deleteDocument = (id) => {
    try {
      // Get existing documents from localStorage
      const savedDocuments = JSON.parse(localStorage.getItem('invoiceDocuments') || '[]');
      
      // Filter out the document to delete
      const updatedDocuments = savedDocuments.filter(doc => doc.id !== id);
      
      // Save back to localStorage
      localStorage.setItem('invoiceDocuments', JSON.stringify(updatedDocuments));
      
      // Also remove the logo if it exists
      localStorage.removeItem(`invoiceLogoPreview_${id}`);
      
      // Update state
      setDocuments(updatedDocuments);
      
      alert('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document');
    }
  };

  const clearAllDocuments = () => {
    if (window.confirm('Are you sure you want to erase all documents? This cannot be undone.')) {
      // Clear documents from localStorage
      localStorage.removeItem('invoiceDocuments');
      
      // Clear document logos
      documents.forEach(doc => {
        localStorage.removeItem(`invoiceLogoPreview_${doc.id}`);
      });
      
      // Update state
      setDocuments([]);
      
      alert('All documents erased');
    }
  };

  if (loading) return <div className="loading">Loading documents...</div>;

  return (
    <div className="document-history-container">
      <div className="document-history-header">
        <h1>Invoice History</h1>
        <div className="header-actions">
          <Link to="/classic-form" className="btn btn-primary">
            Create New Invoice
          </Link>
        </div>
      </div>

      <div className="document-list">
        {documents.length === 0 ? (
          <div className="no-documents">
            <p>No invoices found. Start creating some invoices!</p>
            <Link to="/classic-form" className="btn btn-primary">
              Create New Invoice
            </Link>
          </div>
        ) : (
          <>
            <table className="document-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Due Date</th>
                  <th>Total</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.invoiceNumber}</td>
                    <td>{doc.billTo.split('\n')[0] || 'N/A'}</td>
                    <td>{new Date(doc.issueDate).toLocaleDateString()}</td>
                    <td>{doc.dueDate ? new Date(doc.dueDate).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      {getCurrencySymbol(doc.currency)}
                      {parseFloat(doc.total).toFixed(2)}
                    </td>
                    <td className="document-actions">
                      <button 
                        onClick={() => downloadPdf(doc.id)}
                        className="btn btn-sm btn-download"
                        title="Download PDF"
                      >
                        Download
                      </button>
                      <button
                        onClick={() => viewDocument(doc.id)}
                        className="btn btn-sm btn-view"
                        title="View Document"
                      >
                        View
                      </button>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="btn btn-sm btn-delete"
                        title="Delete Document"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <div className="document-list-footer">
              <div className="alert-text">
                <p className="warning">⚠️ These invoices are stored on your device only. Clearing your browser's history will erase these invoices. We recommend hanging on to a copy of each invoice you generate.</p>
              </div>
              <button onClick={clearAllDocuments} className="erase-btn">
                Erase Everything
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DocumentHistory; 