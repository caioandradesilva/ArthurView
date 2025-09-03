import React, { useState, useEffect } from 'react';
import { Plus, Filter, Search } from 'lucide-react';
import Breadcrumb from '../components/ui/Breadcrumb';
import TicketList from '../components/tickets/TicketList';
import CreateTicketModal from '../components/tickets/CreateTicketModal';
import { FirestoreService } from '../lib/firestore';
import { useAuth } from '../contexts/AuthContext';
import type { Ticket } from '../types';

const TicketsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [viewFilter, setViewFilter] = useState<string>('all');

  const breadcrumbItems = [
    { label: 'Tickets' }
  ];

  useEffect(() => {
    if (userProfile) {
      loadTickets();
    }
  }, [userProfile]);

  useEffect(() => {
    applyFilters();
  }, [tickets, searchTerm, statusFilter, priorityFilter, viewFilter]);

  const loadTickets = async () => {
    if (!userProfile) return;
    
    try {
      setLoading(true);
      let ticketsData: Ticket[] = [];
      
      if (userProfile.role === 'admin' && userProfile.canViewAllSites) {
        // Admin can see all tickets
        ticketsData = await FirestoreService.getAllTickets();
      } else if (userProfile.siteIds && userProfile.siteIds.length > 0) {
        // Load tickets from user's assigned sites
        for (const siteId of userProfile.siteIds) {
          const siteTickets = await FirestoreService.getTicketsBySite(siteId);
          ticketsData = [...ticketsData, ...siteTickets];
        }
        // Remove duplicates and sort by creation date
        ticketsData = ticketsData
          .filter((ticket, index, self) => self.findIndex(t => t.id === ticket.id) === index)
          .sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
            return dateB.getTime() - dateA.getTime();
          });
      } else {
        // Fallback: load user's own tickets
        ticketsData = await FirestoreService.getTicketsByUserName(userProfile.name);
      }
      
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error loading tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower) ||
        (ticket.asicId && ticket.asicId.toLowerCase().includes(searchLower))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    // View filter (my tickets vs all tickets)
    if (viewFilter === 'my-tickets' && userProfile) {
      filtered = filtered.filter(ticket => 
        ticket.createdBy === userProfile.name || 
        (ticket.assignedTo && ticket.assignedTo.includes(userProfile.name))
      );
    }

    setFilteredTickets(filtered);
  };

  const getTicketStats = () => {
    const total = filteredTickets.length;
    const open = filteredTickets.filter(t => t.status === 'open').length;
    const inProgress = filteredTickets.filter(t => t.status === 'in_progress').length;
    const urgent = filteredTickets.filter(t => t.isUrgent).length;
    
    return { total, open, inProgress, urgent };
  };

  const stats = getTicketStats();

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600 mt-2">
            Manage maintenance tickets and issues
            {stats.total > 0 && (
              <span className="ml-2 text-sm">
                ({stats.total} total, {stats.open} open, {stats.inProgress} in progress
                {stats.urgent > 0 && `, ${stats.urgent} urgent`})
              </span>
            )}
          </p>
        </div>
        
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="mt-4 sm:mt-0 bg-primary-500 text-dark-900 px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Ticket</span>
        </button>
      </div>
      
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets..."
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
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_parts">Waiting Parts</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* View Filter */}
          <div>
            <select
              value={viewFilter}
              onChange={(e) => setViewFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Tickets</option>
              <option value="my-tickets">My Tickets</option>
            </select>
          </div>

          {/* Clear Filters */}
          <div>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setViewFilter('all');
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
        
        {/* Quick stats */}
        {stats.total > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-gray-600">
                <strong>{stats.total}</strong> total tickets
              </span>
              <span className="text-blue-600">
                <strong>{stats.open}</strong> open
              </span>
              <span className="text-yellow-600">
                <strong>{stats.inProgress}</strong> in progress
              </span>
              {stats.urgent > 0 && (
                <span className="text-red-600">
                  <strong>{stats.urgent}</strong> urgent
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <TicketList tickets={filteredTickets} loading={loading} />

      <CreateTicketModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          loadTickets();
        }}
      />
    </div>
  );
};

export default TicketsPage;