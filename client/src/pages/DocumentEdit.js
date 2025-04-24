import React, { useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DocumentProvider } from '../context/DocumentContext';
import DocumentContext from '../context/DocumentContext';
import ClassicForm from './ClassicForm';
import { toast } from 'react-toastify';
import './DocumentEdit.css';

const DocumentEditContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getDocument, document, loading, error } = useContext(DocumentContext);

  useEffect(() => {
    getDocument(id);
  }, [id]);

  const handleDocumentUpdated = (data) => {
    toast.success('Document updated successfully');
    navigate(`/document/${data._id}`);
  };

  if (loading) return <div className="loading">Loading document...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!document) return <div className="alert alert-danger">Document not found</div>;

  return (
    <div className="document-edit-page">
      <div className="page-header">
        <h1>Edit Document</h1>
      </div>
      
      <ClassicForm 
        existingDocument={document} 
        onDocumentUpdated={handleDocumentUpdated} 
      />
    </div>
  );
};

const DocumentEdit = () => (
  <DocumentProvider>
    <DocumentEditContent />
  </DocumentProvider>
);

export default DocumentEdit; 