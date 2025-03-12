import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DocumentContext from '../../context/DocumentContext';
import { toast } from 'react-toastify';
import './DocumentActions.css';

const DocumentActions = ({ document }) => {
  const { deleteDocument, convertDocument } = useContext(DocumentContext);
  const navigate = useNavigate();

  if (!document) return null;

  const documentId = document._id;
  const documentType = document.type;

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      const success = await deleteDocument(documentId);
      if (success) {
        toast.success('Document deleted successfully');
        navigate('/dashboard');
      } else {
        toast.error('Failed to delete document');
      }
    }
  };

  const handleConvert = async (targetType) => {
    const converted = await convertDocument(documentId, targetType);
    if (converted) {
      toast.success(`Converted to ${targetType} successfully`);
      navigate(`/document/${converted._id}`);
    } else {
      toast.error(`Failed to convert to ${targetType}`);
    }
  };

  const getNextDocumentType = () => {
    switch (documentType) {
      case 'quotation':
        return 'invoice';
      case 'invoice':
        return 'receipt';
      default:
        return null;
    }
  };

  const nextType = getNextDocumentType();

  const handlePdfDownload = () => {
    const token = localStorage.getItem('token');
    const fullUrl = `http://localhost:5000/api/documents/${documentId}/pdf`;
    
    if (token) {
      const form = window.document.createElement('form');
      form.method = 'GET';
      form.action = fullUrl;
      form.target = '_blank';
      
      const hiddenField = window.document.createElement('input');
      hiddenField.type = 'hidden';
      hiddenField.name = 'x-auth-token';
      hiddenField.value = token;
      form.appendChild(hiddenField);
      
      window.document.body.appendChild(form);
      form.submit();
      window.document.body.removeChild(form);
    } else {
      window.open(fullUrl, '_blank');
    }
  };

  return (
    <div className="document-actions">
      <Link to={`/document/edit/${documentId}`} className="btn btn-primary">
        Edit
      </Link>
      
      <button 
        onClick={handlePdfDownload} 
        className="btn btn-success"
      >
        Download PDF
      </button>
      
      <Link to={`/document/${documentId}/email`} className="btn">
        Email
      </Link>
      
      {nextType && (
        <button 
          onClick={() => handleConvert(nextType)} 
          className="btn btn-success"
        >
          Convert to {nextType}
        </button>
      )}
      
      <button 
        onClick={handleDelete} 
        className="btn btn-danger"
      >
        Delete
      </button>
    </div>
  );
};

export default DocumentActions; 