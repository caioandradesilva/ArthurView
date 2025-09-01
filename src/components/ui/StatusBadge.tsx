import React from 'react';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'maintenance' | 'error' | 'open' | 'in_progress' | 'waiting_parts' | 'resolved' | 'closed' | 'low' | 'medium' | 'high';
  size?: 'sm' | 'md' | 'lg';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const getStatusConfig = (status: string) => {
    const configs = {
      // ASIC Status
      online: { bg: 'bg-primary-100', text: 'text-primary-800', label: 'Online' },
      offline: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Offline' },
      maintenance: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Maintenance' },
      error: { bg: 'bg-dark-100', text: 'text-dark-800', label: 'Error' },
      
      // Ticket Status
      open: { bg: 'bg-primary-100', text: 'text-primary-800', label: 'Open' },
      in_progress: { bg: 'bg-dark-100', text: 'text-dark-800', label: 'In Progress' },
      waiting_parts: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Waiting Parts' },
      resolved: { bg: 'bg-primary-200', text: 'text-primary-900', label: 'Resolved' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Closed' },
      
      // Priority
      low: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Low' },
      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium' },
      high: { bg: 'bg-dark-100', text: 'text-dark-800', label: 'High' },
    };
    
    return configs[status as keyof typeof configs] || configs.offline;
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${config.bg} ${config.text} ${sizeClasses[size]}`}
    >
      {config.label}
    </span>
  );
};

export default StatusBadge;