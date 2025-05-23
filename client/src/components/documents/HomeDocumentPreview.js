/**
 * HomeDocumentPreview.js
 * 
 * PURPOSE:
 * This component displays a preview of the document created in the homepage form.
 * It shows how the document will look when downloaded as a PDF.
 * 
 * IMPORTANCE:
 * - Provides immediate visual feedback to users
 * - Ensures document formatting is correct before download
 * - Maintains consistent styling with the PDF output
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaDownload, FaArrowLeft } from 'react-icons/fa';
import { useTheme } from '../../contexts/ThemeContext';

const HomeDocumentPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const [documentData, setDocumentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDocument = () => {
      try {
        // Get document ID from URL parameters
        const params = new URLSearchParams(location.search);
        const documentId = params.get('id');
        
        if (!documentId) {
          setError('No document ID provided');
          return;
        }
        
        // Get document from localStorage
        const savedDocuments = JSON.parse(localStorage.getItem('homeDocuments') || '[]');
        const document = savedDocuments.find(doc => doc.id === documentId);
        
        if (!document) {
          setError('Document not found');
          return;
        }
        
        setDocumentData(document);
      } catch (error) {
        console.error('Error loading document:', error);
        setError('Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadDocument();
  }, [location]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleDownload = () => {
    // Implement PDF download functionality here
    toast.info('PDF download functionality will be implemented');
  };

  if (isLoading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button className="btn btn-primary" onClick={handleBack}>
          <FaArrowLeft className="me-2" />
          Go Back
        </button>
      </div>
    );
  }

  if (!documentData) {
    return null;
  }

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: documentData.currency || 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={`container mt-4 ${isDarkMode ? 'text-light' : ''}`}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button className="btn btn-outline-primary" onClick={handleBack}>
          <FaArrowLeft className="me-2" />
          Back
        </button>
        <button className="btn btn-primary" onClick={handleDownload}>
          <FaDownload className="me-2" />
          Download PDF
        </button>
      </div>

      <div className={`card ${isDarkMode ? 'bg-dark text-light' : ''}`}>
        <div className="card-body">
          {/* Document Header */}
          <div className="row mb-4">
            <div className="col-md-6">
              <h4 className="mb-3">{documentData.companyName}</h4>
              {documentData.fromInfo && (
                <div className="text-muted">
                  {documentData.fromInfo.split('\n').map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                </div>
              )}
            </div>
            <div className="col-md-6 text-md-end">
              <h2 className="mb-3">{documentData.type.toUpperCase()}</h2>
              <div>Number: {documentData.number}</div>
              <div>Date: {formatDate(documentData.date)}</div>
              {documentData.dueDate && (
                <div>Due Date: {formatDate(documentData.dueDate)}</div>
              )}
            </div>
          </div>

          {/* Client Information */}
          <div className="row mb-4">
            <div className="col-12">
              <h5 className="mb-3">Client Information</h5>
              <div className="card">
                <div className="card-body">
                  {documentData.client.name && <div>Name: {documentData.client.name}</div>}
                  {documentData.client.address && <div>Address: {documentData.client.address}</div>}
                  {documentData.client.email && <div>Email: {documentData.client.email}</div>}
                  {documentData.client.phone && <div>Phone: {documentData.client.phone}</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="row mb-4">
            <div className="col-12">
              <h5 className="mb-3">Items</h5>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Description</th>
                      <th className="text-center">Quantity</th>
                      <th className="text-end">Price</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documentData.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.name}</td>
                        <td>{item.description}</td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-end">{formatCurrency(item.price)}</td>
                        <td className="text-end">{formatCurrency(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Totals */}
          <div className="row">
            <div className="col-md-6 offset-md-6">
              <table className="table table-borderless">
                <tbody>
                  <tr>
                    <td>Subtotal:</td>
                    <td className="text-end">{formatCurrency(documentData.subtotal)}</td>
                  </tr>
                  {documentData.tax > 0 && (
                    <tr>
                      <td>Tax:</td>
                      <td className="text-end">{formatCurrency(documentData.subtotal * (documentData.tax / 100))}</td>
                    </tr>
                  )}
                  {documentData.discount > 0 && (
                    <tr>
                      <td>Discount:</td>
                      <td className="text-end">{formatCurrency(documentData.discount)}</td>
                    </tr>
                  )}
                  <tr className="fw-bold">
                    <td>Total:</td>
                    <td className="text-end">{formatCurrency(documentData.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {documentData.notes && (
            <div className="row mt-4">
              <div className="col-12">
                <h5 className="mb-3">Notes</h5>
                <div className="card">
                  <div className="card-body">
                    {documentData.notes.split('\n').map((line, index) => (
                      <div key={index}>{line}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeDocumentPreview; 