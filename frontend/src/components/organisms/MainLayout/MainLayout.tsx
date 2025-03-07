import React from 'react';
import { Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/redux/slices/authSlice';
import { RootState } from '@/redux/store';
import './styles.css';

const MainLayout: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="main-layout">
      <header className="main-layout__header">
        <div className="main-layout__header-container">
          <div className="main-layout__logo">Finance Simplified</div>
          <nav className="main-layout__nav">
            <ul className="main-layout__nav-list">
              <li className="main-layout__nav-item">
                <a href="/" className="main-layout__nav-link">Home</a>
              </li>
            </ul>
          </nav>
          <div className="main-layout__user-menu">
            <span className="main-layout__user-name">{user?.name || 'User'}</span>
            <button onClick={handleLogout} className="main-layout__logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="main-layout__content">
        <Outlet />
      </main>
      
      <footer className="main-layout__footer">
        <div className="main-layout__footer-container">
          <p className="main-layout__footer-text">
            &copy; {new Date().getFullYear()} Finance Simplified
          </p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
