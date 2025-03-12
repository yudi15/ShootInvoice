import React, { useEffect, useContext, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DocumentProvider } from '../context/DocumentContext';
import DocumentContext from '../context/DocumentContext';
import AuthContext from '../context/AuthContext';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './Dashboard.css';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const DocumentList = () => {
  const { documents, getDocuments, loading, error } = useContext(DocumentContext);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  useEffect(() => {
    getDocuments();
  }, []);

  const filteredDocuments = documents.filter(doc => {
    // Apply document type filter
    if (filter !== 'all' && doc.type !== filter) return false;
    
    // Apply search filter
    if (searchTerm && !doc.client.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !doc.number.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  if (loading) return <div>Loading documents...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div className="document-list-container">
      <div className="document-filters">
        <div className="search-box">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search by client name or document number"
          />
        </div>
        <div className="filter-options">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All Documents</option>
            <option value="quotation">Quotations</option>
            <option value="invoice">Invoices</option>
            <option value="receipt">Receipts</option>
            <option value="creditNote">Credit Notes</option>
            <option value="purchaseOrder">Purchase Orders</option>
          </select>
        </div>
      </div>

      {filteredDocuments.length === 0 ? (
        <div className="no-documents">
          <p>No documents found.</p>
          <Link to="/" className="btn">Create New Document</Link>
        </div>
      ) : (
        <div className="document-list">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Number</th>
                <th>Client</th>
                <th>Date</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.map(doc => (
                <tr key={doc._id}>
                  <td className="doc-type">{doc.type}</td>
                  <td>{doc.number}</td>
                  <td>{doc.client.name}</td>
                  <td>{new Date(doc.date).toLocaleDateString()}</td>
                  <td>${doc.total.toFixed(2)}</td>
                  <td className="actions">
                    <Link to={`/document/${doc._id}`} className="btn-view">
                      <span>View</span>
                    </Link>
                    <Link to={`/document/edit/${doc._id}`} className="btn-edit">
                      <span>Edit</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { documents, getDocuments } = useContext(DocumentContext);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    getDocuments();
  }, []);

  // Prepare data for charts
  const documentTypes = ['quotation', 'invoice', 'receipt', 'creditNote', 'purchaseOrder'];
  
  const typeCount = documentTypes.reduce((acc, type) => {
    acc[type] = documents.filter(doc => doc.type === type).length;
    return acc;
  }, {});

  const pieData = {
    labels: ['Quotations', 'Invoices', 'Receipts', 'Credit Notes', 'Purchase Orders'],
    datasets: [
      {
        data: [typeCount.quotation, typeCount.invoice, typeCount.receipt, typeCount.creditNote, typeCount.purchaseOrder],
        backgroundColor: ['#3498db', '#2ecc71', '#f1c40f', '#e74c3c', '#9b59b6'],
        borderWidth: 1,
      },
    ],
  };

  const barData = {
    labels: ['Quotations', 'Invoices', 'Receipts', 'Credit Notes', 'Purchase Orders'],
    datasets: [
      {
        label: 'Document Count',
        data: [typeCount.quotation, typeCount.invoice, typeCount.receipt, typeCount.creditNote, typeCount.purchaseOrder],
        backgroundColor: '#3498db',
      },
    ],
  };

  // Modify the options for both charts to be responsive
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        // Make legend more compact on small screens
        labels: {
          boxWidth: 12,
          padding: 10,
          font: {
            size: 11
          }
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Documents by Type'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0
        }
      }
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <Link to="/" className="btn">Create New Document</Link>
      </div>

      <div className="dashboard-summary">
        <div className="summary-item">
          <h3>Total Documents</h3>
          <p className="count">{documents.length}</p>
        </div>
        
        <div className="summary-item">
          <h3>Quotations</h3>
          <p className="count">{typeCount.quotation}</p>
        </div>
        
        <div className="summary-item">
          <h3>Invoices</h3>
          <p className="count">{typeCount.invoice}</p>
        </div>
        
        <div className="summary-item">
          <h3>Receipts</h3>
          <p className="count">{typeCount.receipt}</p>
        </div>
      </div>

      <div className="dashboard-charts">
        <div className="chart-container">
          <h3>Document Types</h3>
          <div className="pie-chart" style={{ height: '250px' }}>
            <Pie data={pieData} options={pieOptions} />
          </div>
        </div>
        
        <div className="chart-container">
          <h3>Document Distribution</h3>
          <div className="bar-chart" style={{ height: '250px' }}>
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>

      <div className="dashboard-documents">
        <h2>Recent Documents</h2>
        <DocumentList />
      </div>
    </div>
  );
};

const DashboardPage = () => (
  <DocumentProvider>
    <Dashboard />
  </DocumentProvider>
);

export default DashboardPage; 