import React, { useEffect, useContext, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { DocumentProvider } from "../context/DocumentContext";
import DocumentContext from "../context/DocumentContext";
import AuthContext from "../context/AuthContext";
import DocumentPreview from "../components/documents/DocumentPreview";
import DocumentActions from "../components/documents/DocumentActions";
import EmailForm from "../components/documents/EmailForm";
import "./DocumentView.css";

const DocumentViewContent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getDocument, document, loading, error } = useContext(DocumentContext);
  const { user } = useContext(AuthContext);
  const [showEmailForm, setShowEmailForm] = useState(false);

  useEffect(() => {
    getDocument(id);
  }, [id]);

  if (loading) return <div className="loading">Loading document...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!document)
    return <div className="alert alert-danger">Document not found</div>;

  return (
    <div className="document-view-page">
      <div className="page-header">
        <div className="header-title">
          <h1>
            {document.type.charAt(0).toUpperCase() + document.type.slice(1)}{" "}
            {document.number}
          </h1>
          <p>Created: {new Date(document.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="header-actions">
          <Link to="/dashboard" className="btn">
            Back to Dashboard
          </Link>
        </div>
      </div>

      {user && <DocumentActions document={document} />}

      <div className="document-preview-container">
        <DocumentPreview
          document={document}
          businessInfo={user?.businessInfo}
        />
      </div>

      {showEmailForm ? (
        <EmailForm
          documentId={document._id}
          clientEmail={document.client.email}
        />
      ) : (
        user && (
          <div className="email-button-container">
            <button
              className="btn btn-primary"
              onClick={() => setShowEmailForm(true)}
            >
              Email Document
            </button>
          </div>
        )
      )}
    </div>
  );
};

const DocumentView = () => (
  <DocumentProvider>
    <DocumentViewContent />
  </DocumentProvider>
);

export default DocumentView;
