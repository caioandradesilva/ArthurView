import React, { useState, useEffect } from 'react';
import { Plus, Search, Ticket as TicketIcon, User, Clock, ArrowRight, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../components/ui/Breadcrumb';
import StatusBadge from '../components/ui/StatusBadge';
import TicketList from '../components/tickets/TicketList';
import CreateTicketModal from '../components/tickets/CreateTicketModal';
import { FirestoreService } from '../lib/firestore';
import { useAuth } from '../contexts/AuthContext';
import type { Ticket, ASIC } from '../types';

const TicketsPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [asicsMap, setAsicsMap] = useState<{ [key: string]: ASIC }>({});
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const breadcrumbItems = [
    { label: 'Tickets' }
  ];

  useEffect(() => {
    if (userProfile) {
      loadTickets();
    }
  }, [userProfile]);

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
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading tickets...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-8 text-center">
            <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets yet</h3>
            <p className="text-gray-500 mb-4">Create your first ticket to get started</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-primary-500 text-dark-900 px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
            >
              Create First Ticket
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                to={`/ticket/${ticket.id}`}
                className="block p-4 lg:p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <TicketIcon className="h-5 w-5 text-gray-400" />
                    <div className="min-w-0">
                      <h3 className="text-lg font-medium text-gray-900 truncate">{ticket.title}</h3>
                      {ticket.isUrgent && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                          URGENT
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400" />
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">{ticket.description}</p>

                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="h-4 w-4" />
                      <span>{ticket.createdBy}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span>
                        {ticket.createdAt 
                          ? (ticket.createdAt.toDate 
                              ? ticket.createdAt.toDate().toLocaleDateString()
                              : new Date(ticket.createdAt).toLocaleDateString())
                          : 'Unknown'
                        }
                      </span>
                    </div>
                    {ticket.asicId && (
                      <div className="flex items-center space-x-1">
                        <Cpu className="h-4 w-4" />
                        <span className="truncate">ASIC: {ticket.asicId.substring(0, 8)}...</span>
                      </div>
                    )}
                    {ticket.assignedTo && ticket.assignedTo.length > 0 && (
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>Assigned: {ticket.assignedTo.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={ticket.priority} size="sm" />
                    <StatusBadge status={ticket.status} size="sm" />
                  </div>
                </div>
                
                {/* Additional info for mobile */}
                <div className="mt-3 lg:hidden">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Site: {ticket.siteId}</span>
                    {ticket.estimatedCost && ticket.estimatedCost > 0 && (
                      <span>Est. Cost: {ticket.costCurrency} {ticket.estimatedCost}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
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