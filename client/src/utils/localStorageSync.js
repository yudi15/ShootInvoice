import axios from 'axios';
import { toast } from 'react-toastify';

/**
 * Syncs local documents with the server
 * @param {string} token - Authentication token
 * @returns {Promise<boolean>} - Success status
 */
export const syncLocalDocumentsWithServer = async (token) => {
  try {
    // Get local documents from localStorage
    const localDocuments = JSON.parse(localStorage.getItem('invoiceDocuments') || '[]');
    
    if (localDocuments.length === 0) {
      console.log('No local documents to sync');
      return true;
    }
    
    console.log(`Syncing ${localDocuments.length} local documents with server`);
    
    // Get local logo data
    const localLogos = {};
    localDocuments.forEach(doc => {
      const logoKey = `invoiceLogoPreview_${doc.id}`;
      const logoData = localStorage.getItem(logoKey);
      if (logoData) {
        localLogos[doc.id] = logoData;
      }
    });
    
    // Prepare documents for server format
    const documentsToSync = localDocuments.map(doc => ({
      type: doc.type,
      number: doc.invoiceNumber,
      date: doc.issueDate,
      dueDate: doc.dueDate,
      client: {
        name: doc.billTo ? doc.billTo.split('\n')[0] : 'Client',
        address: doc.billTo || '',
        email: '',
        phone: ''
      },
      items: doc.items.map(item => ({
        name: item.description,
        description: '',
        quantity: item.quantity,
        price: item.rate,
        subtotal: item.amount
      })),
      subtotal: doc.subtotal,
      tax: doc.tax,
      discount: doc.discount,
      shipping: doc.shipping,
      total: doc.total,
      notes: doc.notes,
      terms: doc.terms,
      currency: doc.currency,
      fromInfo: doc.fromInfo,
      companyName: doc.companyName,
      isLocal: true,
      localId: doc.id
    }));
    
    // Send documents to server
    const response = await axios.post(
      '/api/documents/sync-local',
      { 
        documents: documentsToSync,
        logos: localLogos
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      }
    );
    
    if (response.data.success) {
      toast.success(`Successfully synced ${localDocuments.length} local documents with your account`);
      
      // Mark documents as synced in localStorage
      const syncedIds = response.data.syncedIds || [];
      const updatedLocalDocs = localDocuments.map(doc => {
        if (syncedIds.includes(doc.id)) {
          return { ...doc, synced: true };
        }
        return doc;
      });
      
      localStorage.setItem('invoiceDocuments', JSON.stringify(updatedLocalDocs));
      
      return true;
    } else {
      toast.error('Failed to sync local documents with server');
      return false;
    }
  } catch (error) {
    console.error('Error syncing local documents:', error);
    toast.error(`Error syncing documents: ${error.response?.data?.message || error.message}`);
    return false;
  }
}; 