/**
 * LocalDocumentForm.js
 * 
 * PURPOSE:
 * This component provides a document form that persists data in localStorage
 * rather than sending it to the server. It includes all the features of 
 * DocumentForm but adds logo upload, sender information, and currency selection.
 * 
 * IMPORTANCE:
 * - Allows completely offline form usage with localStorage persistence
 * - Provides consistent experience with the ClassicForm
 * - Supports PDF generation without server-side storage
 * - Auto-saves work to prevent data loss
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import './DocumentForm.css';

// Define default state structure
const getDefaultFormState = () => ({
  id: uuidv4(), // Generate a unique ID for new documents
  type: 'invoice',
  number: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  companyName: '',
  fromInfo: '',
  client: {
    name: '',
    email: '',
    phone: '',
    address: ''
  },
  items: [
    {
      name: '',
      description: '',
      quantity: 1,
      price: 0,
      tax: 0,
      subtotal: 0
    }
  ],
  subtotal: 0,
  tax: 0,
  discount: 0,
  shipping: 0,
  total: 0,
  amountPaid: 0,
  balanceDue: 0,
  currency: 'USD ($)',
  notes: '',
  terms: '',
  createdAt: new Date().toISOString()
});

const currencies = [
  { value: 'USD ($)', label: 'USD ($)' },
  { value: 'EUR (€)', label: 'EUR (€)' },
  { value: 'GBP (£)', label: 'GBP (£)' }
];

const LocalDocumentForm = ({ onDocumentUpdated }) => {
  const [formData, setFormData] = useState(() => {
    try {
      // Try to load existing form data from localStorage
      const savedData = localStorage.getItem('homeFormData');
      if (savedData) {
        return JSON.parse(savedData);
      }
      return getDefaultFormState();
    } catch (error) {
      console.error('Error loading form data from localStorage:', error);
      return getDefaultFormState();
    }
  });
  
  // State for logo and UI elements
  const [logoPreview, setLogoPreview] = useState(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const fileInput = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Load logo on mount
  useEffect(() => {
    try {
      // Try to load logo for this specific document first
      if (formData.id) {
        const logoKey = `homeLogoPreview_${formData.id}`;
        const savedLogo = localStorage.getItem(logoKey);
        if (savedLogo) {
          setLogoPreview(savedLogo);
          return;
        }
      }
      
      // Otherwise try the general logo
      const savedLogo = localStorage.getItem('homeLogoPreview');
      if (savedLogo) {
        setLogoPreview(savedLogo);
      }
    } catch (error) {
      console.error("Error loading logo:", error);
    }
    
    // Set UI states based on existing data
    setShowDiscount(formData.discount > 0);
    setShowShipping(formData.shipping > 0);
  }, [formData.id]);
  
  // Handle URL parameter changes (loading specific documents)
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const documentId = searchParams.get('id');
    
    if (documentId && documentId !== formData.id) {
      console.log("URL changed, loading document:", documentId);
      // Load specific document from history
      const savedDocuments = JSON.parse(localStorage.getItem('homeDocuments') || '[]');
      const documentToEdit = savedDocuments.find(doc => doc.id === documentId);
      
      if (documentToEdit) {
        console.log("Found document in history:", documentToEdit);
        setFormData(documentToEdit);
        setShowDiscount(documentToEdit.discount > 0);
        setShowShipping(documentToEdit.shipping > 0);
        
        // Also load the logo if it exists
        const logoKey = `homeLogoPreview_${documentId}`;
        const savedLogo = localStorage.getItem(logoKey);
        if (savedLogo) {
          setLogoPreview(savedLogo);
        }
        
        // Save this as the current working document
        localStorage.setItem('homeFormData', JSON.stringify(documentToEdit));
        
        toast.success('Document loaded from history');
      }
    }
  }, [location.search, formData.id]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (formData && Object.keys(formData).length > 0) {
      console.log("Saving to localStorage:", formData);
      try {
        localStorage.setItem('homeFormData', JSON.stringify(formData));
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        toast.error('Failed to save your work locally');
      }
    }
  }, [formData]);
  
  // Save logo to localStorage when it changes
  useEffect(() => {
    if (logoPreview && formData.id) {
      try {
        // Save the general logo
        localStorage.setItem('homeLogoPreview', logoPreview);
        
        // Also save logo for this specific document
        localStorage.setItem(`homeLogoPreview_${formData.id}`, logoPreview);
      } catch (storageError) {
        console.error('Storage quota exceeded for logo:', storageError);
        // Continue without saving the logo
      }
    }
  }, [logoPreview, formData.id]);
  
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
            localStorage.setItem('homeLogoPreview', compressedDataUrl);
            
            // Also save with document ID if we're editing a specific one
            if (formData.id) {
              localStorage.setItem(`homeLogoPreview_${formData.id}`, compressedDataUrl);
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
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleClientChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      client: {
        ...prev.client,
        [name]: value
      }
    }));
  };
  
  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      [name]: value
    };
    
    // Calculate item subtotal
    if (name === 'quantity' || name === 'price') {
      const quantity = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(newItems[index].price) || 0;
      newItems[index].subtotal = quantity * price;
    }
    
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
    
    // Recalculate totals
    calculateTotals(newItems);
  };
  
  const calculateTotals = (items) => {
    // Calculate subtotal from items
    const subtotal = items.reduce((total, item) => {
      return total + (parseFloat(item.subtotal) || 0);
    }, 0);
    
    // Get current values
    const taxRate = parseFloat(formData.tax) || 0;
    const discount = parseFloat(formData.discount) || 0;
    const shipping = parseFloat(formData.shipping) || 0;
    const amountPaid = parseFloat(formData.amountPaid) || 0;
    
    // Calculate tax amount based on subtotal
    const taxAmount = subtotal * (taxRate / 100);
    
    // Calculate total
    const total = subtotal + taxAmount - discount + shipping;
    
    // Calculate balance due
    const balanceDue = total - amountPaid;
    
    // Update state with calculated values
    setFormData(prev => ({
      ...prev,
      subtotal,
      total,
      balanceDue
    }));
  };
  
  const addItem = () => {
    const newItems = [
      ...formData.items,
      {
        name: '',
        description: '',
        quantity: 1,
        price: 0,
        tax: 0,
        subtotal: 0
      }
    ];
    
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
  };
  
  const removeItem = (index) => {
    if (formData.items.length <= 1) {
      return; // Don't remove the last item
    }
    
    const newItems = formData.items.filter((_, i) => i !== index);
    
    setFormData(prev => ({
      ...prev,
      items: newItems
    }));
    
    // Recalculate totals
    calculateTotals(newItems);
  };
  
  const handleDocumentTypeChange = (e) => {
    const type = e.target.value;
    let number;
    
    // Generate appropriate number prefix based on document type
    switch (type) {
      case 'quotation':
        number = `QUO-${Math.floor(10000 + Math.random() * 90000)}`;
        break;
      case 'invoice':
        number = `INV-${Math.floor(10000 + Math.random() * 90000)}`;
        break;
      case 'receipt':
        number = `REC-${Math.floor(10000 + Math.random() * 90000)}`;
        break;
      case 'creditNote':
        number = `CN-${Math.floor(10000 + Math.random() * 90000)}`;
        break;
      case 'purchaseOrder':
        number = `PO-${Math.floor(10000 + Math.random() * 90000)}`;
        break;
      default:
        number = `DOC-${Math.floor(10000 + Math.random() * 90000)}`;
    }
    
    setFormData(prev => ({
      ...prev,
      type,
      number
    }));
  };
  
  const handleTaxChange = (e) => {
    const tax = parseFloat(e.target.value) || 0;
    setFormData(prev => {
      const newFormData = {
        ...prev,
        tax
      };
      
      // Recalculate total with new tax
      const taxAmount = prev.subtotal * (tax / 100);
      newFormData.total = prev.subtotal + taxAmount - prev.discount + prev.shipping;
      newFormData.balanceDue = newFormData.total - prev.amountPaid;
      
      return newFormData;
    });
  };
  
  const handleDiscountChange = (e) => {
    const discount = parseFloat(e.target.value) || 0;
    setFormData(prev => {
      const newFormData = {
        ...prev,
        discount
      };
      
      // Recalculate total with new discount
      const taxAmount = prev.subtotal * (prev.tax / 100);
      newFormData.total = prev.subtotal + taxAmount - discount + prev.shipping;
      newFormData.balanceDue = newFormData.total - prev.amountPaid;
      
      return newFormData;
    });
  };
  
  const handleShippingChange = (e) => {
    const shipping = parseFloat(e.target.value) || 0;
    setFormData(prev => {
      const newFormData = {
        ...prev,
        shipping
      };
      
      // Recalculate total with new shipping
      const taxAmount = prev.subtotal * (prev.tax / 100);
      newFormData.total = prev.subtotal + taxAmount - prev.discount + shipping;
      newFormData.balanceDue = newFormData.total - prev.amountPaid;
      
      return newFormData;
    });
  };
  
  const handleAmountPaidChange = (e) => {
    const amountPaid = parseFloat(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      amountPaid,
      balanceDue: prev.total - amountPaid
    }));
  };
  
  const toggleDiscount = () => {
    setShowDiscount(!showDiscount);
    if (!showDiscount) {
      // Reset discount value when showing the field
      setFormData(prev => {
        const newData = {
          ...prev,
          discount: 0
        };
        // Recalculate totals
        const taxAmount = prev.subtotal * (prev.tax / 100);
        newData.total = prev.subtotal + taxAmount - 0 + prev.shipping;
        newData.balanceDue = newData.total - prev.amountPaid;
        return newData;
      });
    }
  };
  
  const toggleShipping = () => {
    setShowShipping(!showShipping);
    if (!showShipping) {
      // Reset shipping value when showing the field
      setFormData(prev => {
        const newData = {
          ...prev,
          shipping: 0
        };
        // Recalculate totals
        const taxAmount = prev.subtotal * (prev.tax / 100);
        newData.total = prev.subtotal + taxAmount - prev.discount + 0;
        newData.balanceDue = newData.total - prev.amountPaid;
        return newData;
      });
    }
  };
  
  // Get currency symbol
  const getCurrencySymbol = () => {
    const currencyMap = {
      'USD ($)': '$',
      'EUR (€)': '€',
      'GBP (£)': '£'
    };
    return currencyMap[formData.currency] || '$';
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    const symbol = getCurrencySymbol();
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
  };
  
  // Save document to history
  const saveToHistory = () => {
    try {
      // Get existing documents from localStorage
      const savedDocuments = JSON.parse(localStorage.getItem('homeDocuments') || '[]');
      
      // Check if this document already exists in history
      const existingIndex = savedDocuments.findIndex(doc => doc.id === formData.id);
      
      // Update the document data
      const updatedDocument = {
        ...formData,
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
      localStorage.setItem('homeDocuments', JSON.stringify(savedDocuments));
      
      // Also save the logo if it exists
      if (logoPreview) {
        try {
          localStorage.setItem(`homeLogoPreview_${formData.id}`, logoPreview);
        } catch (storageError) {
          console.error('Storage quota exceeded for logo:', storageError);
          // Continue without saving the logo
          toast.warning('Logo was not saved due to storage limitations');
        }
      }
      
      toast.success('Document saved to history');
      return formData.id;
    } catch (error) {
      console.error('Error saving document to history:', error);
      toast.error('Failed to save document');
      return null;
    }
  };
  
  // Preview document
  const handlePreview = () => {
    const savedId = saveToHistory();
    if (savedId) {
      onDocumentUpdated(formData);
    }
  };
  
  return (
    <div className="content-block">
      <form>
        <div className="form-section">
          <div className="form-header">
            {/* Logo upload */}
            <div className="logo-upload-container">
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
              <div className="company-info">
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="Company Name"
                  className="company-name"
                />
                <textarea
                  name="fromInfo"
                  value={formData.fromInfo}
                  onChange={handleInputChange}
                  placeholder="Your Business Address, Phone, Email, etc."
                  className="from-info"
                  rows="3"
                />
              </div>
            </div>
            
            {/* Document type and number */}
            <div className="document-info">
              <div className="form-group">
                <label htmlFor="type">Document Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleDocumentTypeChange}
                >
                  <option value="quotation">Quotation</option>
                  <option value="invoice">Invoice</option>
                  <option value="receipt">Receipt</option>
                  <option value="creditNote">Credit Note</option>
                  <option value="purchaseOrder">Purchase Order</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="number">Document Number</label>
                <input
                  type="text"
                  id="number"
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="currency">Currency</label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
              >
                {currencies.map(currency => (
                  <option key={currency.value} value={currency.value}>
                    {currency.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Client Information</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientName">Client Name</label>
              <input
                type="text"
                id="clientName"
                name="name"
                value={formData.client.name}
                onChange={handleClientChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="clientEmail">Client Email</label>
              <input
                type="email"
                id="clientEmail"
                name="email"
                value={formData.client.email}
                onChange={handleClientChange}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientPhone">Client Phone</label>
              <input
                type="text"
                id="clientPhone"
                name="phone"
                value={formData.client.phone}
                onChange={handleClientChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="clientAddress">Client Address</label>
              <input
                type="text"
                id="clientAddress"
                name="address"
                value={formData.client.address}
                onChange={handleClientChange}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Items</h2>
          <div className="items-header">
            <div className="item-field name">Item</div>
            <div className="item-field quantity">Quantity</div>
            <div className="item-field price">Price</div>
            <div className="item-field subtotal">Subtotal</div>
            <div className="item-field actions">Actions</div>
          </div>
          
          {formData.items.map((item, index) => (
            <div key={index} className="item-row">
              <div className="item-field name" data-label="Item">
                <input
                  type="text"
                  name="name"
                  value={item.name}
                  onChange={(e) => handleItemChange(index, e)}
                  placeholder="Item description"
                  required
                />
              </div>
              <div className="item-field quantity" data-label="Quantity">
                <input
                  type="number"
                  name="quantity"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, e)}
                  min="1"
                  required
                />
              </div>
              <div className="item-field price" data-label="Price">
                <div className="currency-input">
                  <span>{getCurrencySymbol()}</span>
                  <input
                    type="number"
                    name="price"
                    value={item.price}
                    onChange={(e) => handleItemChange(index, e)}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>
              <div className="item-field subtotal" data-label="Subtotal">
                {formatCurrency(item.subtotal)}
              </div>
              <div className="item-field actions">
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeItem(index)}
                  disabled={formData.items.length === 1}
                >
                  X
                </button>
              </div>
            </div>
          ))}
          
          <button type="button" className="btn btn-add-item" onClick={addItem}>
            Add Item
          </button>
        </div>

        <div className="form-section totals">
          <div className="totals-row">
            <div className="total-label">Subtotal:</div>
            <div className="total-value">{formatCurrency(formData.subtotal)}</div>
          </div>
          
          <div className="totals-row">
            <div className="total-label">Tax Rate (%):</div>
            <div className="total-value">
              <input
                type="number"
                name="tax"
                value={formData.tax}
                onChange={handleTaxChange}
                min="0"
                max="100"
                step="0.1"
              />
            </div>
          </div>
          
          {!showDiscount ? (
            <button type="button" className="toggle-btn" onClick={toggleDiscount}>
              + Add Discount
            </button>
          ) : (
            <div className="totals-row">
              <div className="total-label">Discount:</div>
              <div className="total-value">
                <div className="currency-input">
                  <span>{getCurrencySymbol()}</span>
                  <input
                    type="number"
                    name="discount"
                    value={formData.discount}
                    onChange={handleDiscountChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          )}
          
          {!showShipping ? (
            <button type="button" className="toggle-btn" onClick={toggleShipping}>
              + Add Shipping
            </button>
          ) : (
            <div className="totals-row">
              <div className="total-label">Shipping:</div>
              <div className="total-value">
                <div className="currency-input">
                  <span>{getCurrencySymbol()}</span>
                  <input
                    type="number"
                    name="shipping"
                    value={formData.shipping}
                    onChange={handleShippingChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="totals-row total">
            <div className="total-label">Total:</div>
            <div className="total-value">{formatCurrency(formData.total)}</div>
          </div>
          
          <div className="totals-row">
            <div className="total-label">Amount Paid:</div>
            <div className="total-value">
              <div className="currency-input">
                <span>{getCurrencySymbol()}</span>
                <input
                  type="number"
                  name="amountPaid"
                  value={formData.amountPaid}
                  onChange={handleAmountPaidChange}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>
          
          <div className="totals-row balance">
            <div className="total-label">Balance Due:</div>
            <div className="total-value">{formatCurrency(formData.balanceDue)}</div>
          </div>
        </div>

        <div className="form-section">
          <h2>Additional Information</h2>
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              placeholder="Additional notes to the client..."
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="terms">Terms and Conditions</label>
            <textarea
              id="terms"
              name="terms"
              value={formData.terms}
              onChange={handleInputChange}
              rows="3"
              placeholder="Payment terms, conditions, etc..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-success" onClick={handlePreview}>
            Preview Document
          </button>
          <button type="button" className="btn" onClick={saveToHistory}>
            Save to History
          </button>
        </div>
      </form>
    </div>
  );
};

export default LocalDocumentForm; 