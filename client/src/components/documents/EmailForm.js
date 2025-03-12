import React, { useState, useContext } from 'react';
import DocumentContext from '../../context/DocumentContext';
import { toast } from 'react-toastify';
import './EmailForm.css';

const EmailForm = ({ documentId, clientEmail }) => {
  const [email, setEmail] = useState(clientEmail || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  
  const { emailDocument } = useContext(DocumentContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Email address is required');
      return;
    }
    
    setIsSending(true);
    setPreviewUrl('');
    
    const result = await emailDocument(documentId, {
      email,
      subject,
      message
    });
    
    setIsSending(false);
    
    if (result.success) {
      toast.success(result.msg);
      // Show preview URL if available (useful in development)
      if (result.previewUrl) {
        setPreviewUrl(result.previewUrl);
      }
      // Clear form
      setSubject('');
      setMessage('');
    } else {
      toast.error(result.msg);
    }
  };

  return (
    <div className="email-form-container">
      <h2>Send Document</h2>
      <form className="email-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Recipient Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter recipient email"
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="subject">Subject (optional)</label>
          <input
            type="text"
            id="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter email subject"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="message">Message (optional)</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter email message"
            rows="4"
          />
        </div>
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isSending}
        >
          {isSending ? 'Sending...' : 'Send Email'}
        </button>
      </form>
      
      {previewUrl && (
        <div className="email-preview">
          <h3>Email Preview</h3>
          <p>Since we're in development mode, you can view the sent email here:</p>
          <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="btn">
            View Email
          </a>
        </div>
      )}
    </div>
  );
};

export default EmailForm; 