import React, { createContext, useReducer, useCallback } from 'react';
import axios from 'axios';

const DocumentContext = createContext();

// Add a reducer
const documentReducer = (state, action) => {
  switch (action.type) {
    case 'SET_DOCUMENTS':
      return { ...state, documents: action.payload, loading: false };
    case 'SET_DOCUMENT':
      return { ...state, document: action.payload, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: true };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

// Use the reducer
export const DocumentProvider = ({ children }) => {
  const initialState = {
    documents: [],
    document: null,
    loading: false,
    error: null
  };
  
  const [state, dispatch] = useReducer(documentReducer, initialState);
  
  // Use useCallback for functions
  const getDocuments = useCallback(async (isGuest = false) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const url = isGuest ? '/api/documents/guest' : '/api/documents/user';
      const res = await axios.get(url);
      dispatch({ type: 'SET_DOCUMENTS', payload: res.data });
      return res.data;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err.response?.data?.msg || 'Error fetching documents'
      });
      console.error('Error fetching documents:', err);
      return [];
    }
  }, []);

  // Get single document
  const getDocument = async (id) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const res = await axios.get(`/api/documents/${id}`);
      
      // Fix any incorrect logo paths in the response
      if (res.data && res.data.businessInfo && res.data.businessInfo.logo) {
        const logo = res.data.businessInfo.logo;
        if (logo.includes('/document/uploads/')) {
          res.data.businessInfo.logo = logo.replace('/document/uploads/', '/uploads/');
        }
      }
      
      dispatch({ type: 'SET_DOCUMENT', payload: res.data });
      return res.data;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err.response?.data?.msg || 'Error fetching document'
      });
      console.error('Error fetching document:', err);
      return null;
    }
  };

  // Create document
  const createDocument = async (documentData) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const res = await axios.post('/api/documents', documentData);
      dispatch({ type: 'SET_DOCUMENTS', payload: [res.data, ...state.documents] });
      return res.data;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err.response?.data?.msg || 'Error creating document'
      });
      console.error('Error creating document:', err);
      return null;
    }
  };

  // Update document
  const updateDocument = async (id, documentData) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const res = await axios.put(`/api/documents/${id}`, documentData);
      dispatch({ 
        type: 'SET_DOCUMENTS', 
        payload: state.documents.map(doc => doc._id === id ? res.data : doc)
      });
      dispatch({ type: 'SET_DOCUMENT', payload: res.data });
      return res.data;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err.response?.data?.msg || 'Error updating document'
      });
      console.error('Error updating document:', err);
      return null;
    }
  };

  // Delete document
  const deleteDocument = async (id) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      await axios.delete(`/api/documents/${id}`);
      dispatch({ 
        type: 'SET_DOCUMENTS', 
        payload: state.documents.filter(doc => doc._id !== id)
      });
      return true;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err.response?.data?.msg || 'Error deleting document'
      });
      console.error('Error deleting document:', err);
      return false;
    }
  };

  // Convert document
  const convertDocument = async (documentId, targetType) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const res = await axios.post('/api/documents/convert', { documentId, targetType });
      dispatch({ type: 'SET_DOCUMENTS', payload: [res.data, ...state.documents] });
      return res.data;
    } catch (err) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: err.response?.data?.msg || 'Error converting document'
      });
      console.error('Error converting document:', err);
      return null;
    }
  };

  // Generate PDF URL
  const generatePdfUrl = (documentId) => {
    return `/api/documents/${documentId}/pdf`;
  };

  // Email document
  const emailDocument = async (documentId, emailData) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      // Make sure we're sending the correct field names
      const response = await axios.post(`/api/documents/${documentId}/email`, {
        to: emailData.to,           // Updated field name to match backend
        subject: emailData.subject,
        message: emailData.message
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('token')
        }
      });
      
      console.log('Email sent successfully:', response.data);
      return { success: true, ...response.data };
    } catch (error) {
      console.error('Error emailing document:', error);
      return { 
        success: false, 
        msg: error.response?.data?.msg || 'Failed to email document' 
      };
    } finally {
      dispatch({ type: 'SET_LOADING' });
    }
  };

  return (
    <DocumentContext.Provider
      value={{
        ...state,
        getDocuments,
        getDocument,
        createDocument,
        updateDocument,
        deleteDocument,
        convertDocument,
        generatePdfUrl,
        emailDocument
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export default DocumentContext; 