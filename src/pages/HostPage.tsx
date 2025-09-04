import React, { useState, useEffect } from 'react';
import { Plus, Search, Users, MapPin, Cpu, Calendar, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../components/ui/Breadcrumb';
import CreateClientModal from '../components/host/CreateClientModal';
import { FirestoreService } from '../lib/firestore';
import type { Client } from '../types';

const HostPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const breadcrumbItems = [
    { label: 'Host' }
  ];

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [clients, searchTerm, statusFilter]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const clientsData = await FirestoreService.getAllClients();
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading clients:', error);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...clients];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(client => 
        client.name.toLowerCase().includes(searchLower) ||
        client.location.toLowerCase().includes(searchLower) ||
        client.platformId.toLowerCase().includes(searchLower) ||
        (client.email && client.email.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => 
        statusFilter === 'active' ? client.isActive : !client.isActive
      );
    }

    setFilteredClients(filtered);
  };

  const calculateAging = (clientSince: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - clientSince.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
    }
  };

  const totalStats = {
    totalClients: clients.length,
    activeClients: clients.filter(c => c.isActive).length,
    totalASICs: clients.reduce((sum, c) => sum + c.numberOfASICs, 0),
    totalCapacity: clients.reduce((sum, c) => sum + c.miningCapacity, 0)
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Mining Host Service</h1>
          <p className="text-gray-600 mt-2">Manage your mining hosting clients</p>
        </div>
        
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="mt-4 sm:mt-0 bg-primary-500 text-dark-900 px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalStats.totalClients}</p>
            </div>
            <div className="bg-primary-500 p-3 rounded-lg">
              <Users className="h-6 w-6 text-dark-900" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalStats.activeClients}</p>
            </div>
            <div className="bg-green-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total ASICs</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalStats.totalASICs}</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-lg">
              <Cpu className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalStats.totalCapacity.toFixed(1)} TH/s</p>
            </div>
            <div className="bg-purple-500 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Clients</option>
              <option value="active">Active Clients</option>
              <option value="inactive">Inactive Clients</option>
            </select>
          </div>
        </div>
        
        {/* Filter Results Summary */}
        {(searchTerm || statusFilter !== 'all') && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredClients.length} of {clients.length} clients
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Clients List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="h-5 bg-gray-300 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {clients.length === 0 ? 'No clients yet' : 'No clients found'}
            </h3>
            <p className="text-gray-500 mb-6">
              {clients.length === 0 
                ? 'Start by adding your first mining hosting client' 
                : 'No clients match your current filters.'
              }
            </p>
            {clients.length === 0 && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary-500 text-dark-900 px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
              >
                Add First Client
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredClients.map((client) => (
              <Link
                key={client.id}
                to={`/client/${client.id}`}
                className="block p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-dark-900">
                        {client.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{client.name}</h3>
                      <p className="text-sm text-gray-600">ID: {client.platformId}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      client.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {client.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="font-medium text-gray-900">Location:</span>
                      <p className="text-gray-600">{client.location}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Cpu className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="font-medium text-gray-900">ASICs:</span>
                      <p className="text-gray-600">{client.numberOfASICs} units</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="font-medium text-gray-900">Capacity:</span>
                      <p className="text-gray-600">{client.miningCapacity.toFixed(1)} TH/s</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="font-medium text-gray-900">Client Since:</span>
                      <p className="text-gray-600">{calculateAging(client.clientSince)}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateClientModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          loadClients();
        }}
      />
    </div>
  );
};

export default HostPage;