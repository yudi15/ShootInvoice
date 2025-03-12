import React from 'react';
import './DocumentPreview.css';

const DocumentPreview = ({ document, businessInfo }) => {
  if (!document) return null;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="document-preview">
      <div className="preview-header">
        <div className="preview-title">
          <h2>{document.type.toUpperCase()}</h2>
          <p className="document-number">#{document.number}</p>
        </div>
        {businessInfo?.logo && (
          <div className="logo">
            <img 
              src={
                // For full URLs (external images)
                businessInfo.logo.startsWith('http') 
                  ? businessInfo.logo 
                  // Remove any duplicate /uploads/ prefixes
                  : businessInfo.logo.includes('/uploads/uploads/') 
                    ? businessInfo.logo.replace('/uploads/uploads/', '/uploads/')
                    // Fix document/uploads paths  
                    : businessInfo.logo.includes('/document/uploads/')
                      ? businessInfo.logo.replace('/document/uploads/', '/uploads/')
                      // Make sure path starts with /uploads/
                      : businessInfo.logo.startsWith('/uploads/') 
                        ? businessInfo.logo
                        // Just use the filename if none of the above conditions match
                        : businessInfo.logo.includes('/')
                          ? `/uploads/${businessInfo.logo.split('/').pop()}`
                          : `/uploads/${businessInfo.logo}`
              } 
              alt="Business Logo" 
              onError={(e) => {
                console.error("Logo failed to load:", businessInfo.logo);
                e.target.onerror = null; 
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      <div className="preview-metadata">
        <div className="preview-dates">
          <p><strong>Date:</strong> {formatDate(document.date)}</p>
          {document.dueDate && (
            <p><strong>Due Date:</strong> {formatDate(document.dueDate)}</p>
          )}
        </div>
      </div>

      <div className="preview-parties">
        <div className="preview-from">
          <h3>From</h3>
          <p>{businessInfo?.name || 'Your Business Name'}</p>
          <p>{businessInfo?.address || 'Your Business Address'}</p>
          <p>{businessInfo?.phone || 'Your Phone'}</p>
          <p>{businessInfo?.email || 'Your Email'}</p>
        </div>
        <div className="preview-to">
          <h3>To</h3>
          <p>{document.client.name}</p>
          <p>{document.client.address}</p>
          <p>{document.client.phone}</p>
          <p>{document.client.email}</p>
        </div>
      </div>

      <table className="preview-items">
        <thead>
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Tax (%)</th>
            <th>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {document.items.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td>{item.quantity}</td>
              <td>${parseFloat(item.price).toFixed(2)}</td>
              <td>{item.tax}%</td>
              <td>${parseFloat(item.subtotal).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="preview-totals">
        <div className="total-row">
          <span>Subtotal:</span>
          <span>${parseFloat(document.subtotal).toFixed(2)}</span>
        </div>
        <div className="total-row">
          <span>Tax:</span>
          <span>${parseFloat(document.tax).toFixed(2)}</span>
        </div>
        {document.discount > 0 && (
          <div className="total-row">
            <span>Discount:</span>
            <span>-${parseFloat(document.discount).toFixed(2)}</span>
          </div>
        )}
        <div className="total-row total">
          <span>Total:</span>
          <span>${parseFloat(document.total).toFixed(2)}</span>
        </div>
      </div>

      {document.notes && (
        <div className="preview-notes">
          <h3>Notes</h3>
          <p>{document.notes}</p>
        </div>
      )}

      {document.termsAndConditions && (
        <div className="preview-terms">
          <h3>Terms and Conditions</h3>
          <p>{document.termsAndConditions}</p>
        </div>
      )}

      {document.footer && (
        <div className="preview-footer">
          <p>{document.footer}</p>
        </div>
      )}
    </div>
  );
};

export default DocumentPreview; 