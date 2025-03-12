import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DocumentContext, { DocumentProvider } from '../context/DocumentContext';
import { toast } from 'react-toastify';
import './DocumentEmailPage.css';

// Rename to indicate this is the content part
const DocumentEmailContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getDocument, emailDocument } = useContext(DocumentContext);
  
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [emailData, setEmailData] = useState({
    to: '',        // Updated field name to match backend
    subject: '',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);
  
  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const doc = await getDocument(id);
        setDocument(doc);
        
        // Pre-populate subject with document type and number
        setEmailData(prev => ({
          ...prev,
          subject: `${doc.type.charAt(0).toUpperCase() + doc.type.slice(1)} #${doc.number}`
        }));
      } catch (error) {
        console.error('Error fetching document:', error);
        toast.error('Could not load document details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDocument();
  }, [id, getDocument]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmailData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    
    try {
      const result = await emailDocument(id, emailData);
      if (result.success) {
        toast.success('Email sent successfully');
        navigate(`/document/${id}`);
      } else {
        toast.error(result.msg || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Error sending email');
    } finally {
      setIsSending(false);
    }
  };
  
  if (loading) return <div className="loading">Loading...</div>;
  if (!document) return <div className="error">Document not found</div>;
  
  return (
    <div className="email-document-page">
      <h1>Email {document.type.charAt(0).toUpperCase() + document.type.slice(1)}</h1>
      
      <div className="document-info">
        <p><strong>Document:</strong> {document.type} #{document.number}</p>
        <p><strong>Client:</strong> {document.client.name}</p>
        <p><strong>Amount:</strong> ${document.total.toFixed(2)}</p>
      </div>
      
      <form onSubmit={handleSubmit} className="email-form">
        <div className="form-group">
          <label htmlFor="to">Recipient Email</label>
          <input
            type="email"
            id="to"
            name="to"         // Updated field name to match backend
            value={emailData.to}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="subject">Subject</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={emailData.subject}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            value={emailData.message}
            onChange={handleChange}
            rows="5"
            placeholder="Enter an optional message to include with the document..."
          />
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => navigate(`/document/${id}`)}
          >
            Cancel
          </button>
          
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isSending}
          >
            {isSending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Wrap with DocumentProvider
const DocumentEmailPage = () => (
  <DocumentProvider>
    <DocumentEmailContent />
  </DocumentProvider>
);

export default DocumentEmailPage; 