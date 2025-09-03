import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket as TicketIcon, User, Clock, ArrowRight } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import type { Ticket } from '../../types';

interface ASICTicketsProps {
  tickets: Ticket[];
  asicId: string;
}

const ASICTickets: React.FC<ASICTicketsProps> = ({ tickets }) => {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-8">
        <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">No tickets yet</h4>
        <p className="text-gray-500">Tickets for this ASIC will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          to={`/ticket/${ticket.id}`}
          className="block border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <TicketIcon className="h-5 w-5 text-gray-400" />
              <div className="flex items-center space-x-2">
                <h3 className="font-medium text-gray-900">{ticket.title}</h3>
                <span className="text-xs font-semibold bg-primary-100 text-primary-800 px-2 py-1 rounded">
                  #{ticket.ticketNumber || 'N/A'}
                </span>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </div>

          <p className="text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span>{ticket.createdBy}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
              </div>
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

export default ASICTickets;