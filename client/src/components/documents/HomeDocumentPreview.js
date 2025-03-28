/**
 * HomeDocumentPreview.js
 * 
 * PURPOSE:
 * This component provides a preview of documents created with the home form.
 * It displays document data in a structured layout similar to the final PDF,
 * and provides options to download the document as PDF or return to editing.
 * 
 * IMPORTANCE:
 * - Allows users to preview documents before final download
 * - Provides direct PDF generation from localStorage data
 * - Matches styling with the PDF output for consistency
 * - Supports user workflow with edit/download options
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import './DocumentPreview.css';
import { generatePdfFromLocalStorage, generatePdfFromData } from './HomeLocalPdfGenerator';

const HomeDocumentPreview = ({ documentData, onEdit }) => {
  const [logoPreview, setLogoPreview] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Load logo on component mount
  useEffect(() => {
    if (!documentData || !documentData.id) return;
    
    try {
      // Try to load logo for this specific document first
      const logoKey = `homeLogoPreview_${documentData.id}`;
      const savedLogo = localStorage.getItem(logoKey);
      if (savedLogo) {
        setLogoPreview(savedLogo);
      }
    } catch (error) {
      console.error("Error loading logo:", error);
    }
  }, [documentData]);
  
  // If no document data, try to load from localStorage based on URL parameter
  useEffect(() => {
    if (!documentData || !documentData.id) {
      const searchParams = new URLSearchParams(location.search);
      const documentId = searchParams.get('id');
      
      if (documentId) {
        try {
          // Load document from history
          const savedDocuments = JSON.parse(localStorage.getItem('homeDocuments') || '[]');
          const foundDocument = savedDocuments.find(doc => doc.id === documentId);
          
          if (foundDocument && onEdit) {
            // If using URL parameter and we have onEdit, load the document
            onEdit(foundDocument);
            
            // Also load logo
            const logoKey = `homeLogoPreview_${documentId}`;
            const savedLogo = localStorage.getItem(logoKey);
            if (savedLogo) {
              setLogoPreview(savedLogo);
            }
          }
        } catch (error) {
          console.error('Error loading document from localStorage:', error);
          toast.error('Could not load the requested document');
          navigate('/');
        }
      } else {
        // No document data and no ID in URL, redirect to home
        navigate('/');
      }
    }
  }, [documentData, location.search, navigate, onEdit]);
  
  if (!documentData || !documentData.id) {
    return <div className="document-preview loading">Loading document...</div>;
  }
  
  // Format currency with the correct symbol
  const getCurrencySymbol = () => {
    const currencyMap = {
      'USD ($)': '$',
      'EUR (€)': '€',
      'GBP (£)': '£'
    };
    return currencyMap[documentData.currency] || '$';
  };
  
  const formatCurrency = (amount) => {
    const symbol = getCurrencySymbol();
    return `${symbol}${parseFloat(amount || 0).toFixed(2)}`;
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  /**
   * Handle PDF download via HomeLocalPdfGenerator
   */
  const handleDownload = async () => {
    try {
      // Save the current document to history if it's not already there
      const savedDocuments = JSON.parse(localStorage.getItem('homeDocuments') || '[]');
      if (!savedDocuments.some(doc => doc.id === documentData.id)) {
        // Update the document data
        const updatedDocument = {
          ...documentData,
          updatedAt: new Date().toISOString()
        };
        
        savedDocuments.push(updatedDocument);
        localStorage.setItem('homeDocuments', JSON.stringify(savedDocuments));
      }
      
      // Generate PDF using the utility function
      if (documentData.id) {
        // If we have an ID, use the localStorage version to ensure consistency
        await generatePdfFromLocalStorage(documentData.id);
      } else {
        // Otherwise use the current data
        const { pdf, filename } = await generatePdfFromData(documentData, logoPreview);
        pdf.save(filename);
      }
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };
  
  // Get document type with first letter capitalized
  const documentType = documentData.type.charAt(0).toUpperCase() + documentData.type.slice(1);
  
  return (
    <div className="document-preview">
      <div className="preview-header">
        <h2>Document Preview</h2>
        <div className="preview-actions">
          <button className="btn btn-secondary" onClick={() => onEdit(documentData)}>
            Edit
          </button>
          <button className="btn btn-primary" onClick={handleDownload}>
            Download PDF
          </button>
        </div>
      </div>
      
      <div className="preview-content">
        <div className="document-header">
          {logoPreview && (
            <div className="document-logo">
              <img src={logoPreview} alt="Company Logo" />
            </div>
          )}
          
          <div className="document-info">
            {documentData.companyName && (
              <h1 className="company-name">{documentData.companyName}</h1>
            )}
            
            {documentData.fromInfo && (
              <div className="from-info">
                {documentData.fromInfo.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            )}
            
            <h2 className="document-title">
              {documentType} #{documentData.number}
            </h2>
            
            <div className="document-dates">
              <p>Date: {formatDate(documentData.date)}</p>
              {documentData.dueDate && <p>Due Date: {formatDate(documentData.dueDate)}</p>}
            </div>
          </div>
        </div>
        
        <div className="client-info">
          <h3>Bill To:</h3>
          <p className="client-name">{documentData.client.name}</p>
          {documentData.client.address && <p>{documentData.client.address}</p>}
          {documentData.client.email && <p>Email: {documentData.client.email}</p>}
          {documentData.client.phone && <p>Phone: {documentData.client.phone}</p>}
        </div>
        
        <div className="document-items">
          <table>
            <thead>
              <tr>
                <th className="item-name">Item</th>
                <th className="item-quantity">Quantity</th>
                <th className="item-price">Price</th>
                <th className="item-subtotal">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {documentData.items.map((item, index) => (
                <tr key={index}>
                  <td className="item-name">{item.name}</td>
                  <td className="item-quantity">{item.quantity}</td>
                  <td className="item-price">{formatCurrency(item.price)}</td>
                  <td className="item-subtotal">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="document-totals">
          <div className="totals-row">
            <div className="total-label">Subtotal:</div>
            <div className="total-value">{formatCurrency(documentData.subtotal)}</div>
          </div>
          
          {documentData.tax > 0 && (
            <div className="totals-row">
              <div className="total-label">Tax ({documentData.tax}%):</div>
              <div className="total-value">
                {formatCurrency(documentData.subtotal * (documentData.tax / 100))}
              </div>
            </div>
          )}
          
          {documentData.discount > 0 && (
            <div className="totals-row">
              <div className="total-label">Discount:</div>
              <div className="total-value">-{formatCurrency(documentData.discount)}</div>
            </div>
          )}
          
          {documentData.shipping > 0 && (
            <div className="totals-row">
              <div className="total-label">Shipping:</div>
              <div className="total-value">{formatCurrency(documentData.shipping)}</div>
            </div>
          )}
          
          <div className="totals-row total">
            <div className="total-label">Total:</div>
            <div className="total-value">{formatCurrency(documentData.total)}</div>
          </div>
          
          {documentData.amountPaid > 0 && (
            <>
              <div className="totals-row">
                <div className="total-label">Amount Paid:</div>
                <div className="total-value">{formatCurrency(documentData.amountPaid)}</div>
              </div>
              
              <div className="totals-row balance">
                <div className="total-label">Balance Due:</div>
                <div className="total-value">{formatCurrency(documentData.balanceDue)}</div>
              </div>
            </>
          )}
        </div>
        
        {(documentData.notes || documentData.terms) && (
          <div className="document-notes">
            {documentData.notes && (
              <div className="notes-section">
                <h3>Notes:</h3>
                <p>{documentData.notes}</p>
              </div>
            )}
            
            {documentData.terms && (
              <div className="terms-section">
                <h3>Terms and Conditions:</h3>
                <p>{documentData.terms}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeDocumentPreview; 