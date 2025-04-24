import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { DocumentProvider } from '../context/DocumentContext';
import ClassicForm from './ClassicForm';
import DocumentPreview from '../components/documents/DocumentPreview';
import AuthContext from '../context/AuthContext';

const Home = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('form');
  const [documentData, setDocumentData] = useState(null);

  const handleDocumentUpdated = (data) => {
    setDocumentData(data);
    setActiveTab('preview');
  };

  return (
    <DocumentProvider>
      <div className="row-fluid content-wrap">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="col-md-12 content-block">
                {activeTab === 'form' ? (
                  <ClassicForm onDocumentUpdated={handleDocumentUpdated} />
                ) : (
                  <div className="preview-container">
                    <DocumentPreview document={documentData} businessInfo={user?.businessInfo} />
                    <div className="modal-footer">
                      <button className="btn btn-success" onClick={() => setActiveTab('form')}>
                        Edit Document
                      </button>
                      <a 
                        href={`http://localhost:5000/api/documents/${documentData?._id}/pdf`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-success"
                      >
                        Download PDF
                      </a>
                      <Link to={`/document/${documentData?._id}/email`} className="btn btn-success">
                        Email Document
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DocumentProvider>
  );
};

export default Home; 