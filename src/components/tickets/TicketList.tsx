import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket as TicketIcon, User, Clock, ArrowRight } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import type { Ticket } from '../../types';

interface TicketListProps {
  tickets: Ticket[];
  loading: boolean;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
        <p className="text-gray-500">No tickets match your current filters.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 divide-y divide-gray-200">
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          to={`/ticket/${ticket.id}`}
          className="block p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <TicketIcon className="h-5 w-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 truncate">{ticket.title}</h3>
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400" />
          </div>

          <p className="text-gray-600 mb-4 line-clamp-2">{ticket.description}</p>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{ticket.createdBy}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
              <span>ASIC: {ticket.asicId}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <StatusBadge status={ticket.priority} size="sm" />
              <StatusBadge status={ticket.status} size="sm" />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default TicketList;