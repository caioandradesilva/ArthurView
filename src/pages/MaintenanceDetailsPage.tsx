import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Wrench, User, Clock, DollarSign, MessageSquare, CreditCard as Edit, FileText, CheckCircle, AlertCircle, Calendar, Package } from 'lucide-react';
import { MaintenanceFirestoreService } from '../lib/maintenance-firestore';
import { FirestoreService } from '../lib/firestore';
import { useAuth } from '../contexts/AuthContext';
import Breadcrumb from '../components/ui/Breadcrumb';
import MaintenanceStatusBadge from '../components/maintenance/MaintenanceStatusBadge';
import type { MaintenanceTicket, MaintenanceComment, MaintenanceAuditEvent, ASIC, Site, Container, Rack } from '../types';

const MaintenanceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { userProfile } = useAuth();
  const [ticket, setTicket] = useState<MaintenanceTicket | null>(null);
  const [asset, setAsset] = useState<ASIC | Site | Container | Rack | null>(null);
  const [comments, setComments] = useState<MaintenanceComment[]>([]);
  const [auditEvents, setAuditEvents] = useState<MaintenanceAuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'timeline'>('details');
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState<'note' | 'status_update' | 'escalation' | 'verification'>('note');
  const [submittingComment, setSubmittingComment] = useState(false);

  const breadcrumbItems = [
    { label: 'Maintenance', href: '/maintenance' },
    { label: ticket ? `#${ticket.ticketNumber}` : 'Loading...' }
  ];

  useEffect(() => {
    if (id && !id.startsWith('recurring-')) {
      loadTicketData();
    }
  }, [id]);

  const loadTicketData = async () => {
    if (!id || id.startsWith('recurring-')) return;

    try {
      const ticketData = await MaintenanceFirestoreService.getMaintenanceTicketById(id);
      if (ticketData) {
        setTicket(ticketData);

        if (ticketData.assetId) {
          let assetData: ASIC | Site | Container | Rack | null = null;

          switch (ticketData.assetType) {
            case 'asic':
              assetData = await FirestoreService.getASICById(ticketData.assetId);
              break;
            case 'site':
              const sites = await FirestoreService.getSites();
              assetData = sites.find(s => s.id === ticketData.assetId) || null;
              break;
            case 'container':
              const allSites = await FirestoreService.getSites();
              for (const site of allSites) {
                const containers = await FirestoreService.getContainersBySite(site.id);
                assetData = containers.find(c => c.id === ticketData.assetId) || null;
                if (assetData) break;
              }
              break;
            case 'rack':
              const sitesForRack = await FirestoreService.getSites();
              for (const site of sitesForRack) {
                const containersForRack = await FirestoreService.getContainersBySite(site.id);
                for (const container of containersForRack) {
                  const racks = await FirestoreService.getRacksByContainer(container.id);
                  assetData = racks.find(r => r.id === ticketData.assetId) || null;
                  if (assetData) break;
                }
                if (assetData) break;
              }
              break;
          }

          if (assetData) {
            setAsset(assetData);
          }
        }

        const commentsData = await MaintenanceFirestoreService.getMaintenanceComments(id);
        setComments(commentsData);

        const auditData = await MaintenanceFirestoreService.getMaintenanceAuditEvents(id);
        setAuditEvents(auditData);
      } else {
        setTicket(null);
      }
    } catch (error) {
      console.error('Error loading maintenance ticket data:', error);
      setTicket(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !userProfile || !id) return;

    setSubmittingComment(true);
    try {
      await MaintenanceFirestoreService.createMaintenanceComment({
        maintenanceTicketId: id,
        message: newComment,
        commentType,
        author: userProfile.name,
        authorRole: userProfile.role,
        hasAttachments: false,
        attachmentIds: []
      });

      setNewComment('');
      setCommentType('note');

      const updatedComments = await MaintenanceFirestoreService.getMaintenanceComments(id);
      setComments(updatedComments);

      const updatedAudit = await MaintenanceFirestoreService.getMaintenanceAuditEvents(id);
      setAuditEvents(updatedAudit);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleStatusChange = async (newStatus: MaintenanceTicket['status']) => {
    if (!ticket || !userProfile || !id) return;

    try {
      if (newStatus === 'approved' && userProfile.role === 'admin') {
        await MaintenanceFirestoreService.approveMaintenanceTicket(id, userProfile.name, userProfile.role);
      } else if (newStatus === 'in_progress') {
        await MaintenanceFirestoreService.startMaintenanceWork(id, userProfile.name, userProfile.role as 'operator' | 'admin');
      } else {
        await MaintenanceFirestoreService.updateMaintenanceTicket(
          id,
          { status: newStatus },
          userProfile.name,
          userProfile.role
        );
      }

      await loadTicketData();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getAssetName = (): string => {
    if (!asset || !ticket) return ticket?.assetId || 'Unknown';

    switch (ticket.assetType) {
      case 'asic':
        const asic = asset as ASIC;
        return asic.macAddress || asic.serialNumber || asic.location;
      case 'site':
        return (asset as Site).name;
      case 'container':
        return (asset as Container).name;
      case 'rack':
        return (asset as Rack).name;
      default:
        return ticket.assetId;
    }
  };

  const getMaintenanceTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      preventive: 'bg-blue-100 text-blue-800',
      corrective: 'bg-orange-100 text-orange-800',
      predictive: 'bg-purple-100 text-purple-800',
      inspection: 'bg-teal-100 text-teal-800',
      upgrade: 'bg-green-100 text-green-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getCommentTypeIcon = (type: string) => {
    switch (type) {
      case 'status_update':
        return <AlertCircle className="h-4 w-4" />;
      case 'escalation':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'verification':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const formatDate = (date: Date | any) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
           d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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

  if (!ticket || id?.startsWith('recurring-')) {
    return (
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <Wrench className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {id?.startsWith('recurring-') ? 'Recurring Maintenance' : 'Maintenance not found'}
          </h2>
          <p className="text-gray-600 mb-6">
            {id?.startsWith('recurring-')
              ? 'This is a scheduled occurrence. The actual maintenance ticket will be created when the work begins.'
              : 'The requested maintenance ticket could not be found.'}
          </p>
          <Link
            to="/maintenance"
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Maintenance</span>
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'comments', label: 'Comments', icon: MessageSquare, count: comments.length },
    { id: 'timeline', label: 'Timeline', icon: Clock, count: auditEvents.length },
  ];

  const availableStatusChanges = () => {
    const statuses: MaintenanceTicket['status'][] = [];

    if (ticket.status === 'pending_approval' && userProfile?.role === 'admin') {
      statuses.push('approved');
    }
    if (ticket.status === 'approved' || ticket.status === 'scheduled') {
      statuses.push('in_progress');
    }
    if (ticket.status === 'in_progress') {
      statuses.push('awaiting_parts', 'completed');
    }
    if (ticket.status === 'awaiting_parts') {
      statuses.push('in_progress');
    }
    if (ticket.status === 'completed' && userProfile?.role === 'admin') {
      statuses.push('verified');
    }
    if (ticket.status === 'verified' && userProfile?.role === 'admin') {
      statuses.push('closed');
    }

    return statuses;
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
          <div className="flex-1">
            <div className="flex items-start space-x-3 mb-4">
              <Wrench className="h-6 w-6 text-gray-500 mt-1" />
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
                  <span className="text-lg font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-lg">
                    #{ticket.ticketNumber}
                  </span>
                  {ticket.isUrgent && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded">
                      URGENT
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <MaintenanceStatusBadge status={ticket.status} />
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getMaintenanceTypeColor(ticket.maintenanceType)}`}>
                    {ticket.maintenanceType}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getPriorityColor(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                    {ticket.assetType}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mt-4">
              <div className="flex items-start space-x-2">
                <User className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-900">Created by</span>
                  <p className="text-gray-600">{ticket.createdBy}</p>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-900">Scheduled</span>
                  <p className="text-gray-600">{formatDate(ticket.scheduledDate || ticket.createdAt)}</p>
                </div>
              </div>

              {ticket.assignedTo && ticket.assignedTo.length > 0 && (
                <div className="flex items-start space-x-2">
                  <User className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-900">Assigned to</span>
                    <p className="text-gray-600">{ticket.assignedTo.join(', ')}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-2">
                <Wrench className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <span className="font-medium text-gray-900">Asset</span>
                  <p className="text-gray-600">{getAssetName()}</p>
                </div>
              </div>

              {ticket.estimatedDuration && (
                <div className="flex items-start space-x-2">
                  <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-900">Est. Duration</span>
                    <p className="text-gray-600">{ticket.estimatedDuration} hours</p>
                  </div>
                </div>
              )}

              {ticket.laborHours && (
                <div className="flex items-start space-x-2">
                  <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <span className="font-medium text-gray-900">Actual Labor</span>
                    <p className="text-gray-600">{ticket.laborHours} hours</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 lg:mt-0 flex flex-col space-y-2">
            {availableStatusChanges().length > 0 && (
              <select
                onChange={(e) => handleStatusChange(e.target.value as MaintenanceTicket['status'])}
                value=""
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Change Status...</option>
                {availableStatusChanges().map(status => (
                  <option key={status} value={status}>
                    {status.replace('_', ' ')}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

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
                      ? 'border-blue-500 text-blue-600'
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

        <div className="p-6">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
              </div>

              {ticket.workPerformed && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Work Performed</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{ticket.workPerformed}</p>
                </div>
              )}

              {ticket.partsUsed && ticket.partsUsed.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                    <Package className="h-5 w-5" />
                    <span>Parts Used</span>
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part Number</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {ticket.partsUsed.map((part, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">{part.partName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{part.partNumber || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{part.quantity}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {part.cost ? `${ticket.costCurrency} ${part.cost.toFixed(2)}` : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {(ticket.estimatedCost || ticket.actualCost) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Costs</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {ticket.estimatedCost && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Estimated Cost</p>
                        <p className="text-xl font-bold text-gray-900">
                          {ticket.costCurrency} {ticket.estimatedCost.toFixed(2)}
                        </p>
                      </div>
                    )}
                    {ticket.actualCost && (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-600">Actual Cost</p>
                        <p className="text-xl font-bold text-gray-900">
                          {ticket.costCurrency} {ticket.actualCost.toFixed(2)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {ticket.verificationNotes && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Verification Notes</span>
                  </h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-gray-700">{ticket.verificationNotes}</p>
                    {ticket.verifiedBy && (
                      <p className="text-sm text-gray-600 mt-2">
                        Verified by {ticket.verifiedBy} on {formatDate(ticket.verifiedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-gray-600 text-center py-8">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getCommentTypeIcon(comment.commentType)}
                          <span className="font-medium text-gray-900">{comment.author}</span>
                          <span className="text-xs px-2 py-1 bg-white rounded text-gray-600">
                            {comment.commentType.replace('_', ' ')}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{comment.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Comment</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comment Type</label>
                    <select
                      value={commentType}
                      onChange={(e) => setCommentType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="note">Note</option>
                      <option value="status_update">Status Update</option>
                      <option value="escalation">Escalation</option>
                      <option value="verification">Verification</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add your comment..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleAddComment}
                    disabled={submittingComment || !newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? 'Adding...' : 'Add Comment'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div>
              {auditEvents.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No timeline events yet</p>
              ) : (
                <div className="space-y-4">
                  {auditEvents.map((event, index) => (
                    <div key={event.id} className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          event.eventType === 'completed' || event.eventType === 'verified'
                            ? 'bg-green-100'
                            : event.eventType === 'started' || event.eventType === 'approved'
                            ? 'bg-blue-100'
                            : 'bg-gray-100'
                        }`}>
                          <Clock className={`h-4 w-4 ${
                            event.eventType === 'completed' || event.eventType === 'verified'
                              ? 'text-green-600'
                              : event.eventType === 'started' || event.eventType === 'approved'
                              ? 'text-blue-600'
                              : 'text-gray-600'
                          }`} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{event.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">{event.performedBy}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{formatDate(event.createdAt)}</span>
                        </div>
                        {event.previousValue && event.newValue && (
                          <div className="mt-1 text-xs text-gray-600">
                            <span className="line-through">{event.previousValue}</span>
                            <span className="mx-2">→</span>
                            <span className="font-medium">{event.newValue}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceDetailsPage;
