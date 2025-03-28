import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DocumentContext from '../../context/DocumentContext';
import AuthContext from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './DocumentForm.css';

const initialState = {
  type: 'quotation',
  number: `Q-${Math.floor(10000 + Math.random() * 90000)}`,
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  client: {
    name: '',
    email: '',
    phone: '',
    address: ''
  },
  items: [
    {
      name: '',
      quantity: 1,
      price: 0,
      tax: 0,
      subtotal: 0
    }
  ],
  subtotal: 0,
  tax: 0,
  discount: 0,
  total: 0,
  notes: ''
};

const DocumentForm = ({ existingDocument = null }) => {
  const [formData, setFormData] = useState(initialState);
  const [autoSaveInterval, setAutoSaveInterval] = useState(null);
  const { createDocument, updateDocument, document, loading, error } = useContext(DocumentContext);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();

  // Initialize form with existing document if provided
  useEffect(() => {
    if (existingDocument) {
      setFormData(existingDocument);
    }
  }, [existingDocument]);

  // Setup autosave
  useEffect(() => {
    if (formData._id) {
      const interval = setInterval(() => {
        handleAutoSave();
      }, 120000); // Autosave every 2 minutes
      setAutoSaveInterval(interval);
    }

    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [formData]);

  const handleClientChange = (e) => {
    setFormData({
      ...formData,
      client: {
        ...formData.client,
        [e.target.name]: e.target.value
      }
    });
  };

  const handleItemChange = (index, e) => {
    const newItems = [...formData.items];
    newItems[index][e.target.name] = e.target.value;
    
    // Calculate item subtotal
    if (e.target.name === 'quantity' || e.target.name === 'price' || e.target.name === 'tax') {
      const quantity = parseFloat(newItems[index].quantity);
      const price = parseFloat(newItems[index].price);
      const tax = parseFloat(newItems[index].tax) || 0;
      
      newItems[index].subtotal = quantity * price;
    }
    
    setFormData({
      ...formData,
      items: newItems
    });
    
    // Recalculate totals
    calculateTotals(newItems);
  };

  const calculateTotals = (items) => {
    // Calculate subtotal
    const subtotal = items.reduce((total, item) => 
      total + (parseFloat(item.subtotal) || 0), 0);
    
    // Calculate total tax
    const tax = items.reduce((total, item) => 
      total + ((parseFloat(item.subtotal) || 0) * (parseFloat(item.tax) || 0) / 100), 0);
    
    // Calculate total with discount
    const discount = parseFloat(formData.discount) || 0;
    const total = subtotal + tax - discount;
    
    setFormData(prev => ({
      ...prev,
      subtotal,
      tax,
      total
    }));
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          name: '',
          quantity: 1,
          price: 0,
          tax: 0,
          subtotal: 0
        }
      ]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      items: newItems
    });
    calculateTotals(newItems);
  };

  const handleDocumentTypeChange = (e) => {
    const type = e.target.value;
    let number;
    
    // Generate appropriate number prefix based on document type
    switch (type) {
      case 'quotation':
        number = `Q-${Math.floor(10000 + Math.random() * 90000)}`;
        break;
      case 'invoice':
        number = `I-${Math.floor(10000 + Math.random() * 90000)}`;
        break;
      case 'receipt':
        number = `R-${Math.floor(10000 + Math.random() * 90000)}`;
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
    
    setFormData({
      ...formData,
      type,
      number
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let result;
      
      if (formData._id) {
        // Update existing document
        result = await updateDocument(formData._id, formData);
        if (result) {
          toast.success('Document updated successfully');
        }
      } else {
        // Create new document
        result = await createDocument(formData);
        if (result) {
          toast.success('Document created successfully');
          navigate(`/document/${result._id}`);
        }
      }
    } catch (err) {
      toast.error('Error saving document');
      console.error('Error:', err);
    }
  };

  const handleAutoSave = async () => {
    if (formData._id) {
      try {
        await updateDocument(formData._id, formData);
        //toast.info('Document autosaved');
      } catch (err) {
        toast.error('Error autosaving document');
        console.error('Autosave error:', err);
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="content-block">
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>Document Information</h2>
          <div className="form-row">
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
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                required
              />
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
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
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
            <div className="item-field tax">Tax %</div>
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
              <div className="item-field tax" data-label="Tax %">
                <input
                  type="number"
                  name="tax"
                  value={item.tax}
                  onChange={(e) => handleItemChange(index, e)}
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
              <div className="item-field subtotal" data-label="Subtotal">
                {parseFloat(item.subtotal).toFixed(2)}
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
            <div className="total-value">{parseFloat(formData.subtotal).toFixed(2)}</div>
          </div>
          <div className="totals-row">
            <div className="total-label">Tax:</div>
            <div className="total-value">{parseFloat(formData.tax).toFixed(2)}</div>
          </div>
          <div className="totals-row">
            <div className="total-label">Discount:</div>
            <div className="total-value">
              <input
                type="number"
                name="discount"
                value={formData.discount}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    discount: e.target.value,
                    total: formData.subtotal + formData.tax - parseFloat(e.target.value || 0)
                  });
                }}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <div className="totals-row total">
            <div className="total-label">Total:</div>
            <div className="total-value">{parseFloat(formData.total).toFixed(2)}</div>
          </div>
        </div>

        <div className="form-section">
          <h2>Additional Notes</h2>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows="4"
            placeholder="Add any additional notes here..."
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-success">
            {formData._id ? 'Update Document' : 'Create Document'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentForm; 