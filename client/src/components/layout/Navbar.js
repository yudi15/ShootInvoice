import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import './Navbar.css';
import { useEffect } from 'react';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = "/img/logo.png";
    link.type = "image/png";
    document.head.appendChild(link);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMenuOpen(false);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Close menu when clicking on a nav link
  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="navbar-wrapper">
      <nav className="navbar navbar-expand-md navbar-dark header-bg">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <img src="/img/logo.png" width="150" height="60" className="img-fluid" alt="ShootInvoice" />
          </Link>
          
          <button 
            className="navbar-toggler" 
            type="button" 
            onClick={toggleMenu}
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          
          <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`}>
            <div className="navbar-nav ml-auto">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="nav-item nav-link" onClick={closeMenu}>
                    Dashboard
                  </Link>
                  <Link to="/settings" className="nav-item nav-link" onClick={closeMenu}>
                    Settings
                  </Link>
                  <button onClick={handleLogout} className="btn btn-danger my-2 my-sm-0">
                    Logout
                  </button>
                  <span className="nav-item nav-link text-white">{user?.email}</span>
                </>
              ) : (
                <>
                  <Link to="/auth" className="nav-item nav-link" onClick={closeMenu}>
                    Free Signup
                  </Link>
                  <Link to="/auth" className="nav-item nav-link" onClick={closeMenu}>
                    Log In
                  </Link>
                </>
              )}
              {/* Theme Toggle positioned next to Classic Form */}
              <div className="nav-item nav-link theme-toggle-nav-item">
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar; 