import React from 'react';
import { Ticket as TicketIcon, User, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../ui/StatusBadge';
import { useAuth } from '../../contexts/AuthContext';
import { FirestoreService } from '../../lib/firestore';

interface TicketListProps {
  tickets: Ticket[];
  asicsMap: { [key: string]: ASIC };
  loading: boolean;
  onTicketDeleted?: () => void;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, asicsMap, loading, onTicketDeleted }) => {
  const { userProfile } = useAuth();
  const [deletingTicketId, setDeletingTicketId] = React.useState<string | null>(null);

  const canDelete = userProfile?.role === 'admin' || userProfile?.role === 'operator';

  const handleDeleteTicket = async (ticket: Ticket, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!canDelete || !userProfile) return;

    const confirmMessage = `Are you sure you want to delete ticket #${ticket.ticketNumber || 'N/A'}?\n\nTitle: ${ticket.title}\nThis action cannot be undone.`;
    
    if (!confirm(confirmMessage)) return;

    setDeletingTicketId(ticket.id);
    
    try {
      await FirestoreService.deleteTicket(ticket.id, userProfile.email);
      onTicketDeleted?.();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Failed to delete ticket. Please try again.');
    } finally {
      setDeletingTicketId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading tickets...</p>
        </div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-8 text-center">
          <TicketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
          <p className="text-gray-500">Create your first ticket to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="divide-y divide-gray-200">
        {tickets.map((ticket) => {
          const asic = ticket.asicId ? asicsMap[ticket.asicId] : null;
          const isDeleting = deletingTicketId === ticket.id;
          
          return (
            <div key={ticket.id} className="group hover:bg-gray-50 transition-colors">
              <Link 
                to={`/tickets/${ticket.id}`}
                className="block p-4 lg:p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                          <TicketIcon className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-500">
                            #{ticket.ticketNumber || 'N/A'}
                          </span>
                          <StatusBadge status={ticket.status} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {ticket.title}
                        </h3>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {ticket.description}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <User className="h-4 w-4" />
                        <span>{ticket.assignedTo || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          {ticket.createdAt?.toDate ? 
                            ticket.createdAt.toDate().toLocaleDateString() : 
                            'Unknown date'
                          }
                        </span>
                      </div>
                      {asic && (
                        <div className="flex items-center space-x-1">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {asic.serialNumber}
                          </span>
                        </div>
                      )}
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                        ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {ticket.priority} priority
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {canDelete && (
                      <button
                        onClick={(e) => handleDeleteTicket(ticket, e)}
                        disabled={isDeleting}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                        title="Delete ticket"
                      >
                        {isDeleting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TicketList;