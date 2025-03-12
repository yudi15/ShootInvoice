import React, { useState, useRef, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import DocumentContext, { DocumentProvider } from '../context/DocumentContext';
import { toast } from 'react-toastify';
import './ClassicForm.css';

const ClassicFormContent = () => {
  const navigate = useNavigate();
  const { createDocument } = useContext(DocumentContext);
  const fileInput = useRef(null);
  const [logoPreview, setLogoPreview] = useState(null);
  
  // Form state
  const [documentData, setDocumentData] = useState({
    type: 'quotation',
    companyName: '',
    invoiceId: '',
    issueDate: '',
    dueDate: '',
    from: '',
    for: '',
    currency: '$',
    subject: '',
    items: [{ name: '', description: '', quantity: 1, price: 0, total: 0 }],
    subtotal: 0,
    tax: 0,
    total: 0
  });
  
  // Handle logo file selection
  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
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
  
  // Calculate item total
  const calculateItemTotal = (item) => {
    return (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
  };
  
  // Handle item input changes
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...documentData.items];
    updatedItems[index] = { 
      ...updatedItems[index], 
      [field]: value,
      total: field === 'quantity' || field === 'price' 
        ? calculateItemTotal({...updatedItems[index], [field]: value})
        : updatedItems[index].total
    };
    
    // Recalculate subtotal
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const tax = subtotal * 0.10; // 10% tax
    const total = subtotal + tax;
    
    setDocumentData(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      tax,
      total
    }));
  };
  
  // Add a new item
  const addItem = () => {
    setDocumentData(prev => ({
      ...prev,
      items: [...prev.items, { name: '', description: '', quantity: 1, price: 0, total: 0 }]
    }));
  };
  
  // Remove an item
  const removeItem = (index) => {
    const updatedItems = documentData.items.filter((_, i) => i !== index);
    const subtotal = updatedItems.reduce((sum, item) => sum + (item.total || 0), 0);
    const tax = subtotal * 0.10;
    const total = subtotal + tax;
    
    setDocumentData(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      tax,
      total
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert to your document format
    const newDocument = {
      type: documentData.type,
      number: documentData.invoiceId,
      date: documentData.issueDate,
      dueDate: documentData.dueDate,
      client: {
        name: documentData.for,
        address: '',
        email: ''
      },
      items: documentData.items.map(item => ({
        name: item.name,
        description: item.description,
        quantity: parseFloat(item.quantity) || 0,
        price: parseFloat(item.price) || 0,
        total: item.total
      })),
      notes: documentData.from,
      subtotal: documentData.subtotal,
      tax: documentData.tax,
      discount: 0,
      total: documentData.total,
      currency: documentData.currency
    };
    
    try {
      const result = await createDocument(newDocument);
      if (result) {
        toast.success('Document created successfully!');
        navigate(`/document/${result._id}`);
      }
    } catch (error) {
      toast.error('Failed to create document');
      console.error(error);
    }
  };
  
  return (
    <div className="classic-form-container">
      <div className="content-block">
        <form onSubmit={handleSubmit}>
          <div className="row justify-content-between">
            <div className="col-md-6 d-flex align-items-end flex-column">
              <select 
                name="type" 
                className="form-control form-service"
                value={documentData.type}
                onChange={handleInputChange}
              >
                <option value="quotation">Quotation</option>
                <option value="invoice">Invoice</option>
                <option value="receipt">Receipt</option>
              </select>
            </div>
            
            <div className="col-md-5">
              <div className="select-logo" onClick={() => fileInput.current.click()}>
                {logoPreview ? (
                  <img src={logoPreview} alt="Company Logo" />
                ) : (
                  <img src="/img/company-logo-bg.png" alt="Upload Logo" />
                )}
                <input 
                  type="file" 
                  className="FileUpload" 
                  ref={fileInput}
                  onChange={handleLogoChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>
              <h3>
                <input 
                  placeholder="Company Name" 
                  type="text" 
                  name="companyName"
                  value={documentData.companyName}
                  onChange={handleInputChange}
                  className="form-control" 
                />
              </h3>
            </div>
          </div>
          
          <div className="row justify-content-between">
            <div className="col-md-6">
              <div className="form-group">
                <div className="input-group">
                  <span className="input-group-addon">Invoice ID:</span>
                  <input 
                    type="text" 
                    name="invoiceId"
                    value={documentData.invoiceId}
                    onChange={handleInputChange}
                    className="form-control" 
                  />
                </div>
                
                <div className="input-group">
                  <span className="input-group-addon">Issue Date:</span>
                  <input 
                    type="date" 
                    name="issueDate"
                    value={documentData.issueDate}
                    onChange={handleInputChange}
                    className="form-control" 
                  />
                </div>
                
                <div className="input-group">
                  <span className="input-group-addon">Due Date:</span>
                  <input 
                    type="date" 
                    name="dueDate"
                    value={documentData.dueDate}
                    onChange={handleInputChange}
                    className="form-control" 
                  />
                </div>
              </div>
            </div>
            
            <div className="col-md-6">
              <div className="form-group">
                <div className="input-group">
                  <span className="input-group-addon">From:</span>
                  <input 
                    type="text" 
                    name="from"
                    value={documentData.from}
                    onChange={handleInputChange}
                    className="form-control" 
                    placeholder="Additional Info" 
                  />
                </div>
                
                <div className="input-group">
                  <span className="input-group-addon">For:</span>
                  <input 
                    type="text" 
                    name="for"
                    value={documentData.for}
                    onChange={handleInputChange}
                    className="form-control" 
                    placeholder="Additional Info" 
                  />
                </div>
                
                <div className="input-group">
                  <span className="input-group-addon">Select Currency</span>
                  <select 
                    name="currency"
                    value={documentData.currency}
                    onChange={handleInputChange}
                    className="form-control"
                  >
                    <option value="$">Dollars $</option>
                    <option value="€">Euro €</option>
                    <option value="£">Pounds £</option>
                    <option value="¥">Yen ¥</option>
                    <option value="₹">Rupees ₹</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-12">
              <div className="form-group">
                <div className="input-group">
                  <span className="input-group-addon">Subject:</span>
                  <input 
                    type="text" 
                    name="subject"
                    value={documentData.subject}
                    onChange={handleInputChange}
                    className="form-control" 
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-12">
              <table className="table">
                <thead className="thead-light">
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {documentData.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <input 
                          type="text" 
                          value={item.name}
                          onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                          className="form-control" 
                        />
                      </td>
                      <td>
                        <input 
                          type="text" 
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          className="form-control" 
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="form-control" 
                          min="1"
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          value={item.price}
                          onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                          className="form-control" 
                          step="0.01"
                          min="0"
                        />
                      </td>
                      <td>
                        {documentData.currency} {item.total.toFixed(2)}
                      </td>
                      <td>
                        <button 
                          type="button" 
                          className="btn btn-danger btn-sm"
                          onClick={() => removeItem(index)}
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                  
                  <tr>
                    <td colSpan="4" className="text-right">
                      <button 
                        type="button" 
                        className="btn btn-primary btn-sm"
                        onClick={addItem}
                      >
                        + Add Item
                      </button>
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                  
                  <tr>
                    <td colSpan="3"></td>
                    <td>Subtotal:</td>
                    <td>{documentData.currency} {documentData.subtotal.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  
                  <tr>
                    <td colSpan="3"></td>
                    <td>Tax (10%):</td>
                    <td>{documentData.currency} {documentData.tax.toFixed(2)}</td>
                    <td></td>
                  </tr>
                  
                  <tr>
                    <td colSpan="3"></td>
                    <td><strong>Total:</strong></td>
                    <td><strong>{documentData.currency} {documentData.total.toFixed(2)}</strong></td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="row">
            <div className="col-md-12">
              <div className="d-flex">
                <div className="ml-auto p-2">
                  <button type="submit" className="btn btn-success">
                    Generate {documentData.type.charAt(0).toUpperCase() + documentData.type.slice(1)}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Wrap the component with DocumentProvider
const ClassicForm = () => (
  <DocumentProvider>
    <ClassicFormContent />
  </DocumentProvider>
);

export default ClassicForm; 