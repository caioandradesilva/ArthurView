import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import Navigation from './components/layout/Navigation';
import Dashboard from './components/dashboard/Dashboard';
import AssetsPage from './pages/AssetsPage';
import TicketsPage from './pages/TicketsPage';
import SearchPage from './pages/SearchPage';
import ASICDetailsPage from './pages/ASICDetailsPage';
import TicketDetailsPage from './pages/TicketDetailsPage';
import HostPage from './pages/HostPage';
import ClientDetailsPage from './pages/ClientDetailsPage';

const AppContent: React.FC = () => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      {/* Main content */}
      <div className="lg:pl-64">
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/asic/:id" element={<ASICDetailsPage />} />
            <Route path="/ticket/:id" element={<TicketDetailsPage />} />
            <Route path="/host" element={<HostPage />} />
            <Route path="/client/:id" element={<ClientDetailsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;