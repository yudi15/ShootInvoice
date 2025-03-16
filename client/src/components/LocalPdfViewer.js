import React, { useState } from 'react';
import { generateLocalPdf } from '../utils/LocalPdfGenerator';
import { toast } from 'react-toastify';

const LocalPdfViewer = ({ documentId }) => {
  const [loading, setLoading] = useState(false);
  
  const handleDownload = async () => {
    try {
      setLoading(true);
      
      // Generate PDF document from localStorage
      const pdf = await generateLocalPdf(documentId);
      
      // Save the PDF with the invoice number as the filename
      const savedDocuments = JSON.parse(localStorage.getItem('invoiceDocuments') || '[]');
      const document = savedDocuments.find(doc => doc.id === documentId);
      const filename = document ? 
        `${document.type || 'invoice'}_${document.invoiceNumber || 'document'}.pdf` : 
        'document.pdf';
      
      // Trigger download
      pdf.save(filename);
      
      toast.success('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <button 
      onClick={handleDownload} 
      disabled={loading}
      className="download-btn"
    >
      {loading ? 'Generating...' : '↓ Download PDF'}
    </button>
  );
};

export default LocalPdfViewer; 