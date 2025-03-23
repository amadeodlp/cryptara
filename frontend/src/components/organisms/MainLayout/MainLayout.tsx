import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/redux/slices/authSlice';
import { RootState } from '@/redux/store';
import NotificationCenter from '@/components/Notifications';
import WalletConnect from '@/components/molecules/WalletConnect';
import './styles.css';

const MainLayout: React.FC = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state: RootState) => state.auth);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="main-layout animated-bg">
      <header className={`main-layout__header ${scrolled ? 'scrolled' : ''}`}>
        <div className="main-layout__header-container">
          <div className="main-layout__logo">
            <span className="logo-text"><span className="text-gradient">Cryptara</span></span>
          </div>
          
          {/* Mobile menu toggle */}
          <button 
            className="mobile-menu-toggle" 
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          {/* Navigation */}
          <nav className={`main-layout__nav ${mobileMenuOpen ? 'open' : ''}`}>
            <ul className="main-layout__nav-list">
              <li className="main-layout__nav-item">
                <NavLink 
                  to="/" 
                  className={({isActive}) => `main-layout__nav-link ${isActive ? 'active' : ''}`}
                >
                  Home
                </NavLink>
              </li>
              <li className="main-layout__nav-item">
                <NavLink 
                  to="/dashboard" 
                  className={({isActive}) => `main-layout__nav-link ${isActive ? 'active' : ''}`}
                >
                  Dashboard
                </NavLink>
              </li>
              <li className="main-layout__nav-item">
                <NavLink 
                  to="/exchange" 
                  className={({isActive}) => `main-layout__nav-link ${isActive ? 'active' : ''}`}
                >
                  Exchange
                </NavLink>
              </li>
              <li className="main-layout__nav-item">
                <NavLink 
                  to="/staking" 
                  className={({isActive}) => `main-layout__nav-link ${isActive ? 'active' : ''}`}
                >
                  Staking
                </NavLink>
              </li>
              <li className="main-layout__nav-item">
                <NavLink 
                  to="/portfolio" 
                  className={({isActive}) => `main-layout__nav-link ${isActive ? 'active' : ''}`}
                >
                  Portfolio
                </NavLink>
              </li>
              <li className="main-layout__nav-item">
                <NavLink 
                  to="/transactions" 
                  className={({isActive}) => `main-layout__nav-link ${isActive ? 'active' : ''}`}
                >
                  Transactions
                </NavLink>
              </li>
            </ul>
          </nav>
          
          {/* User menu */}
          <div className="main-layout__user-menu">
            <WalletConnect />
            <NotificationCenter />
            <div className="user-avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="user-dropdown">
              <span className="main-layout__user-name">{user?.name || 'User'}</span>
              <div className="dropdown-content">
                <NavLink to="/profile" className="dropdown-item">Profile</NavLink>
                <NavLink to="/settings" className="dropdown-item">Settings</NavLink>
                <button onClick={handleLogout} className="dropdown-item logout">
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <main className="main-layout__content">
        <Outlet />
      </main>
      
      <footer className="main-layout__footer">
        <div className="main-layout__footer-container">
          <div className="footer-logo">
            <span className="logo-text"><span className="text-gradient">Cryptara</span></span>
          </div>
          <div className="footer-links">
            <div className="footer-links-column">
              <h4>Company</h4>
              <ul>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            <div className="footer-links-column">
              <h4>Resources</h4>
              <ul>
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Help Center</a></li>
                <li><a href="#">Blog</a></li>
              </ul>
            </div>
            <div className="footer-links-column">
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="main-layout__footer-text">
              &copy; {new Date().getFullYear()} Cryptara. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
