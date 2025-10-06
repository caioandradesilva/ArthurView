import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Ticket as TicketIcon, User, Clock, DollarSign, MessageSquare, Edit } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firestore';
import Breadcrumb from '../components/ui/Breadcrumb';
import StatusBadge from '../components/ui/StatusBadge';
import TicketComments from '../components/tickets/TicketComments';
import TicketCosts from '../components/tickets/TicketCosts';
import EditTicketModal from '../components/tickets/EditTicketModal';
import { FirestoreService } from '../lib/firestore';
import type { Ticket, Comment, CostRecord, ASIC } from '../types';

const TicketDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [asic, setASIC] = useState<ASIC | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [costs, setCosts] = useState<CostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'costs'>('details');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const breadcrumbItems = [
    { label: 'Tickets', href: '/tickets' },
    { label: ticket?.title || 'Loading...' }
  ];

  useEffect(() => {
    if (id) {
      loadTicketData();
    }
  }, [id]);

  const loadTicketData = async () => {
    if (!id) return;

    try {
      // Load ticket by ID using the service
      const ticketData = await FirestoreService.getTicketById(id);
      if (ticketData) {
        setTicket(ticketData);
        
        // Load related ASIC if exists
        if (ticketData.asicId) {
          const asicData = await FirestoreService.getASICById(ticketData.asicId);
          if (asicData) {
            setASIC(asicData);
          }
        }
        
        // Load comments for this ticket
        const commentsData = await FirestoreService.getCommentsByTicket(id);
        setComments(commentsData);
        
        // Load costs for this ticket
        // Load costs for this ticket (both ticket-specific and ASIC-related costs)
        let costsData: CostRecord[] = [];
        
        // Get costs directly associated with this ticket
        const ticketCosts = await FirestoreService.getCostsByTicket(id);
        costsData = [...ticketCosts];
        
        // Also get costs associated with the ASIC if there is one
        if (ticketData.asicId) {
          const asicCosts = await FirestoreService.getCostsByASIC(ticketData.asicId);
          // Filter out costs that are already included from ticket costs
          const uniqueAsicCosts = asicCosts.filter(asicCost => 
            !costsData.some(ticketCost => ticketCost.id === asicCost.id)
          );
          costsData = [...costsData, ...uniqueAsicCosts];
        }
        
        // Sort by creation date (newest first)
        costsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setCosts(costsData);
      } else {
        setTicket(null);
      }
    } catch (error) {
      console.error('Error loading ticket data:', error);
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="h-8 bg-gray-300 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <TicketIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ticket not found</h2>
          <p className="text-gray-600 mb-6">The requested ticket could not be found.</p>
          <Link
            to="/tickets"
           className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Tickets</span>
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'details', label: 'Details', icon: TicketIcon },
    { id: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
    { id: 'costs', label: 'Costs', icon: DollarSign, count: costs.length },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-start space-x-3 mb-4">
              <TicketIcon className="h-6 w-6 text-gray-500 mt-1" />
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
                  <span className="text-lg font-bold bg-primary-100 text-primary-800 px-3 py-1 rounded-lg">
                    #{ticket.ticketNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={ticket.status} />
                  <StatusBadge status={ticket.priority} />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-start space-x-2">
                <User className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-900">Created by</span>
                  <p className="text-gray-600">{ticket.createdBy}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-900">Created</span>
                  <p className="text-gray-600">
                    {ticket.createdAt?.toDate 
                     ? ticket.createdAt.toDate().toLocaleDateString('en-US') + ' ' + ticket.createdAt.toDate().toLocaleTimeString('en-US', { hour12: true })
                      : ticket.createdAt instanceof Date 
                       ? ticket.createdAt.toLocaleDateString('en-US') + ' ' + ticket.createdAt.toLocaleTimeString('en-US', { hour12: true })
                       : new Date(ticket.createdAt).toLocaleDateString('en-US') + ' ' + new Date(ticket.createdAt).toLocaleTimeString('en-US', { hour12: true })
                    }
                  </p>
                </div>
              </div>
              
              {ticket.assignedTo && (
                <div className="flex items-start space-x-2">
                  <User className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-900">Assigned to</span>
                    <p className="text-gray-600">{ticket.assignedTo}</p>
                  </div>
                </div>
              )}
              
              {asic && (
                <div>
                  <span className="font-medium text-gray-900">ASIC</span>
                  <Link
                    to={`/asic/${asic.id}`}
                    className="block text-primary-600 hover:text-primary-700 truncate"
                  >
                    {asic.serialNumber}
                  </Link>
                </div>
              )}

              {ticket.maintenanceTicketId && (
                <div>
                  <span className="font-medium text-gray-900">Maintenance Request</span>
                  <Link
                    to={`/maintenance/${ticket.maintenanceTicketId}`}
                    className="block text-primary-600 hover:text-primary-700 truncate"
                  >
                    View Maintenance
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 lg:mt-0">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Ticket</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'details' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>
            </div>
          )}
          
          {activeTab === 'comments' && (
            <TicketComments comments={comments} ticketId={ticket.id} />
          )}
          
          {activeTab === 'costs' && (
            <TicketCosts costs={costs} ticketId={ticket.id} />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditTicketModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        ticket={ticket}
        onSuccess={() => {
          setIsEditModalOpen(false);
          loadTicketData();
        }}
      />
    </div>
  );
};

export default TicketDetailsPage;