import React, { useState, useEffect } from 'react';
import { Plus, Search, Ticket as TicketIcon, User, Clock, ArrowRight, Cpu, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
            >
import TicketList from '../components/tickets/TicketList';
import CreateTicketModal from '../components/tickets/CreateTicketModal';
import { FirestoreService } from '../lib/firestore';
import { useAuth } from '../contexts/AuthContext';
import type { Ticket, ASIC } from '../types';

const TicketsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [asicsMap, setAsicsMap] = useState<{ [key: string]: ASIC }>({});
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

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
  }, [tickets, searchTerm, statusFilter, priorityFilter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const ticketsData = await FirestoreService.getAllTickets();
      setTickets(ticketsData);
      
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

  const applyFilters = () => {
    let filtered = [...tickets];

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

    // Apply status filter
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
        
        {/* Filter Results Summary */}
        {(searchTerm || statusFilter !== 'all' || priorityFilter !== 'all') && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredTickets.length} of {tickets.length} tickets
            </span>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
      
      <TicketList tickets={filteredTickets} asicsMap={asicsMap} loading={loading} />

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