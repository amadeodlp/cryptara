import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './redux/store';

// Views
import Login from './views/Login';
import Home from './views/Home';

// Layout components
import MainLayout from './components/organisms/MainLayout';

const App: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
      
      {/* Protected routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default App;
