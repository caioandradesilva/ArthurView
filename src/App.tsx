import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import AssetsPage from './pages/AssetsPage';
import TicketsPage from './pages/TicketsPage';
import SearchPage from './pages/SearchPage';
import ASICDetailsPage from './pages/ASICDetailsPage';
import TicketDetailsPage from './pages/TicketDetailsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  return currentUser ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <LoginForm />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/asic/:id" element={<ASICDetailsPage />} />
        <Route path="/ticket/:id" element={<TicketDetailsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;