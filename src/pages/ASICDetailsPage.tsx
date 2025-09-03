import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Cpu, MapPin, Wifi, Hash, Edit, MessageSquare, DollarSign, Clock, Plus } from 'lucide-react';
import Breadcrumb from '../components/ui/Breadcrumb';
import StatusBadge from '../components/ui/StatusBadge';
import ASICTimeline from '../components/asic/ASICTimeline';
import ASICComments from '../components/asic/ASICComments';
import ASICTickets from '../components/asic/ASICTickets';
import ASICCosts from '../components/asic/ASICCosts';
import EditASICModal from '../components/asic/EditASICModal';
import CreateTicketModal from '../components/tickets/CreateTicketModal';
import { FirestoreService } from '../lib/firestore';
import type { ASIC, Ticket, CostRecord, Comment, AuditEvent } from '../types';

const ASICDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [asic, setASIC] = useState<ASIC | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [costs, setCosts] = useState<CostRecord[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'tickets' | 'comments' | 'costs'>('timeline');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateTicketModalOpen, setIsCreateTicketModalOpen] = useState(false);

  const breadcrumbItems = [
    { label: 'Assets', href: '/assets' },
    { label: asic?.macAddress || asic?.serialNumber || 'Loading...' }
  ];

  useEffect(() => {
    if (id) {
      loadASICData();
    }
  }, [id]);

  const loadASICData = async () => {
    if (!id) return;

    try {
      // Load ASIC by ID
      const asicData = await FirestoreService.getASICById(id);
      if (asicData) {
        setASIC(asicData);
        
        // Load tickets for this ASIC
        const ticketsData = await FirestoreService.getTicketsByASIC(id);
        setTickets(ticketsData);
        
        // Load costs for this ASIC
        const costsData = await FirestoreService.getCostsByASIC(id);
        
        // Also get costs from tickets related to this ASIC
        const ticketCosts: CostRecord[] = [];
        for (const ticket of ticketsData) {
          const ticketCostsData = await FirestoreService.getCostsByTicket(ticket.id);
          ticketCosts.push(...ticketCostsData);
        }
        
        // Combine and deduplicate costs
        const allCosts = [...costsData];
        ticketCosts.forEach(ticketCost => {
          if (!allCosts.some(cost => cost.id === ticketCost.id)) {
            allCosts.push(ticketCost);
          }
        });
        
        // Sort by creation date (newest first)
        allCosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setCosts(allCosts);
        
        // Load comments for this ASIC
        const commentsData = await FirestoreService.getCommentsByASIC(id);
        setComments(commentsData);
        
        // Load audit events for this ASIC
        const auditData = await FirestoreService.getAuditEventsByASIC(id);
        setAuditEvents(auditData);
      } else {
        setASIC(null);
      }
    } catch (error) {
      console.error('Error loading ASIC data:', error);
      setASIC(null);
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

  if (!asic) {
    return (
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <Cpu className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">ASIC not found</h2>
          <p className="text-gray-600 mb-6">The requested ASIC could not be found.</p>
          <Link
            to="/assets"
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Assets</span>
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'tickets', label: 'Tickets', icon: MessageSquare, count: tickets.length },
    { id: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
    { id: 'costs', label: 'Costs', icon: DollarSign, count: costs.length },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-4">
              <Cpu className="h-6 w-6 text-gray-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{asic.macAddress || asic.serialNumber}</h1>
                {asic.macAddress && (
                  <p className="text-sm text-gray-600">Serial: {asic.serialNumber}</p>
                )}
              </div>
              <StatusBadge status={asic.status} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
              <div className="flex items-start space-x-2">
                <Cpu className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-900">MAC Address</span>
                  <p className="text-gray-600 font-mono">{asic.macAddress || 'Not set'}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Cpu className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-900">Model</span>
                  <p className="text-gray-600">{asic.model}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-900">Location</span>
                  <p className="text-gray-600">{asic.location}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Wifi className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-900">IP Address</span>
                  <p className="text-gray-600">{asic.ipAddress}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Hash className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-900">Hash Rate</span>
                  <p className="text-gray-600">{asic.hashRate} TH/s</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 mt-4 lg:mt-0">
            <button
              onClick={() => setIsCreateTicketModalOpen(true)}
             className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-500 text-dark-900 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Ticket</span>
            </button>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit ASIC</span>
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
          {activeTab === 'timeline' && (
            <ASICTimeline events={auditEvents} />
          )}
          
          {activeTab === 'tickets' && (
            <ASICTickets tickets={tickets} asicId={asic.id} />
          )}
          
          {activeTab === 'comments' && (
            <ASICComments comments={comments} asicId={asic.id} />
          )}
          
          {activeTab === 'costs' && (
            <ASICCosts costs={costs} asicId={asic.id} />
          )}
        </div>
      </div>

      {/* Modals */}
      <EditASICModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        asic={asic}
        onSuccess={() => {
          setIsEditModalOpen(false);
          loadASICData();
        }}
      />

      <CreateTicketModal
        isOpen={isCreateTicketModalOpen}
        onClose={() => setIsCreateTicketModalOpen(false)}
        preselectedAsicId={asic.id}
        onSuccess={() => {
          setIsCreateTicketModalOpen(false);
          loadASICData();
        }}
      />
    </div>
  );
};

export default ASICDetailsPage;