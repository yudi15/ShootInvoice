/**
 * LocalPdfViewer.js
 * 
 * PURPOSE:
 * This component provides a button that generates and downloads a PDF
 * version of a document stored in localStorage. It acts as a simple
 * interface to the LocalPdfGenerator utility.
 * 
 * IMPORTANCE:
 * - Provides users with a simple one-click PDF generation experience
 * - Handles the PDF generation process, loading, and error states
 * - Gives visual feedback during the PDF generation process
 * - Serves as a reusable component that can be used across the application
 */

import React, { useState } from 'react'; // Import React and useState hook
import { generateLocalPdf } from '../utils/LocalPdfGenerator'; // Import the PDF generation utility
import { toast } from 'react-toastify'; // Import toast notifications

/**
 * Component for generating and downloading PDFs from localStorage
 * @param {Object} props - Component props
 * @param {string} props.documentId - ID of the document to generate PDF for
 * @returns {JSX.Element} - Rendered button component
 */
const LocalPdfViewer = ({ documentId }) => {
  // State to track if PDF is currently being generated
  const [loading, setLoading] = useState(false);
  
  /**
   * Handles the PDF download process
   * Generates PDF and triggers browser download
   */
  const handleDownload = async () => {
    try {
      // Set loading state to show user that PDF is being generated
      setLoading(true);
      
      // Call utility function to generate PDF from localStorage data
      const pdf = await generateLocalPdf(documentId);
      
      // Get document details from localStorage to use in filename
      const savedDocuments = JSON.parse(localStorage.getItem('invoiceDocuments') || '[]');
      const document = savedDocuments.find(doc => doc.id === documentId);
      
      // Create meaningful filename with document type and number
      const filename = document ? 
        `${document.type || 'invoice'}_${document.invoiceNumber || 'document'}.pdf` : 
        'document.pdf';
      
      // Trigger PDF download with the generated filename
      pdf.save(filename);
      
      // Show success message to user
      toast.success('PDF downloaded successfully');
    } catch (error) {
      // Log error for debugging
      console.error('Error generating PDF:', error);
      
      // Show error message to user with details of what went wrong
      toast.error('Failed to generate PDF: ' + (error.message || 'Unknown error'));
    } finally {
      // Reset loading state regardless of success or failure
      setLoading(false);
    }
  };
  
  // Render download button with loading state
  return (
    <button 
      onClick={handleDownload} // Attach click handler
      disabled={loading} // Disable button while loading
      className="download-btn" // Apply styling
    >
      {loading ? 'Generating...' : '↓ Download PDF'} {/* Show different text based on loading state */}
    </button>
  );
};

export default LocalPdfViewer; // Export component for use in other files 