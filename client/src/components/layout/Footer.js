import React from 'react';
import './Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="footer-content">
        <span className="text-muted">© {year} DocGenPro. All rights reserved.</span>
      </div>
    </footer>
  );
};

export default Footer; 