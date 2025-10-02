import React, { useState, useEffect } from 'react';
import { Plus, Search, Ticket as TicketIcon, User, Clock, ArrowRight, Cpu, RefreshCw, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import TicketList from '../components/tickets/TicketList';
import CreateTicketModal from '../components/tickets/CreateTicketModal';
import { FirestoreService } from '../lib/firestore';
import { useAuth } from '../contexts/AuthContext';
import type { Ticket, ASIC } from '../types';
import Breadcrumb from '../components/ui/Breadcrumb';

const TicketsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [asicsMap, setAsicsMap] = useState<{ [key: string]: ASIC }>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showMyTickets, setShowMyTickets] = useState(false);

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
  }, [tickets, searchTerm, statusFilter, priorityFilter, showMyTickets]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      // Load first page of tickets
      const ticketsData = await FirestoreService.getTicketsPaginated(20);
      setTickets(ticketsData);
      setHasMore(ticketsData.length === 20);
      
      // Load ASIC data for all tickets
      const asicIds = [...new Set(ticketsData.map(t => t.asicId).filter(Boolean))];
      const asicsData: { [key: string]: ASIC } = {};
      
      for (const asicId of asicIds) {
        try {
          const asic = await FirestoreService.getASICById(asicId);
          if (asic) {
            asicsData[asicId] = asic;
          }
        } catch (error) {
          console.error(`Error loading ASIC ${asicId}:`, error);
        }
      }
      
      setAsicsMap(asicsData);
    } catch (error) {
      console.error('Error loading tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTickets = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    try {
      const lastTicket = tickets[tickets.length - 1];
      const moreTickets = await FirestoreService.getTicketsPaginated(20, lastTicket);
      
      if (moreTickets.length > 0) {
        setTickets(prev => [...prev, ...moreTickets]);
        setHasMore(moreTickets.length === 20);
        
        // Load ASIC data for new tickets
        const newAsicIds = [...new Set(moreTickets.map(t => t.asicId).filter(Boolean))];
        const newAsicsData: { [key: string]: ASIC } = {};
        
        for (const asicId of newAsicIds) {
          if (!asicsMap[asicId]) {
            try {
              const asic = await FirestoreService.getASICById(asicId);
              if (asic) {
                newAsicsData[asicId] = asic;
              }
            } catch (error) {
              console.error(`Error loading ASIC ${asicId}:`, error);
            }
          }
        }
        
        setAsicsMap(prev => ({ ...prev, ...newAsicsData }));
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more tickets:', error);
    } finally {
      setLoadingMore(false);
    }
  };
  const applyFilters = () => {
    let filtered = [...tickets];

    // Exclude closed tickets by default unless status filter is explicitly set to 'closed' or 'all'
    if (statusFilter !== 'closed') {
      filtered = filtered.filter(ticket => ticket.status !== 'closed');
    }

    // Apply "My Tickets" filter
    if (showMyTickets && userProfile) {
      filtered = filtered.filter(ticket =>
        ticket.createdBy === userProfile.name ||
        (ticket.assignedTo && (
          (Array.isArray(ticket.assignedTo) && ticket.assignedTo.includes(userProfile.name)) ||
          (typeof ticket.assignedTo === 'string' && ticket.assignedTo === userProfile.name)
        ))
      );
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower) ||
        ticket.createdBy.toLowerCase().includes(searchLower) ||
        (ticket.assignedTo && ticket.assignedTo.toLowerCase().includes(searchLower)) ||
        (ticket.ticketNumber && ticket.ticketNumber.toString().includes(searchLower)) ||
        (ticket.asicId && asicsMap[ticket.asicId] &&
         (asicsMap[ticket.asicId].macAddress?.toLowerCase().includes(searchLower) ||
          asicsMap[ticket.asicId].serialNumber?.toLowerCase().includes(searchLower)))
      );
    }

    // Apply status filter (if specific status selected)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    setFilteredTickets(filtered);
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600 mt-2">Manage maintenance tickets and issues</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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

          {/* My Tickets Filter */}
          <div>
            <button
              onClick={() => setShowMyTickets(!showMyTickets)}
              className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                showMyTickets
                  ? 'bg-primary-500 text-dark-900 border-primary-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              <span>My Tickets</span>
            </button>
          </div>
        </div>
        
        {/* Filter Results Summary */}
        {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' || showMyTickets) && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredTickets.length} of {tickets.length} tickets
              {showMyTickets && ' (filtered to your tickets)'}
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setShowMyTickets(false);
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      
      <div>
        <TicketList tickets={filteredTickets} asicsMap={asicsMap} loading={loading} />
        
        {/* Load More Button */}
        {hasMore && !loading && filteredTickets.length === tickets.length && (
          <div className="mt-6 text-center">
            <button
              onClick={loadMoreTickets}
              disabled={loadingMore}
              className="px-6 py-3 bg-primary-500 text-dark-900 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loadingMore ? 'Loading...' : 'Load More Tickets'}
            </button>
          </div>
        )}
      </div>

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