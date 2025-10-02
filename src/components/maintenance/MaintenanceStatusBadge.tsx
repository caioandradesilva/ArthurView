import React from 'react';
import type { MaintenanceTicket } from '../../types';

interface MaintenanceStatusBadgeProps {
  status: MaintenanceTicket['status'];
  size?: 'sm' | 'md' | 'lg';
}

const MaintenanceStatusBadge: React.FC<MaintenanceStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; className: string }> = {
      scheduled: { label: 'Scheduled', className: 'bg-blue-100 text-blue-800' },
      pending_approval: { label: 'Pending Approval', className: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Approved', className: 'bg-green-100 text-green-800' },
      dispatched: { label: 'Dispatched', className: 'bg-indigo-100 text-indigo-800' },
      in_progress: { label: 'In Progress', className: 'bg-orange-100 text-orange-800' },
      awaiting_parts: { label: 'Awaiting Parts', className: 'bg-red-100 text-red-800' },
      completed: { label: 'Completed', className: 'bg-teal-100 text-teal-800' },
      verified: { label: 'Verified', className: 'bg-green-100 text-green-800' },
      closed: { label: 'Closed', className: 'bg-gray-100 text-gray-800' }
    };
    return configs[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const config = getStatusConfig(status);

  return (
    <span className={`inline-flex items-center font-medium rounded ${config.className} ${sizeClasses[size]}`}>
      {config.label}
    </span>
  );
};

export default MaintenanceStatusBadge;
