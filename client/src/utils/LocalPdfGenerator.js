/**
 * LocalPdfGenerator.js
 * 
 * PURPOSE:
 * This utility file provides functionality to generate professional-looking PDF documents
 * using data stored in localStorage, without requiring server interaction.
 * 
 * IMPORTANCE:
 * - Enables offline PDF generation capability for invoices/documents
 * - Maintains consistent PDF styling similar to server-generated PDFs
 * - Allows users to download professional PDFs even when working with local data only
 * - Preserves user privacy by keeping document data client-side
 */

import jsPDF from 'jspdf'; // Import jsPDF library for PDF generation
import 'jspdf-autotable'; // Import autotable plugin for creating tables in PDF

/**
 * Generates a PDF from localStorage document data
 * @param {string} documentId - The ID of the document to generate PDF for
 * @returns {jsPDF} - The generated PDF document object
 */
export const generateLocalPdf = async (documentId) => {
  try {
    // Load document from localStorage by its ID
    const savedDocuments = JSON.parse(localStorage.getItem('invoiceDocuments') || '[]');
    const document = savedDocuments.find(doc => doc.id === documentId);
    
    // Throw error if document not found
    if (!document) {
      throw new Error('Document not found in localStorage');
    }
    
    // Load logo if it exists for this document
    const logoDataUrl = localStorage.getItem(`invoiceLogoPreview_${documentId}`);
    
    // Create new PDF document with default settings
    const pdf = new jsPDF();
    
    // Define page layout constants
    const pageWidth = pdf.internal.pageSize.width; // Get page width
    const margin = 20; // Set margin size
    const col1 = margin; // Left column position
    const col2 = pageWidth - margin; // Right column position
    
    // Start positioning elements from the top margin
    let currentY = margin;
    
    // Add logo in top right corner if available
    if (logoDataUrl) {
      try {
        pdf.addImage(logoDataUrl, 'JPEG', pageWidth - 60, margin, 40, 20);
      } catch (logoError) {
        console.error('Error adding logo to PDF:', logoError);
      }
    }
    
    // Add business name at top left with bold styling
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text(document.companyName || 'Your Business Name', col1, currentY);
    
    // Add business details below the name
    currentY += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    // Add business address/contact info if available
    if (document.fromInfo) {
      const fromLines = document.fromInfo.split('\\n');
      fromLines.forEach(line => {
        pdf.text(line, col1, currentY);
        currentY += 5; // Move down for next line
      });
    }
    
    // Add INVOICE header text
    currentY = margin + 30; // Set position for invoice header
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.text('INVOICE', col1, currentY);
    
    // Add invoice details (number, date, due date)
    currentY += 10;
    pdf.setFontSize(11);
    pdf.text(`Number: ${document.invoiceNumber}`, col1, currentY);
    
    currentY += 6;
    pdf.text(`Date: ${formatDate(document.issueDate)}`, col1, currentY);
    
    if (document.dueDate) {
      currentY += 6;
      pdf.text(`Due Date: ${formatDate(document.dueDate)}`, col1, currentY);
    }
    
    // Add Client Information section header
    currentY += 15;
    pdf.setFontSize(14);
    pdf.text('Client Information', col1, currentY);
    
    // Add client details below
    currentY += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    
    // Parse client info from billTo field
    if (document.billTo) {
      const clientLines = document.billTo.split('\\n');
      pdf.text(`Name: ${clientLines[0] || ''}`, col1, currentY);
      
      // Add address if more than one line
      if (clientLines.length > 1) {
        currentY += 6;
        pdf.text(`Address: ${clientLines.slice(1).join(', ')}`, col1, currentY);
      }
    }
    
    // Add Items section header
    currentY += 15;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Items', col1, currentY);
    
    // Define table structure for invoice items
    currentY += 5;
    const tableColumns = [
      { header: 'Item', dataKey: 'description' },
      { header: 'Description', dataKey: 'description' },
      { header: 'Quantity', dataKey: 'quantity' },
      { header: 'Price', dataKey: 'rate' },
      { header: 'Total', dataKey: 'amount' }
    ];
    
    // Format item data for table display
    const tableRows = document.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      rate: formatCurrency(item.rate, document.currency),
      amount: formatCurrency(item.amount, document.currency)
    }));
    
    // Create table with items data
    pdf.autoTable({
      startY: currentY, // Start table at current Y position
      head: [['Item', 'Description', 'Quantity', 'Price', 'Total']], // Header row
      body: tableRows.map(row => [ // Data rows
        row.description,
        row.description,
        row.quantity,
        row.rate,
        row.amount
      ]),
      theme: 'grid', // Use grid theme for table borders
      headStyles: { // Style the header row
        fillColor: [80, 80, 80],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: { // Set column widths and alignment
        0: { cellWidth: 40 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: margin, right: margin } // Set table margins
    });
    
    // Position for totals section after the table
    currentY = pdf.lastAutoTable.finalY + 10;
    
    // Helper function to add total rows
    const addTotalRow = (label, value, isBold = false) => {
      if (isBold) {
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFont('helvetica', 'normal');
      }
      
      // Position the label and value as a right-aligned pair
      pdf.text(label, pageWidth - 70, currentY);
      pdf.text(value, pageWidth - margin, currentY, { align: 'right' });
      currentY += 6; // Move down for the next row
    };
    
    // Add Subtotal row
    addTotalRow('Subtotal:', formatCurrency(document.subtotal, document.currency));
    
    // Add Tax row if applicable
    if (document.tax > 0) {
      const taxAmount = document.subtotal * (document.tax / 100);
      addTotalRow('Tax:', formatCurrency(taxAmount, document.currency));
    }
    
    // Add Discount row if applicable
    if (document.discount > 0) {
      addTotalRow('Discount:', `-${formatCurrency(document.discount, document.currency)}`);
    }
    
    // Add Shipping row if applicable
    if (document.shipping > 0) {
      addTotalRow('Shipping:', formatCurrency(document.shipping, document.currency));
    }
    
    // Add horizontal line before total
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.5);
    pdf.line(pageWidth - 70, currentY - 2, pageWidth - margin, currentY - 2);
    
    // Add Total row with bold styling
    addTotalRow('Total:', formatCurrency(document.total, document.currency), true);
    
    // Add Amount Paid row if applicable
    if (document.amountPaid > 0) {
      addTotalRow('Amount Paid:', formatCurrency(document.amountPaid, document.currency));
    }
    
    // Add Balance Due row if applicable with red color
    if (document.balanceDue > 0) {
      pdf.setTextColor(231, 76, 60); // Red color for balance due
      addTotalRow('Balance Due:', formatCurrency(document.balanceDue, document.currency), true);
      pdf.setTextColor(0); // Reset text color to black
    }
    
    // Add Notes section if present
    if (document.notes) {
      currentY += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Notes', col1, currentY);
      
      currentY += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      // Split long text to fit page width
      const notesLines = pdf.splitTextToSize(document.notes, pageWidth - (margin * 2));
      pdf.text(notesLines, col1, currentY);
      currentY += (notesLines.length * 5) + 5;
    }
    
    // Add Terms section if present
    if (document.terms) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Terms and Conditions', col1, currentY);
      
      currentY += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      // Split long text to fit page width
      const termsLines = pdf.splitTextToSize(document.terms, pageWidth - (margin * 2));
      pdf.text(termsLines, col1, currentY);
    }
    
    // Return the completed PDF document
    return pdf;
    
  } catch (error) {
    // Log error and rethrow for handling by caller
    console.error('Error generating PDF:', error);
    throw error;
  }
};

/**
 * Formats a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currencyType - The currency type (defaults to USD)
 * @returns {string} - Formatted currency string
 */
function formatCurrency(amount, currencyType = 'USD ($)') {
  // Map currency types to symbols
  const currencyMap = {
    'USD ($)': '$',
    'EUR (€)': '€',
    'GBP (£)': '£'
  };
  // Get symbol or default to $
  const symbol = currencyMap[currencyType] || '$';
  // Return formatted amount with 2 decimal places
  return `${symbol}${parseFloat(amount).toFixed(2)}`;
}

/**
 * Formats a date string to localized format
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
  if (!dateString) return ''; // Return empty string if no date
  const date = new Date(dateString);
  return date.toLocaleDateString(); // Format date according to browser locale
} 