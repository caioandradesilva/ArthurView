import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket as TicketIcon, User, Clock, ArrowRight, MapPin, Cpu } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import type { Ticket, ASIC } from '../../types';

interface TicketListProps {
  tickets: Ticket[];
  asicsMap: { [key: string]: ASIC };
  loading: boolean;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, asicsMap, loading }) => {
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
          className="block p-4 lg:p-6 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <TicketIcon className="h-5 w-5 text-gray-400" />
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-medium text-gray-900 truncate">{ticket.title}</h3>
                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    #{ticket.id.slice(-8)}
                  </span>
                </div>
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
                       ? ticket.createdAt.toDate().toLocaleDateString('en-US') + ' ' + ticket.createdAt.toDate().toLocaleTimeString('en-US', { hour12: true })
                       : new Date(ticket.createdAt).toLocaleDateString('en-US') + ' ' + new Date(ticket.createdAt).toLocaleTimeString('en-US', { hour12: true }))
                    : 'Unknown'
                  }
                </span>
              </div>
              {ticket.asicId && (
                <div className="flex items-center space-x-1">
                  <Cpu className="h-4 w-4" />
                  <span className="text-primary-600 truncate">
                    ASIC: {asicsMap[ticket.asicId] 
                      ? (asicsMap[ticket.asicId].macAddress || asicsMap[ticket.asicId].serialNumber)
                      : 'Loading...'
                    }
                  </span>
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
  );
};

export default TicketList;