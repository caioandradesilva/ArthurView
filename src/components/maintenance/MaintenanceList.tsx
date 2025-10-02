import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, User, Wrench, MapPin, Cpu, Server, Package, Building2, AlertCircle } from 'lucide-react';
import type { MaintenanceTicket, ASIC, Site, Container, Rack } from '../../types';
import MaintenanceStatusBadge from './MaintenanceStatusBadge';

interface MaintenanceListProps {
  tickets: MaintenanceTicket[];
  assetsMap: { [key: string]: ASIC | Site | Container | Rack };
  loading: boolean;
  onRefresh: () => void;
}

const MaintenanceList: React.FC<MaintenanceListProps> = ({ tickets, assetsMap, loading, onRefresh }) => {
  const formatDate = (date: Date | any) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: Date | any) => {
    if (!date) return '';
    const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
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
      low: 'text-gray-600',
      medium: 'text-blue-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const getAssetIcon = (assetType: string) => {
    const icons: Record<string, React.ReactNode> = {
      asic: <Cpu className="h-4 w-4" />,
      rack: <Server className="h-4 w-4" />,
      container: <Package className="h-4 w-4" />,
      site: <Building2 className="h-4 w-4" />
    };
    return icons[assetType] || <MapPin className="h-4 w-4" />;
  };

  const getAssetName = (ticket: MaintenanceTicket): string => {
    const asset = assetsMap[ticket.assetId];
    if (!asset) return ticket.assetId;

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Maintenance Requests</h3>
        <p className="text-gray-600">Get started by creating your first maintenance request.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <Link
          key={ticket.id}
          to={`/maintenance/${ticket.id}`}
          className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-sm font-mono text-gray-500">#{ticket.ticketNumber}</span>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${getMaintenanceTypeColor(ticket.maintenanceType)}`}>
                    {ticket.maintenanceType.charAt(0).toUpperCase() + ticket.maintenanceType.slice(1)}
                  </span>
                  <MaintenanceStatusBadge status={ticket.status} />
                  {ticket.isUrgent && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-xs font-medium">URGENT</span>
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{ticket.title}</h3>
                <p className="text-gray-600 text-sm line-clamp-2">{ticket.description}</p>
              </div>
              <div className={`text-right ml-4 font-semibold ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority.toUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {getAssetIcon(ticket.assetType)}
                <span className="font-medium capitalize">{ticket.assetType}:</span>
                <span>{getAssetName(ticket)}</span>
              </div>

              {ticket.assignedTo && ticket.assignedTo.length > 0 && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>Assigned: {ticket.assignedTo.join(', ')}</span>
                </div>
              )}

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  {ticket.scheduledDate
                    ? `Scheduled: ${formatDate(ticket.scheduledDate)}`
                    : `Created: ${formatDate(ticket.createdAt)}`}
                </span>
              </div>
            </div>

            {ticket.partsUsed && ticket.partsUsed.length > 0 && (
              <div className="mt-3 flex items-center space-x-2 text-sm text-gray-500">
                <Package className="h-4 w-4" />
                <span>{ticket.partsUsed.length} part(s) used</span>
              </div>
            )}

            {(ticket.workStartedAt || ticket.workCompletedAt) && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center space-x-4 text-xs text-gray-500">
                {ticket.workStartedAt && (
                  <span>Started: {formatDate(ticket.workStartedAt)} at {formatTime(ticket.workStartedAt)}</span>
                )}
                {ticket.workCompletedAt && (
                  <span>Completed: {formatDate(ticket.workCompletedAt)} at {formatTime(ticket.workCompletedAt)}</span>
                )}
                {ticket.laborHours && <span>Labor: {ticket.laborHours} hours</span>}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
};

export default MaintenanceList;
