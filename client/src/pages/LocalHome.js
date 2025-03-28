/**
 * LocalHome.js
 * 
 * PURPOSE:
 * This page provides the main interface for users to create and manage documents
 * using localStorage instead of server storage. It toggles between form view for
 * creating/editing documents and preview view for reviewing and downloading.
 * 
 * IMPORTANCE:
 * - Serves as the primary entry point for localStorage-based document creation
 * - Manages state between document editing and preview modes
 * - Handles document form data persistence and preview generation
 * - Provides consistent user experience with server-backed version
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';

import LocalDocumentForm from '../components/documents/LocalDocumentForm';
import HomeDocumentPreview from '../components/documents/HomeDocumentPreview';

const LocalHome = () => {
  const [activeTab, setActiveTab] = useState('form');
  const [documentData, setDocumentData] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check URL parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const documentId = searchParams.get('id');
    const view = searchParams.get('view');
    
    if (documentId) {
      try {
        // Load document from localStorage history
        const savedDocuments = JSON.parse(localStorage.getItem('homeDocuments') || '[]');
        const foundDocument = savedDocuments.find(doc => doc.id === documentId);
        
        if (foundDocument) {
          setDocumentData(foundDocument);
          
          // If view parameter is set to 'preview', switch to preview tab
          if (view === 'preview') {
            setActiveTab('preview');
          }
        } else {
          toast.error('Document not found');
          navigate('/local');
        }
      } catch (error) {
        console.error('Error loading document:', error);
        toast.error('Error loading document');
        navigate('/local');
      }
    }
  }, [location.search, navigate]);
  
  // Handle document update from form
  const handleDocumentUpdated = (data) => {
    setDocumentData(data);
    setActiveTab('preview');
    
    // Update URL to include document ID and view=preview
    navigate(`/local?id=${data.id}&view=preview`, { replace: true });
  };
  
  // Handle returning to edit mode
  const handleEdit = (data) => {
    setDocumentData(data);
    setActiveTab('form');
    
    // Update URL to include document ID only
    navigate(`/local?id=${data.id}`, { replace: true });
  };
  
  return (
    <div className="container">
      <div className="page-header">
        <h1>Create Document</h1>
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => setActiveTab('form')}
          >
            Form
          </button>
          <button
            className={`tab ${activeTab === 'preview' ? 'active' : ''}`}
            onClick={() => {
              if (documentData) {
                setActiveTab('preview');
              } else {
                toast.info('Please create a document first');
              }
            }}
            disabled={!documentData}
          >
            Preview
          </button>
        </div>
      </div>
      
      <div className="content">
        {activeTab === 'form' ? (
          <LocalDocumentForm
            onDocumentUpdated={handleDocumentUpdated}
            initialData={documentData}
          />
        ) : (
          <HomeDocumentPreview
            documentData={documentData}
            onEdit={handleEdit}
          />
        )}
      </div>
    </div>
  );
};

export default LocalHome; 