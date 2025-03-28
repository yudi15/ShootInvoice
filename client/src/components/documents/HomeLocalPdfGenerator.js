/**
 * HomeLocalPdfGenerator.js
 * 
 * PURPOSE:
 * This utility generates PDFs for documents created in the homepage form.
 * It handles formatting and layout of data stored in localStorage, and
 * creates PDFs without requiring server communication.
 * 
 * IMPORTANCE:
 * - Allows completely offline PDF generation
 * - Ensures consistent PDF styling with server-generated versions
 * - Supports company logo embedding
 * - Handles different currency formats
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { toast } from 'react-toastify';

/**
 * Generates and downloads a PDF from the document data in localStorage
 * @param {string} documentId - ID of the document to generate PDF for
 * @param {boolean} download - Whether to trigger download (true) or return the PDF object (false)
 * @returns {Promise<jsPDF|null>} - The jsPDF object (if download=false) or null (if download=true)
 */
export const generatePdfFromLocalStorage = async (documentId, download = true) => {
  try {
    // Get document from localStorage
    const savedDocuments = JSON.parse(localStorage.getItem('homeDocuments') || '[]');
    const documentData = savedDocuments.find(doc => doc.id === documentId);
    
    if (!documentData) {
      toast.error('Document not found in local storage');
      return null;
    }
    
    // Get logo if available
    let logoDataUrl = null;
    try {
      logoDataUrl = localStorage.getItem(`homeLogoPreview_${documentId}`);
    } catch (e) {
      console.error('Error retrieving logo from localStorage:', e);
      // Continue without logo
    }
    
    // Create PDF document (A4 size)
    const pdf = new jsPDF();
    
    // Set default font
    pdf.setFont('helvetica');
    
    // Get currency symbol
    const currencyMap = {
      'USD ($)': '$',
      'EUR (€)': '€',
      'GBP (£)': '£'
    };
    const currencySymbol = currencyMap[documentData.currency] || '$';
    
    // Format currency
    const formatCurrency = (amount) => {
      return `${currencySymbol}${parseFloat(amount).toFixed(2)}`;
    };
    
    // Set page margins
    const margin = 20;
    let yPos = margin;
    
    // HEADER SECTION
    // Company name (left side)
    if (documentData.companyName) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(documentData.companyName, margin, yPos);
      yPos += 5;
    }
    
    // Company info (left side)
    if (documentData.fromInfo) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const fromLines = documentData.fromInfo.split('\n');
      fromLines.forEach(line => {
        pdf.text(line, margin, yPos);
        yPos += 4;
      });
    }
    
    // Reset yPos for logo placement on right side
    yPos = margin;
    
    // Add logo on right side if available
    if (logoDataUrl) {
      try {
        // Position logo in top right corner
        pdf.addImage(logoDataUrl, 'JPEG', pdf.internal.pageSize.width - margin - 50, yPos, 50, 25);
      } catch (e) {
        console.error('Error adding logo to PDF:', e);
        // Continue without logo
      }
    }
    
    // Move to document type section
    yPos = margin + 35;
    
    // Document Type Heading
    let documentType = documentData.type.charAt(0).toUpperCase() + documentData.type.slice(1);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(documentType.toUpperCase(), margin, yPos);
    yPos += 10;
    
    // Format dates
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };
    
    // Document details - left side
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Number: ${documentData.number}`, margin, yPos);
    yPos += 5;
    pdf.text(`Date: ${formatDate(documentData.date)}`, margin, yPos);
    
    // Document details - right side
    if (documentData.dueDate) {
      pdf.text(`Due Date: ${formatDate(documentData.dueDate)}`, pdf.internal.pageSize.width - margin - 50, yPos);
    }
    
    // CLIENT SECTION
    yPos += 15;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Client Information', margin, yPos);
    yPos += 7;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    if (documentData.client.name) {
      pdf.text(`Name: ${documentData.client.name}`, margin, yPos);
      yPos += 5;
    }
    
    if (documentData.client.address) {
      pdf.text(`Address: ${documentData.client.address}`, margin, yPos);
      yPos += 5;
    }
    
    if (documentData.client.email) {
      pdf.text(`Email: ${documentData.client.email}`, margin, yPos);
      yPos += 5;
    }
    
    if (documentData.client.phone) {
      pdf.text(`Phone: ${documentData.client.phone}`, margin, yPos);
      yPos += 5;
    }
    
    // ITEMS SECTION
    yPos += 10;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Items', margin, yPos);
    yPos += 7;
    
    // Add items table with clean styling
    const columns = ['Item', 'Description', 'Quantity', 'Price', 'Total'];
    
    const tableRows = documentData.items.map(item => [
      item.name,
      item.description || '',
      item.quantity,
      formatCurrency(item.price),
      formatCurrency(item.subtotal)
    ]);
    
    pdf.autoTable({
      startY: yPos,
      head: [columns],
      body: tableRows,
      theme: 'plain',
      headStyles: {
        fillColor: [90, 192, 90],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        lineWidth: 0.4,
        lineColor: [20, 100, 220],
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });
    
    // Continue positioning after the table
    yPos = pdf.lastAutoTable.finalY + 10;
    
    // TOTALS SECTION - right aligned
    const totalsX = pdf.internal.pageSize.width - margin - 80; // Right-aligned
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    pdf.text('Subtotal:', totalsX, yPos);
    pdf.text(formatCurrency(documentData.subtotal), totalsX + 60, yPos, { align: 'right' });
    yPos += 5;
    
    if (documentData.tax > 0) {
      pdf.text(`Tax:`, totalsX, yPos);
      const taxAmount = documentData.subtotal * (documentData.tax / 100);
      pdf.text(formatCurrency(taxAmount), totalsX + 60, yPos, { align: 'right' });
      yPos += 5;
    }
    
    if (documentData.discount > 0) {
      pdf.text('Discount:', totalsX, yPos);
      pdf.text(formatCurrency(documentData.discount), totalsX + 60, yPos, { align: 'right' });
      yPos += 5;
    }
    
    // Total - bold
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total:', totalsX, yPos);
    pdf.text(formatCurrency(documentData.total), totalsX + 60, yPos, { align: 'right' });
    yPos += 10;
    
    // NOTES SECTION
    yPos += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Notes', margin, yPos);
    yPos += 7;
    
    if (documentData.notes) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const noteLines = pdf.splitTextToSize(documentData.notes, pdf.internal.pageSize.width - (margin * 2));
      pdf.text(noteLines, margin, yPos);
    } else {
      // Add placeholder if no notes
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('N/A', margin, yPos);
    }
    
    // Generate filename
    const filename = `${documentType.toLowerCase()}_${documentData.number.replace(/[^\w]/g, '_')}.pdf`;
    
    // Download or return the PDF
    if (download) {
      pdf.save(filename);
      return null;
    } else {
      return pdf;
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate PDF');
    return null;
  }
};

/**
 * Creates a PDF from currently edited document data (not from saved history)
 * @param {Object} documentData - The current document data to create PDF from
 * @param {string} logoDataUrl - Optional logo data URL to include in the PDF
 * @returns {Promise<{pdf: jsPDF, filename: string}>} PDF object and suggested filename
 */
export const generatePdfFromData = async (documentData, logoDataUrl = null) => {
  try {
    // Create PDF document (A4 size)
    const pdf = new jsPDF();
    
    // Set default font
    pdf.setFont('helvetica');
    
    // Get currency symbol
    const currencyMap = {
      'USD ($)': '$',
      'EUR (€)': '€',
      'GBP (£)': '£'
    };
    const currencySymbol = currencyMap[documentData.currency] || '$';
    
    // Format currency
    const formatCurrency = (amount) => {
      return `${currencySymbol}${parseFloat(amount).toFixed(2)}`;
    };
    
    // Set page margins
    const margin = 20;
    let yPos = margin;
    
    // HEADER SECTION
    // Company name (left side)
    if (documentData.companyName) {
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(documentData.companyName, margin, yPos);
      yPos += 5;
    }
    
    // Company info (left side)
    if (documentData.fromInfo) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const fromLines = documentData.fromInfo.split('\n');
      fromLines.forEach(line => {
        pdf.text(line, margin, yPos);
        yPos += 4;
      });
    }
    
    // Reset yPos for logo placement on right side
    yPos = margin;
    
    // Add logo on right side if available
    if (logoDataUrl) {
      try {
        // Position logo in top right corner
        pdf.addImage(logoDataUrl, 'JPEG', pdf.internal.pageSize.width - margin - 50, yPos, 50, 25);
      } catch (e) {
        console.error('Error adding logo to PDF:', e);
        // Continue without logo
      }
    }
    
    // Move to document type section
    yPos = margin + 35;
    
    // Document Type Heading
    let documentType = documentData.type.charAt(0).toUpperCase() + documentData.type.slice(1);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(documentType.toUpperCase(), margin, yPos);
    yPos += 10;
    
    // Format dates
    const formatDate = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };
    
    // Document details - left side
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Number: ${documentData.number}`, margin, yPos);
    yPos += 5;
    pdf.text(`Date: ${formatDate(documentData.date)}`, margin, yPos);
    
    // Document details - right side
    if (documentData.dueDate) {
      pdf.text(`Date: ${formatDate(documentData.dueDate)}`, pdf.internal.pageSize.width - margin - 50, yPos);
    }
    
    // CLIENT SECTION
    yPos += 15;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Client Information', margin, yPos);
    yPos += 7;
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    if (documentData.client.name) {
      pdf.text(`Name: ${documentData.client.name}`, margin, yPos);
      yPos += 5;
    }
    
    if (documentData.client.address) {
      pdf.text(`Address: ${documentData.client.address}`, margin, yPos);
      yPos += 5;
    }
    
    if (documentData.client.email) {
      pdf.text(`Email: ${documentData.client.email}`, margin, yPos);
      yPos += 5;
    }
    
    if (documentData.client.phone) {
      pdf.text(`Phone: ${documentData.client.phone}`, margin, yPos);
      yPos += 5;
    }
    
    // ITEMS SECTION
    yPos += 10;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Items', margin, yPos);
    yPos += 7;
    
    // Add items table with clean styling
    const columns = ['Item', 'Description', 'Quantity', 'Price', 'Total'];
    
    const tableRows = documentData.items.map(item => [
      item.name,
      item.description || '',
      item.quantity,
      formatCurrency(item.price),
      formatCurrency(item.subtotal)
    ]);
    
    pdf.autoTable({
      startY: yPos,
      head: [columns],
      body: tableRows,
      theme: 'plain',
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        lineWidth: 0.1,
        lineColor: [220, 220, 220],
        fontSize: 9
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });
    
    // Continue positioning after the table
    yPos = pdf.lastAutoTable.finalY + 10;
    
    // TOTALS SECTION - right aligned
    const totalsX = pdf.internal.pageSize.width - margin - 80; // Right-aligned
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    pdf.text('Subtotal:', totalsX, yPos);
    pdf.text(formatCurrency(documentData.subtotal), totalsX + 60, yPos, { align: 'right' });
    yPos += 5;
    
    if (documentData.tax > 0) {
      pdf.text(`Tax:`, totalsX, yPos);
      const taxAmount = documentData.subtotal * (documentData.tax / 100);
      pdf.text(formatCurrency(taxAmount), totalsX + 60, yPos, { align: 'right' });
      yPos += 5;
    }
    
    if (documentData.discount > 0) {
      pdf.text('Discount:', totalsX, yPos);
      pdf.text(formatCurrency(documentData.discount), totalsX + 60, yPos, { align: 'right' });
      yPos += 5;
    }
    
    // Total - bold
    pdf.setFont('helvetica', 'bold');
    pdf.text('Total:', totalsX, yPos);
    pdf.text(formatCurrency(documentData.total), totalsX + 60, yPos, { align: 'right' });
    yPos += 10;
    
    // NOTES SECTION
    yPos += 5;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('Notes', margin, yPos);
    yPos += 7;
    
    if (documentData.notes) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const noteLines = pdf.splitTextToSize(documentData.notes, pdf.internal.pageSize.width - (margin * 2));
      pdf.text(noteLines, margin, yPos);
    } else {
      // Add placeholder if no notes
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.text('N/A', margin, yPos);
    }
    
    // Generate filename
    const filename = `${documentType.toLowerCase()}_${documentData.number.replace(/[^\w]/g, '_')}.pdf`;
    
    return { pdf, filename };
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to generate PDF');
    throw error;
  }
};

export default { generatePdfFromLocalStorage, generatePdfFromData }; 