import React, { useState, useContext, useEffect, useRef } from 'react';
import AuthContext from '../context/AuthContext';
import { toast } from 'react-toastify';
import './UserSettings.css';

const UserSettings = () => {
  const { user, updateBusinessInfo, updateDocumentCustomization } = useContext(AuthContext);
  
  const [activeTab, setActiveTab] = useState('business');
  const [businessInfo, setBusinessInfo] = useState({
    name: user?.businessInfo?.name || '',
    address: user?.businessInfo?.address || '',
    phone: user?.businessInfo?.phone || '',
    email: user?.businessInfo?.email || '',
    website: user?.businessInfo?.website || '',
    taxId: user?.businessInfo?.taxId || '',
    logo: null
  });
  
  const [documentCustomization, setDocumentCustomization] = useState({
    primaryColor: user?.documentCustomization?.primaryColor || '#3498db',
    accentColor: user?.documentCustomization?.accentColor || '#2ecc71',
    font: user?.documentCustomization?.font || 'Helvetica',
    termsAndConditions: user?.documentCustomization?.termsAndConditions || '',
    footer: user?.documentCustomization?.footer || ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const fileInput = useRef(null);
  
  const handleBusinessInfoChange = (e) => {
    const { name, value } = e.target;
    setBusinessInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setBusinessInfo(prev => ({
        ...prev,
        logo: e.target.files[0]
      }));
    }
  };
  
  const handleDocumentCustomizationChange = (e) => {
    const { name, value } = e.target;
    setDocumentCustomization(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleBusinessInfoSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Create FormData object for file upload
      const formData = new FormData();
      
      // Add all business info fields
      Object.keys(businessInfo).forEach(key => {
        if (businessInfo[key] !== null && businessInfo[key] !== undefined) {
          formData.append(key, businessInfo[key]);
        }
      });
      
      // Add file if one was selected
      if (fileInput.current && fileInput.current.files[0]) {
        formData.append('logo', fileInput.current.files[0]);
      }
      
      console.log("Submitting business info with FormData");
      
      // Make API request with FormData
      const response = await fetch('/api/users/business-info', {
        method: 'PUT',
        headers: {
          'x-auth-token': localStorage.getItem('token')
        },
        body: formData // Don't set Content-Type with FormData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to update business information');
      }
      
      // Update business info state - fix for controlled component error
      setBusinessInfo(prevState => ({
        ...prevState,
        ...data.businessInfo,
        // Make sure none of the fields become undefined
        name: data.businessInfo.name || '',
        address: data.businessInfo.address || '',
        phone: data.businessInfo.phone || '',
        email: data.businessInfo.email || '',
        website: data.businessInfo.website || '',
        taxId: data.businessInfo.taxId || '',
        logo: data.businessInfo.logo || prevState.logo || null
      }));
      
      toast.success('Business information updated');
    } catch (error) {
      console.error('Error updating business info:', error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDocumentCustomizationSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      console.log("Submitting document customization:", documentCustomization);
      
      // Make API request with document customization data
      const response = await fetch('/api/users/document-customization', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        },
        body: JSON.stringify({
          primaryColor: documentCustomization.primaryColor,
          accentColor: documentCustomization.accentColor, 
          font: documentCustomization.font,
          termsAndConditions: documentCustomization.termsAndConditions,
          footer: documentCustomization.footer
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.msg || 'Failed to update document customization');
      }
      
      // Update document customization state
      setDocumentCustomization(prevState => ({
        ...prevState,
        ...data.documentCustomization
      }));
      
      toast.success('Document customization updated');
    } catch (error) {
      console.error('Error updating document customization:', error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1>Settings</h1>
      </div>
      
      <div className="settings-tabs">
        <button 
          className={`tab ${activeTab === 'business' ? 'active' : ''}`}
          onClick={() => setActiveTab('business')}
        >
          Business Information
        </button>
        <button 
          className={`tab ${activeTab === 'document' ? 'active' : ''}`}
          onClick={() => setActiveTab('document')}
        >
          Document Customization
        </button>
      </div>
      
      <div className="settings-content">
        {activeTab === 'business' ? (
          <div className="settings-card">
            <h2>Business Information</h2>
            <p>This information will appear on your documents.</p>
            
            <form onSubmit={handleBusinessInfoSubmit} encType="multipart/form-data" className="settings-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Business Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={businessInfo.name}
                    onChange={handleBusinessInfoChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="email">Business Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={businessInfo.email}
                    onChange={handleBusinessInfoChange}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Business Phone</label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={businessInfo.phone}
                    onChange={handleBusinessInfoChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="website">Business Website</label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={businessInfo.website}
                    onChange={handleBusinessInfoChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Business Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={businessInfo.address}
                  onChange={handleBusinessInfoChange}
                  rows="3"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="taxId">Tax ID / VAT Number</label>
                  <input
                    type="text"
                    id="taxId"
                    name="taxId"
                    value={businessInfo.taxId}
                    onChange={handleBusinessInfoChange}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="logo">Business Logo</label>
                  <input
                    type="file"
                    id="logo"
                    name="logo"
                    ref={fileInput}
                    accept="image/*"
                  />
                  {businessInfo.logo && (
                    <div className="logo-preview">
                      <img 
                        src={businessInfo.logo.startsWith('http') 
                          ? businessInfo.logo 
                          : `/api/uploads/${businessInfo.logo.split('/').pop()}`} 
                        alt="Business Logo" 
                      />
                    </div>
                  )}
                  <p className="form-hint">Recommended size: 300x100px</p>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Business Information'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="settings-card">
            <h2>Document Customization</h2>
            <p>Customize the appearance of your documents.</p>
            
            <form onSubmit={handleDocumentCustomizationSubmit} className="settings-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="primaryColor">Primary Color</label>
                  <div className="color-picker">
                    <input
                      type="color"
                      id="primaryColor"
                      name="primaryColor"
                      value={documentCustomization.primaryColor}
                      onChange={handleDocumentCustomizationChange}
                    />
                    <input
                      type="text"
                      value={documentCustomization.primaryColor}
                      onChange={handleDocumentCustomizationChange}
                      name="primaryColor"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="accentColor">Accent Color</label>
                  <div className="color-picker">
                    <input
                      type="color"
                      id="accentColor"
                      name="accentColor"
                      value={documentCustomization.accentColor}
                      onChange={handleDocumentCustomizationChange}
                    />
                    <input
                      type="text"
                      value={documentCustomization.accentColor}
                      onChange={handleDocumentCustomizationChange}
                      name="accentColor"
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="font">Font Family</label>
                <select
                  id="font"
                  name="font"
                  value={documentCustomization.font}
                  onChange={handleDocumentCustomizationChange}
                >
                  <option value="Segoe UI">Segoe UI</option>
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Tahoma">Tahoma</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="termsAndConditions">Default Terms and Conditions</label>
                <textarea
                  id="termsAndConditions"
                  name="termsAndConditions"
                  value={documentCustomization.termsAndConditions}
                  onChange={handleDocumentCustomizationChange}
                  rows="4"
                  placeholder="Enter your default terms and conditions"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="footer">Default Document Footer</label>
                <textarea
                  id="footer"
                  name="footer"
                  value={documentCustomization.footer}
                  onChange={handleDocumentCustomizationChange}
                  rows="2"
                  placeholder="Enter your default document footer"
                />
              </div>
              
              <div className="form-actions">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Customization'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSettings; 