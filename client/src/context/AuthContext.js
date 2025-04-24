import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { syncLocalDocumentsWithServer } from '../utils/localStorageSync';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Set default header with token
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      loadUser();
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      setLoading(false);
    }
  }, [token]);

  // Load user data if authenticated
  const loadUser = async () => {
    try {
      const res = await axios.get('/api/users/profile');
      setUser(res.data);
      setIsAuthenticated(true);
      
      // Sync local documents with server after successful login
      await syncLocalDocumentsWithServer(token);
    } catch (err) {
      console.error('Error loading user:', err.response?.data || err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  // Login/Register unified function
  const processAuth = async (email, password) => {
    try {
      const res = await axios.post('/api/auth', { email, password });
      
      // If we got a token back, it's a login
      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        setIsAuthenticated(true);
        
        // Sync local documents with server after successful login
        await syncLocalDocumentsWithServer(res.data.token);
        
        return { success: true, msg: 'Login successful' };
      } else {
        // It's a registration
        return { success: true, msg: res.data.msg };
      }
    } catch (err) {
      return { 
        success: false, 
        msg: err.response?.data?.msg || 'Authentication error'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const forgotPassword = async (email) => {
    try {
      const res = await axios.post('/api/auth/forgot-password', { email });
      return { success: true, msg: res.data.msg };
    } catch (err) {
      return { 
        success: false, 
        msg: err.response?.data?.msg || 'Error sending reset link'
      };
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const res = await axios.post('/api/auth/reset-password', { token, password });
      return { success: true, msg: res.data.msg };
    } catch (err) {
      return { 
        success: false, 
        msg: err.response?.data?.msg || 'Error resetting password'
      };
    }
  };

  const updateBusinessInfo = async (formData) => {
    try {
      const res = await axios.put('/api/users/business-info', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUser({ ...user, businessInfo: res.data.businessInfo });
      return { success: true, msg: 'Business information updated' };
    } catch (err) {
      return { 
        success: false, 
        msg: err.response?.data?.msg || 'Error updating business info'
      };
    }
  };

  const updateDocumentCustomization = async (data) => {
    try {
      const res = await axios.put('/api/users/document-customization', data);
      setUser({ ...user, documentCustomization: res.data.documentCustomization });
      return { success: true, msg: 'Document customization updated' };
    } catch (err) {
      return { 
        success: false, 
        msg: err.response?.data?.msg || 'Error updating document customization'
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated,
        loading,
        user,
        processAuth,
        logout,
        forgotPassword,
        resetPassword,
        updateBusinessInfo,
        updateDocumentCustomization
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 