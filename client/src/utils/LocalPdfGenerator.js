import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Generate PDF from localStorage document data
export const generateLocalPdf = async (documentId) => {
  try {
    // Load document from localStorage
    const savedDocuments = JSON.parse(localStorage.getItem('invoiceDocuments') || '[]');
    const document = savedDocuments.find(doc => doc.id === documentId);
    
    if (!document) {
      throw new Error('Document not found in localStorage');
    }
    
    // Load logo if exists
    const logoDataUrl = localStorage.getItem(`invoiceLogoPreview_${documentId}`);
    
    // Create new PDF document - use plain constructor for jsPDF
    const pdf = new jsPDF();
    
    // Set up styling constants
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    const col1 = margin;
    const col2 = pageWidth - margin;
    
    // Add logo if available
    let currentY = margin;
    if (logoDataUrl) {
      try {
        // Add logo in top right
        pdf.addImage(logoDataUrl, 'JPEG', pageWidth - 60, margin, 40, 20);
      } catch (logoError) {
        console.error('Error adding logo to PDF:', logoError);
      }
    }
    
    // Add business info on left
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text(document.companyName || 'Your Business Name', col1, currentY);
    
    // Add business details if available
    currentY += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    if (document.fromInfo) {
      const fromLines = document.fromInfo.split('\\n');
      fromLines.forEach(line => {
        pdf.text(line, col1, currentY);
        currentY += 5;
      });
    }
    
    // Add INVOICE text
    currentY = margin + 30;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(24);
    pdf.text('INVOICE', col1, currentY);
    
    // Add invoice number and dates
    currentY += 10;
    pdf.setFontSize(11);
    pdf.text(`Number: ${document.invoiceNumber}`, col1, currentY);
    
    currentY += 6;
    pdf.text(`Date: ${formatDate(document.issueDate)}`, col1, currentY);
    
    if (document.dueDate) {
      currentY += 6;
      pdf.text(`Due Date: ${formatDate(document.dueDate)}`, col1, currentY);
    }
    
    // Add Client Information section
    currentY += 15;
    pdf.setFontSize(14);
    pdf.text('Client Information', col1, currentY);
    
    currentY += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    
    if (document.billTo) {
      const clientLines = document.billTo.split('\\n');
      pdf.text(`Name: ${clientLines[0] || ''}`, col1, currentY);
      
      // Add address on next lines if available
      if (clientLines.length > 1) {
        currentY += 6;
        pdf.text(`Address: ${clientLines.slice(1).join(', ')}`, col1, currentY);
      }
    }
    
    // Add Items table header
    currentY += 15;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(14);
    pdf.text('Items', col1, currentY);
    
    // Create items table
    currentY += 5;
    const tableColumns = [
      { header: 'Item', dataKey: 'description' },
      { header: 'Description', dataKey: 'description' },
      { header: 'Quantity', dataKey: 'quantity' },
      { header: 'Price', dataKey: 'rate' },
      { header: 'Total', dataKey: 'amount' }
    ];
    
    const tableRows = document.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      rate: formatCurrency(item.rate, document.currency),
      amount: formatCurrency(item.amount, document.currency)
    }));
    
    // Draw the items table
    pdf.autoTable({
      startY: currentY,
      head: [['Item', 'Description', 'Quantity', 'Price', 'Total']],
      body: tableRows.map(row => [
        row.description,
        row.description,
        row.quantity,
        row.rate,
        row.amount
      ]),
      theme: 'grid',
      headStyles: { 
        fillColor: [80, 80, 80],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 20, halign: 'center' },
        3: { cellWidth: 30, halign: 'right' },
        4: { cellWidth: 30, halign: 'right' }
      },
      margin: { left: margin, right: margin }
    });
    
    // Add totals section
    currentY = pdf.lastAutoTable.finalY + 10;
    
    // Function to add total row
    const addTotalRow = (label, value, isBold = false) => {
      if (isBold) {
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFont('helvetica', 'normal');
      }
      
      pdf.text(label, pageWidth - 70, currentY);
      pdf.text(value, pageWidth - margin, currentY, { align: 'right' });
      currentY += 6;
    };
    
    // Subtotal
    addTotalRow('Subtotal:', formatCurrency(document.subtotal, document.currency));
    
    // Tax (if present)
    if (document.tax > 0) {
      const taxAmount = document.subtotal * (document.tax / 100);
      addTotalRow('Tax:', formatCurrency(taxAmount, document.currency));
    }
    
    // Discount (if present)
    if (document.discount > 0) {
      addTotalRow('Discount:', `-${formatCurrency(document.discount, document.currency)}`);
    }
    
    // Shipping (if present)
    if (document.shipping > 0) {
      addTotalRow('Shipping:', formatCurrency(document.shipping, document.currency));
    }
    
    // Total
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.5);
    pdf.line(pageWidth - 70, currentY - 2, pageWidth - margin, currentY - 2);
    addTotalRow('Total:', formatCurrency(document.total, document.currency), true);
    
    // Amount paid (if present)
    if (document.amountPaid > 0) {
      addTotalRow('Amount Paid:', formatCurrency(document.amountPaid, document.currency));
    }
    
    // Balance due
    if (document.balanceDue > 0) {
      pdf.setTextColor(231, 76, 60); // Red for balance due
      addTotalRow('Balance Due:', formatCurrency(document.balanceDue, document.currency), true);
      pdf.setTextColor(0); // Reset text color
    }
    
    // Notes section (if present)
    if (document.notes) {
      currentY += 5;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Notes', col1, currentY);
      
      currentY += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const notesLines = pdf.splitTextToSize(document.notes, pageWidth - (margin * 2));
      pdf.text(notesLines, col1, currentY);
      currentY += (notesLines.length * 5) + 5;
    }
    
    // Terms section (if present)
    if (document.terms) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Terms and Conditions', col1, currentY);
      
      currentY += 6;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const termsLines = pdf.splitTextToSize(document.terms, pageWidth - (margin * 2));
      pdf.text(termsLines, col1, currentY);
    }
    
    // Return the PDF document
    return pdf;
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

// Helper function to format currency
function formatCurrency(amount, currencyType = 'USD ($)') {
  const currencyMap = {
    'USD ($)': '$',
    'EUR (€)': '€',
    'GBP (£)': '£'
  };
  const symbol = currencyMap[currencyType] || '$';
  return `${symbol}${parseFloat(amount).toFixed(2)}`;
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString();
} 