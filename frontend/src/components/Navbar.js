import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-logo">
          <Link to="/" className="nav-logo-link">
            <span className="logo-arabic">قرآن</span>
            <span className="logo-text">Scheduler</span>
          </Link>
        </div>

        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Dashboard
          </Link>
          <Link 
            to="/surahs" 
            className={`nav-link ${isActive('/surahs') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Surahs
          </Link>
          <Link 
            to="/schedules" 
            className={`nav-link ${isActive('/schedules') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Schedules
          </Link>
          <Link 
            to="/schedules/create" 
            className={`nav-link ${isActive('/schedules/create') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            Create Schedule
          </Link>
          <Link 
            to="/new" 
            className={`nav-link ${isActive('/new') ? 'active' : ''}`}
            onClick={() => setIsMenuOpen(false)}
          >
            New Material
          </Link>
        </div>

        <div className="nav-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;