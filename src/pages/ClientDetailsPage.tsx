import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, MapPin, Cpu, Calendar, Edit, MessageSquare, Clock, TrendingUp } from 'lucide-react';
import Breadcrumb from '../components/ui/Breadcrumb';
import ClientTimeline from '../components/host/ClientTimeline';
import ClientComments from '../components/host/ClientComments';
import ClientASICs from '../components/host/ClientASICs';
import EditClientModal from '../components/host/EditClientModal';
import { FirestoreService } from '../lib/firestore';
import type { Client, ClientComment, ClientAuditEvent, ASIC } from '../types';

const ClientDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [comments, setComments] = useState<ClientComment[]>([]);
  const [auditEvents, setAuditEvents] = useState<ClientAuditEvent[]>([]);
  const [clientASICs, setClientASICs] = useState<ASIC[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'comments' | 'asics'>('timeline');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const breadcrumbItems = [
    { label: 'Host', href: '/host' },
    { label: client?.name || 'Loading...' }
  ];

  useEffect(() => {
    if (id) {
      loadClientData();
    }
  }, [id]);

  const loadClientData = async () => {
    if (!id) return;

    try {
      // Load client by ID
      const clientData = await FirestoreService.getClientById(id);
      if (clientData) {
        setClient(clientData);
        
        // Load comments for this client
        const commentsData = await FirestoreService.getCommentsByClient(id);
        setComments(commentsData);
        
        // Load audit events for this client
        const auditData = await FirestoreService.getAuditEventsByClient(id);
        setAuditEvents(auditData);
        
        // Load ASICs owned by this client
        const asicsData = await FirestoreService.getASICsByClient(id);
        setClientASICs(asicsData);
      } else {
        setClient(null);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
      setClient(null);
    } finally {
      setLoading(false);
    }
  };

  const calculateAging = (clientSince: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - clientSince.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(diffDays / 365);
      const remainingMonths = Math.floor((diffDays % 365) / 30);
      return `${years} year${years > 1 ? 's' : ''}${remainingMonths > 0 ? ` ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''}`;
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

  if (!client) {
    return (
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Client not found</h2>
          <p className="text-gray-600 mb-6">The requested client could not be found.</p>
          <Link
            to="/host"
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Host</span>
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
    { id: 'asics', label: 'ASICs', icon: Cpu, count: clientASICs.length },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />

      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-xl font-bold text-dark-900">
                  {client.name.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                <p className="text-sm text-gray-600">Client ID: {client.platformId}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    client.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {client.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-900">Location</span>
                  <p className="text-gray-600">{client.location}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Cpu className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-900">ASICs Owned</span>
                  <p className="text-gray-600">{client.numberOfASICs} units</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <TrendingUp className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-900">Mining Capacity</span>
                  <p className="text-gray-600">{client.miningCapacity.toFixed(1)} TH/s</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-900">Client Since</span>
                  <p className="text-gray-600">{calculateAging(client.clientSince)}</p>
                </div>
              </div>
            </div>

            {client.email && (
              <div className="mt-4 text-sm">
                <span className="font-medium text-gray-900">Email:</span>
                <span className="text-gray-600 ml-2">{client.email}</span>
              </div>
            )}
          </div>
          
          <div className="mt-4 lg:mt-0">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit className="h-4 w-4" />
              <span>Edit Client</span>
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
            <ClientTimeline events={auditEvents} />
          )}
          
          {activeTab === 'comments' && (
            <ClientComments comments={comments} clientId={client.id} />
          )}
          
          {activeTab === 'asics' && (
            <ClientASICs asics={clientASICs} clientId={client.id} />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditClientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        client={client}
        onSuccess={() => {
          setIsEditModalOpen(false);
          loadClientData();
        }}
      />
    </div>
  );
};

export default ClientDetailsPage;