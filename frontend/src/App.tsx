import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './redux/store';

// Config
import { initializeContracts } from './config/contracts';

// Views
import Login from './views/Login';
import Signup from './views/Signup';
import Home from './views/Home';
import Dashboard from './views/Dashboard';
import Exchange from './views/Exchange';
import Staking from './views/Staking';
import Portfolio from './views/Portfolio';
import Transactions from './views/Transactions';

// Layout components
import MainLayout from './components/organisms/MainLayout';
import { ToastContainer } from './components/atoms/Toast';

const App: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Initialize blockchain contract addresses
    initializeContracts();
  }, []);

  return (
    <>
      <ToastContainer />
      <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/dashboard" />} />
      
      {/* Routes accessible with or without authentication */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/exchange" element={<Exchange />} />
        <Route path="/staking" element={<Staking />} />
        <Route path="/portfolio" element={isAuthenticated ? <Portfolio /> : <Navigate to="/login" />} />
        <Route path="/transactions" element={isAuthenticated ? <Transactions /> : <Navigate to="/login" />} />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
    </>
  );
};

export default App;
