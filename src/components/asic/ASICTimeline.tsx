import React from 'react';
import { Clock, User, Activity, DollarSign, MessageSquare, Ticket as TicketIcon } from 'lucide-react';
import type { AuditEvent } from '../../types';

interface ASICTimelineProps {
  events: AuditEvent[];
}

const ASICTimeline: React.FC<ASICTimelineProps> = ({ events }) => {
  const getEventIcon = (eventType: AuditEvent['eventType']) => {
    const iconProps = { className: "h-4 w-4" };
    
    switch (eventType) {
      case 'ticket_created':
      case 'ticket_updated':
        return <TicketIcon {...iconProps} />;
      case 'asic_updated':
        return <Activity {...iconProps} />;
      case 'comment_added':
        return <MessageSquare {...iconProps} />;
      case 'cost_added':
        return <DollarSign {...iconProps} />;
      default:
        return <Activity {...iconProps} />;
    }
  };

  const getEventColor = (eventType: AuditEvent['eventType']) => {
    switch (eventType) {
      case 'ticket_created':
        return 'bg-primary-100 text-primary-700 border-primary-200';
      case 'ticket_updated':
        return 'bg-dark-100 text-dark-700 border-dark-200';
      case 'asic_updated':
        return 'bg-primary-200 text-primary-800 border-primary-300';
      case 'comment_added':
        return 'bg-dark-200 text-dark-800 border-dark-300';
      case 'cost_added':
        return 'bg-dark-300 text-dark-900 border-dark-400';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatMetadata = (metadata: Record<string, any> | undefined, eventType: string) => {
    if (!metadata) return null;

    const formatValue = (key: string, value: any): string => {
      if (value === null || value === undefined) return 'N/A';
      if (typeof value === 'boolean') return value ? 'Yes' : 'No';
      if (typeof value === 'object') {
        // Handle nested objects
        if (Array.isArray(value)) {
          return value.join(', ');
        }
        return JSON.stringify(value, null, 2);
      }
      return String(value);
    };

    const getKeyLabel = (key: string): string => {
      const labels: Record<string, string> = {
        ticketId: 'Ticket ID',
        ticketNumber: 'Ticket #',
        priority: 'Priority',
        status: 'Status',
        action: 'Action',
        updates: 'Changes',
        amount: 'Amount',
        category: 'Category',
        commentId: 'Comment ID',
        asicId: 'ASIC ID',
        clientId: 'Client ID',
        model: 'Model',
        ipAddress: 'IP Address',
        macAddress: 'MAC Address',
        hashRate: 'Hash Rate',
        platformId: 'Platform ID'
      };
      return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
    };

    // Filter out less useful metadata keys
    const hiddenKeys = ['asicId', 'commentId'];
    const filteredMetadata = Object.entries(metadata).filter(([key]) => !hiddenKeys.includes(key));

    if (filteredMetadata.length === 0) return null;

    return (
      <div className="mt-2 space-y-1">
        {filteredMetadata.map(([key, value]) => {
          const formattedValue = formatValue(key, value);
          
          // Special handling for updates object
          if (key === 'updates' && typeof value === 'object' && value !== null) {
            return (
              <div key={key} className="text-xs bg-gray-50 p-2 rounded border">
                <span className="font-medium text-gray-700">Changes Made:</span>
                <div className="mt-1 space-y-1">
                  {Object.entries(value).map(([updateKey, updateValue]) => (
                    <div key={updateKey} className="flex justify-between">
                      <span className="text-gray-600">{getKeyLabel(updateKey)}:</span>
                      <span className="text-gray-900 font-medium">{formatValue(updateKey, updateValue)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          // Skip if value is too long or not useful
          if (formattedValue.length > 100) return null;

          return (
            <div key={key} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{getKeyLabel(key)}:</span>
              <span className="text-gray-900 font-medium ml-2 truncate max-w-32" title={formattedValue}>
                {key === 'amount' && typeof value === 'number' ? `$${value.toFixed(2)}` : formattedValue}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">No events yet</h4>
        <p className="text-gray-500">Activity and changes will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event, index) => (
        <div key={event.id} className="relative flex items-start space-x-3">
          {/* Timeline line */}
          {index < events.length - 1 && (
            <div className="absolute left-6 top-8 w-0.5 h-full bg-gray-200" />
          )}
          
          {/* Event icon */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-full border-2 flex items-center justify-center ${getEventColor(event.eventType)}`}>
            {getEventIcon(event.eventType)}
          </div>
          
          {/* Event details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-gray-900">{event.description}</p>
              <time className="text-sm text-gray-500 flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>
                  {event.createdAt?.toDate 
                   ? event.createdAt.toDate().toLocaleDateString('en-US') + ' ' + event.createdAt.toDate().toLocaleTimeString('en-US', { hour12: true })
                    : event.createdAt instanceof Date 
                     ? event.createdAt.toLocaleDateString('en-US') + ' ' + event.createdAt.toLocaleTimeString('en-US', { hour12: true })
                     : new Date(event.createdAt).toLocaleDateString('en-US') + ' ' + new Date(event.createdAt).toLocaleTimeString('en-US', { hour12: true })
                  }
                </span>
              </time>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3" />
                <span>{event.performedBy}</span>
              </div>
            </div>
            
            {formatMetadata(event.metadata, event.eventType)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ASICTimeline;