import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import DocumentContext, { DocumentProvider } from '../context/DocumentContext';
import { generateLocalPdf } from '../utils/LocalPdfGenerator';
import './ClassicForm.css';
import { v4 as uuidv4 } from 'uuid'; // Import uuid for generating unique IDs
import axios from 'axios';

// Define the default state structure outside the component
const getDefaultFormState = () => ({
  id: uuidv4(), // Generate a unique ID for new documents
  type: 'invoice',
  invoiceNumber: '1',
  companyName: '',
  issueDate: new Date().toISOString().split('T')[0], // Set today as default
  paymentTerms: '',
  dueDate: '',
  poNumber: '',
  fromInfo: '',
  billTo: '',
  shipTo: '',
  items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
  notes: '',
  terms: '',
  subtotal: 0,
  tax: 0,
  discount: 0,
  shipping: 0,
  total: 0,
  amountPaid: 0,
  balanceDue: 0,
  currency: 'USD ($)',
  createdAt: new Date().toISOString()
});

const ClassicFormContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { generatePdfUrl, createDocument } = useContext(DocumentContext);
  const fileInput = useRef(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  
  // Initialize state with a function to prevent stale closures
  const [documentData, setDocumentData] = useState(() => {
    try {
      // First check if we're editing a specific doc from URL
      const searchParams = new URLSearchParams(location.search);
      const documentId = searchParams.get('id');
      
      if (documentId) {
        // Load from history if we have an ID
        const savedDocuments = JSON.parse(localStorage.getItem('invoiceDocuments') || '[]');
        const documentToEdit = savedDocuments.find(doc => doc.id === documentId);
        
        if (documentToEdit) {
          console.log("Initial load - from history:", documentToEdit);
          return documentToEdit;
        }
      }
      
      // Then try to load from localStorage
      const savedData = localStorage.getItem('invoiceFormData');
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        console.log("Initial load - from localStorage:", parsedData);
        
        // Ensure we have an ID and createdAt
        if (!parsedData.id) parsedData.id = uuidv4();
        if (!parsedData.createdAt) parsedData.createdAt = new Date().toISOString();
        
        return {
          ...getDefaultFormState(), // Start with default values
          ...parsedData           // Override with saved values
        };
      }
      
      // Finally use the default state if nothing else is available
      console.log("Initial load - using defaults");
      const defaultState = getDefaultFormState();
      localStorage.setItem('invoiceFormData', JSON.stringify(defaultState));
      return defaultState;
    } catch (error) {
      console.error("Error in initial state loading:", error);
      const defaultState = getDefaultFormState();
      localStorage.setItem('invoiceFormData', JSON.stringify(defaultState));
      return defaultState;
    }
  });

  // Initialize logo from localStorage
  useEffect(() => {
    try {
      // Try to load logo for this specific document first
      if (documentData.id) {
        const logoKey = `invoiceLogoPreview_${documentData.id}`;
        const savedLogo = localStorage.getItem(logoKey);
        if (savedLogo) {
          setLogoPreview(savedLogo);
          return;
        }
      }
      
      // Otherwise try the general logo
      const savedLogo = localStorage.getItem('invoiceLogoPreview');
      if (savedLogo) {
        setLogoPreview(savedLogo);
      }
    } catch (error) {
      console.error("Error loading logo:", error);
    }
    
    // Update UI states based on data
    setShowDiscount(documentData.discount > 0);
    setShowShipping(documentData.shipping > 0);
  }, [documentData.id]);  // Only run when document ID changes
  
  // Handle URL parameter changes (loading specific documents)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const documentId = searchParams.get('id');
    
    if (documentId && documentId !== documentData.id) {
      console.log("URL changed, loading document:", documentId);
      // Load specific document from history
      const savedDocuments = JSON.parse(localStorage.getItem('invoiceDocuments') || '[]');
      const documentToEdit = savedDocuments.find(doc => doc.id === documentId);
      
      if (documentToEdit) {
        console.log("Found document in history:", documentToEdit);
        setDocumentData(documentToEdit);
        setShowDiscount(documentToEdit.discount > 0);
        setShowShipping(documentToEdit.shipping > 0);
        
        // Also load the logo if it exists
        const logoKey = `invoiceLogoPreview_${documentId}`;
        const savedLogo = localStorage.getItem(logoKey);
        if (savedLogo) {
          setLogoPreview(savedLogo);
        }
        
        // Save this as the current working document
        localStorage.setItem('invoiceFormData', JSON.stringify(documentToEdit));
        
        toast.success('Document loaded from history');
      }
    }
  }, [location.search, documentData.id]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (documentData && Object.keys(documentData).length > 0) {
      console.log("Saving to localStorage:", documentData);
      try {
        localStorage.setItem('invoiceFormData', JSON.stringify(documentData));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        toast.error('Failed to save your work locally');
      }
    }
  }, [documentData]);
  
  // Save logo to localStorage when it changes
  useEffect(() => {
    if (logoPreview && documentData.id) {
      try {
        // Save the general logo
        localStorage.setItem('invoiceLogoPreview', logoPreview);
        
        // Also save logo for this specific document
        localStorage.setItem(`invoiceLogoPreview_${documentData.id}`, logoPreview);
      } catch (storageError) {
        console.error('Storage quota exceeded for logo:', storageError);
        // Continue without saving the logo
      }
    }
  }, [logoPreview, documentData.id]);
  
  // Compress image data URL to reduce size
  const compressImage = (dataUrl, quality = 0.6, maxWidth = 600) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to compressed JPEG format
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  };
  
  // Handle logo file selection
  const handleLogoChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const dataUrl = e.target.result;
          
          // Compress the image before storing
          const compressedDataUrl = await compressImage(dataUrl);
          
          setLogoPreview(compressedDataUrl);
          
          try {
            localStorage.setItem('invoiceLogoPreview', compressedDataUrl);
            
            // Also save with document ID if we're editing a specific one
            if (documentData.id) {
              localStorage.setItem(`invoiceLogoPreview_${documentData.id}`, compressedDataUrl);
            }
          } catch (storageError) {
            console.error('Storage quota exceeded:', storageError);
            toast.error('Unable to save logo due to storage limitations. Try using a smaller image.');
          }
        } catch (compressionError) {
          console.error('Error compressing image:', compressionError);
          toast.error('Error processing image');
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDocumentData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Calculate item amount
  const calculateItemAmount = (item) => {
    return (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
  };
  
  // Handle item input changes
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...documentData.items];
    updatedItems[index] = { 
      ...updatedItems[index], 
      [field]: value,
      amount: field === 'quantity' || field === 'rate' 
        ? calculateItemAmount({...updatedItems[index], [field]: value})
        : updatedItems[index].amount
    };
    
    // Recalculate totals
    const subtotal = updatedItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const taxValue = subtotal * (parseFloat(documentData.tax) || 0) / 100;
    const discountValue = parseFloat(documentData.discount) || 0;
    const shippingValue = parseFloat(documentData.shipping) || 0;
    const total = subtotal + taxValue - discountValue + shippingValue;
    const amountPaid = parseFloat(documentData.amountPaid) || 0;
    
    setDocumentData(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      total,
      balanceDue: total - amountPaid
    }));
  };
  
  // Add a new item
  const addItem = () => {
    setDocumentData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, rate: 0, amount: 0 }]
    }));
  };
  
  // Remove an item
  const removeItem = (index) => {
    const updatedItems = documentData.items.filter((_, i) => i !== index);
    const subtotal = updatedItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const taxValue = subtotal * (parseFloat(documentData.tax) || 0) / 100;
    const discountValue = parseFloat(documentData.discount) || 0;
    const shippingValue = parseFloat(documentData.shipping) || 0;
    const total = subtotal + taxValue - discountValue + shippingValue;
    const amountPaid = parseFloat(documentData.amountPaid) || 0;
    
    setDocumentData(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      total,
      balanceDue: total - amountPaid
    }));
  };
  
  // Handle tax, discount, shipping, or amount paid changes
  const handleCalculationChange = (e) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;
    
    const subtotal = documentData.subtotal;
    let taxValue = documentData.tax;
    let discountValue = documentData.discount;
    let shippingValue = documentData.shipping;
    let amountPaid = documentData.amountPaid;
    
    if (name === 'tax') taxValue = numValue;
    if (name === 'discount') discountValue = numValue;
    if (name === 'shipping') shippingValue = numValue;
    if (name === 'amountPaid') amountPaid = numValue;
    
    const taxAmount = subtotal * (taxValue / 100);
    const total = subtotal + taxAmount - discountValue + shippingValue;
    
    setDocumentData(prev => ({
      ...prev,
      [name]: numValue,
      total,
      balanceDue: total - amountPaid
    }));
  };
  
  // Toggle discount field
  const toggleDiscount = () => {
    setShowDiscount(!showDiscount);
    if (!showDiscount) {
      // Reset discount value when showing the field
      setDocumentData(prev => ({
        ...prev,
        discount: 0
      }));
    }
  };
  
  // Toggle shipping field
  const toggleShipping = () => {
    setShowShipping(!showShipping);
    if (!showShipping) {
      // Reset shipping value when showing the field
      setDocumentData(prev => ({
        ...prev,
        shipping: 0
      }));
    }
  };
  
  // Handle currency change
  const handleCurrencyChange = (e) => {
    setDocumentData(prev => ({
      ...prev,
      currency: e.target.value
    }));
  };
  
  // Get currency symbol
  const getCurrencySymbol = () => {
    const currencyMap = {
      'USD ($)': '$',
      'EUR (€)': '€',
      'GBP (£)': '£'
    };
    return currencyMap[documentData.currency] || '$';
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    const symbol = getCurrencySymbol();
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
  };
  
  // Save default settings
  const saveDefault = () => {
    localStorage.setItem('invoiceDefaults', JSON.stringify({
      currency: documentData.currency,
      terms: documentData.terms,
      tax: documentData.tax
    }));
    toast.success('Default settings saved');
  };
  
  // Clear form data
  const clearForm = () => {
    // Generate a new ID for the cleared form
    const newId = uuidv4();
    const newDefaultState = {
      ...getDefaultFormState(),
      id: newId,
      createdAt: new Date().toISOString()
    };
    
    setDocumentData(newDefaultState);
    setShowDiscount(false);
    setShowShipping(false);
    setLogoPreview(null);
    
    // Clear stored data
    localStorage.setItem('invoiceFormData', JSON.stringify(newDefaultState));
    localStorage.removeItem('invoiceLogoPreview');
    
    toast.success('Form cleared');
  };
  
  // Save document to local history
  const saveToHistory = () => {
    try {
      // Get existing documents from localStorage
      const savedDocuments = JSON.parse(localStorage.getItem('invoiceDocuments') || '[]');
      
      // Check if this document already exists in history
      const existingIndex = savedDocuments.findIndex(doc => doc.id === documentData.id);
      
      // Update the document data
      const updatedDocument = {
        ...documentData,
        updatedAt: new Date().toISOString()
      };
      
      // Either update existing or add new
      if (existingIndex >= 0) {
        savedDocuments[existingIndex] = updatedDocument;
      } else {
        savedDocuments.push(updatedDocument);
      }
      
      // Limit history size to prevent storage issues
      if (savedDocuments.length > 20) {
        // Keep only the 20 most recent documents
        savedDocuments.sort((a, b) => {
          const dateA = a.updatedAt || a.createdAt;
          const dateB = b.updatedAt || b.createdAt;
          return new Date(dateB) - new Date(dateA);
        });
        savedDocuments.splice(20);
      }
      
      // Save back to localStorage
      localStorage.setItem('invoiceDocuments', JSON.stringify(savedDocuments));
      
      // Also save the logo if it exists
      if (logoPreview) {
        try {
          localStorage.setItem(`invoiceLogoPreview_${documentData.id}`, logoPreview);
        } catch (storageError) {
          console.error('Storage quota exceeded for logo:', storageError);
          // Continue without saving the logo
          toast.warning('Logo was not saved due to storage limitations');
        }
      }
      
      toast.success('Document saved to history');
      return true;
    } catch (error) {
      console.error('Error saving document to history:', error);
      toast.error('Failed to save document');
      return false;
    }
  };
  
  /**
   * Generates and downloads a PDF of the current document
   * Uses the LocalPdfGenerator utility to create a professional PDF
   * from the document data stored in localStorage
   */
  const handleDownload = async () => {
    try {
      // First ensure the document is saved to localStorage history
      const saved = saveToHistory();
      if (!saved) {
        toast.error('Please save the invoice first');
        return;
      }
      
      // Generate PDF using our local PDF generator utility
      // This creates a PDF directly from localStorage data without server interaction
      const pdf = await generateLocalPdf(documentData.id);
      
      // Create a meaningful filename with document type and number
      const filename = `${documentData.type}_${documentData.invoiceNumber}.pdf`;
      
      // Trigger the PDF download with the generated filename
      pdf.save(filename);
      
      // Show success message to the user
      toast.success('PDF downloaded successfully');
    } catch (error) {
      // Log the error for debugging
      console.error('Error generating PDF:', error);
      
      // Show error message to user
      toast.error('Failed to generate PDF: ' + error.message);
      
      // Fall back to opening the preview page if PDF generation fails
      window.open(`/document-preview?id=${documentData.id}`, '_blank');
    }
  };
  
  // Handle create invoice button (just save to history)
  const handleCreateInvoice = () => {
    if (saveToHistory()) {
      toast.success('Invoice created successfully');
      // Redirect to document history
      navigate('/documents');
    }
  };
  
  return (
    <div className="classic-form-container">
      <div className="invoice-form">
        <div className="invoice-header">
          {/* Left side - Logo upload */}
          <div className="logo-section">
            <div className="logo-upload" onClick={() => fileInput.current.click()}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Company Logo" />
                ) : (
                <div className="logo-placeholder">+ Add Your Logo</div>
                )}
                <input 
                  type="file" 
                  ref={fileInput}
                  onChange={handleLogoChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
            <div className="company-name-input">
                <input 
                  type="text" 
                  name="companyName"
                  value={documentData.companyName}
                  onChange={handleInputChange}
                placeholder="Who is this from? (Company Name)"
                className="company-name-field"
                />
            </div>
          </div>
          
          {/* Right side - Invoice title and number */}
          <div className="invoice-title-section">
            <h1>INVOICE</h1>
            <div className="invoice-number">
              <label htmlFor="invoiceNumber">#</label>
                  <input 
                    type="text" 
                id="invoiceNumber"
                name="invoiceNumber"
                value={documentData.invoiceNumber}
                    onChange={handleInputChange}
                  />
            </div>
          </div>
                </div>
                
        <div className="invoice-body">
          <div className="invoice-details">
            <div className="invoice-detail-row">
              <div className="invoice-detail-label">Date</div>
              <div className="invoice-detail-value">
                  <input 
                    type="date" 
                    name="issueDate"
                    value={documentData.issueDate}
                    onChange={handleInputChange}
                  placeholder="Invoice date"
                  className="date-input"
                />
              </div>
            </div>
            
            <div className="invoice-detail-row">
              <div className="invoice-detail-label">Payment Terms</div>
              <div className="invoice-detail-value">
                <input 
                  type="text" 
                  name="paymentTerms"
                  value={documentData.paymentTerms}
                  onChange={handleInputChange}
                  placeholder="e.g. Due on receipt, Net 30"
                  className="small-width-input"
                />
              </div>
                </div>
                
            <div className="invoice-detail-row">
              <div className="invoice-detail-label">Due Date</div>
              <div className="invoice-detail-value">
                  <input 
                    type="date" 
                    name="dueDate"
                    value={documentData.dueDate}
                    onChange={handleInputChange}
                  placeholder="Payment due date"
                  className="date-input"
                  />
              </div>
            </div>
            
            <div className="invoice-detail-row">
              <div className="invoice-detail-label">PO Number</div>
              <div className="invoice-detail-value">
                  <input 
                    type="text" 
                  name="poNumber"
                  value={documentData.poNumber}
                  onChange={handleInputChange}
                  placeholder="Purchase order number (if any)"
                  className="small-width-input"
                />
              </div>
            </div>
          </div>
          
          <div className="invoice-parties">
            <div className="invoice-from">
              <div className="party-label">Bill To</div>
              <textarea 
                name="billTo"
                value={documentData.billTo}
                onChange={handleInputChange}
                className="party-textarea"
                placeholder="Who is this to?"
              />
            </div>
            
            <div className="invoice-to">
              <div className="party-label">Ship To</div>
              <textarea 
                name="shipTo"
                value={documentData.shipTo}
                    onChange={handleInputChange}
                className="party-textarea"
                placeholder="(optional)"
              />
            </div>
          </div>
          
          <div className="invoice-items">
            <div className="invoice-items-header">
              <div className="item-col item-description">Item</div>
              <div className="item-col item-quantity">Quantity</div>
              <div className="item-col item-rate">Rate</div>
              <div className="item-col item-amount">Amount</div>
            </div>
            
            {documentData.items.map((item, index) => (
              <div className="invoice-item-row" key={index}>
                <div className="item-col item-description">
                  <textarea
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Description of item/service..."
                  />
                </div>
                <div className="item-col item-quantity">
                  <input 
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  />
                </div>
                <div className="item-col item-rate">
                  <div className="currency-input">
                    <span>{getCurrencySymbol()}</span>
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                    />
                  </div>
                </div>
                <div className="item-col item-amount item-actions">
                  {formatCurrency(item.amount)}
                  {documentData.items.length > 1 && (
                    <button 
                      type="button" 
                      className="remove-item-btn" 
                      onClick={() => removeItem(index)}
                      aria-label="Remove item"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <div className="add-item-row">
              <button type="button" className="add-item-btn" onClick={addItem}>
                + Line Item
              </button>
            </div>
          </div>
          
          <div className="invoice-notes-terms">
            <div className="notes-section">
              <div className="section-label">Notes</div>
              <textarea 
                name="notes"
                value={documentData.notes}
                    onChange={handleInputChange}
                className="notes-textarea"
                placeholder="Notes - any relevant information not already covered"
                  />
                </div>
            
            <div className="terms-section">
              <div className="section-label">Terms</div>
              <textarea 
                name="terms"
                value={documentData.terms}
                onChange={handleInputChange}
                className="terms-textarea"
                placeholder="Terms and conditions - late fees, payment methods, delivery schedule"
              />
            </div>
          </div>
          
          <div className="invoice-totals">
            <div className="totals-rows">
              <div className="total-row">
                <div className="total-label">Subtotal</div>
                <div className="total-value">{formatCurrency(documentData.subtotal)}</div>
              </div>
              
              <div className="total-row tax-row">
                <div className="total-label">
                  Tax
                        <input 
                          type="number" 
                    name="tax"
                    value={documentData.tax}
                    onChange={handleCalculationChange}
                    className="tax-input"
                  />
                  <span>%</span>
                </div>
                <div className="total-value">
                  {formatCurrency(documentData.subtotal * (documentData.tax / 100))}
                </div>
              </div>
              
              {showDiscount ? (
                <div className="total-row discount-row">
                  <div className="total-label">
                    Discount
                    <div className="discount-input-container">
                      <span>{getCurrencySymbol()}</span>
                        <input 
                          type="number" 
                        name="discount"
                        value={documentData.discount}
                        onChange={handleCalculationChange}
                        className="discount-input"
                      />
                        <button 
                          type="button" 
                        className="remove-field-btn" 
                        onClick={toggleDiscount}
                        aria-label="Remove discount"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="total-value">
                    -{formatCurrency(documentData.discount)}
                  </div>
                </div>
              ) : (
                <div className="total-row">
                  <div className="total-label">
                    <button type="button" className="add-discount-btn" onClick={toggleDiscount}>
                      + Discount
                        </button>
                  </div>
                  <div className="total-value"></div>
                </div>
              )}
              
              {showShipping ? (
                <div className="total-row shipping-row">
                  <div className="total-label">
                    Shipping
                    <div className="shipping-input-container">
                      <span>{getCurrencySymbol()}</span>
                      <input
                        type="number"
                        name="shipping"
                        value={documentData.shipping}
                        onChange={handleCalculationChange}
                        className="shipping-input"
                      />
                      <button 
                        type="button" 
                        className="remove-field-btn" 
                        onClick={toggleShipping}
                        aria-label="Remove shipping"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="total-value">
                    {formatCurrency(documentData.shipping)}
            </div>
                </div>
              ) : (
                <div className="total-row">
                  <div className="total-label">
                    <button type="button" className="add-shipping-btn" onClick={toggleShipping}>
                      + Shipping
                    </button>
                  </div>
                  <div className="total-value"></div>
                </div>
              )}
              
              <div className="total-row grand-total">
                <div className="total-label">Total</div>
                <div className="total-value">{formatCurrency(documentData.total)}</div>
          </div>
          
              <div className="total-row">
                <div className="total-label">Amount Paid</div>
                <div className="total-value">
                  <div className="currency-input amount-paid">
                    <span>{getCurrencySymbol()}</span>
                    <input
                      type="number"
                      name="amountPaid"
                      value={documentData.amountPaid}
                      onChange={handleCalculationChange}
                    />
                  </div>
                </div>
              </div>
              
              <div className="total-row balance-due">
                <div className="total-label">Balance Due</div>
                <div className="total-value">{formatCurrency(documentData.balanceDue)}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="invoice-sidebar">
          <button type="button" className="download-btn" onClick={handleDownload}>
            ↓ Download
          </button>
          
          <div className="currency-selector">
            <label>Currency</label>
            <select 
              value={documentData.currency} 
              onChange={handleCurrencyChange}
              className="currency-select"
            >
              <option value="USD ($)">USD ($)</option>
              <option value="EUR (€)">EUR (€)</option>
              <option value="GBP (£)">GBP (£)</option>
            </select>
          </div>
          
          <button type="button" className="save-default-btn" onClick={saveDefault}>
            Save Default
          </button>
          
          <button type="button" className="create-invoice-btn" onClick={handleCreateInvoice}>
            Create Invoice
          </button>
          
          <button type="button" className="clear-form-btn" onClick={clearForm}>
            Clear Form
          </button>
          
          <Link to="/documents" className="history-btn">
            Document History
          </Link>
        </div>
      </div>
    </div>
  );
};

// Wrap the export with DocumentProvider
const ClassicForm = () => (
  <DocumentProvider>
    <ClassicFormContent />
  </DocumentProvider>
);

export default ClassicForm; 