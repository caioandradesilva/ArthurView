import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Search, Home, Server, Ticket, Users, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { logout, userProfile } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Assets', href: '/assets', icon: Server },
    { name: 'Tickets', href: '/tickets', icon: Ticket },
    { name: 'Search', href: '/search', icon: Search },
  ];

  const isActive = (href: string) => location.pathname === href;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {/* Mobile navigation */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between bg-dark-900 px-4 py-3">
          <div className="flex items-center space-x-3">
            <img 
              src="/Arthur-2-18-1.png" 
              alt="Arthur View" 
              className="w-8 h-8"
            />
            <h1 className="text-white font-semibold">Arthur View</h1>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-300 hover:text-white"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile menu overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-dark-900">
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
              <div className="flex items-center space-x-3">
                <img 
                  src="/Arthur-2-18-1.png" 
                  alt="Arthur View" 
                  className="w-8 h-8"
                />
                <h1 className="text-white font-semibold">Arthur View</h1>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-300 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <nav className="px-4 py-6">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-4 rounded-lg mb-2 transition-colors ${
                      isActive(item.href)
                        ? 'bg-primary-500 text-dark-900'
                        : 'text-gray-300 hover:bg-dark-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}

              <div className="mt-8 pt-6 border-t border-dark-700">
                <div className="flex items-center space-x-3 px-3 py-2 mb-4">
                  <div className="w-8 h-8 bg-dark-700 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {userProfile?.name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{userProfile?.name}</p>
                    <p className="text-xs text-gray-400">{userProfile?.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                >
                  Sign out
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>

      {/* Desktop navigation */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-dark-900">
          <div className="flex items-center px-6 py-6">
            <img 
              src="/Arthur-2-18-1.png" 
              alt="Arthur View" 
              className="w-10 h-10"
            />
            <h1 className="ml-3 text-xl font-semibold text-white">Arthur View</h1>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-500 text-dark-900'
                      : 'text-gray-300 hover:bg-dark-800 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-dark-700">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-dark-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {userProfile?.name?.charAt(0) || 'U'}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{userProfile?.name}</p>
                <p className="text-xs text-gray-400">{userProfile?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;