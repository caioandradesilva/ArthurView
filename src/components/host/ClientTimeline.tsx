import React from 'react';
import { Clock, User, Activity, DollarSign, MessageSquare, Users as UsersIcon } from 'lucide-react';
import type { ClientAuditEvent } from '../../types';

interface ClientTimelineProps {
  events: ClientAuditEvent[];
}

const ClientTimeline: React.FC<ClientTimelineProps> = ({ events }) => {
  const getEventIcon = (eventType: ClientAuditEvent['eventType']) => {
    const iconProps = { className: "h-4 w-4" };
    
    switch (eventType) {
      case 'client_created':
      case 'client_updated':
        return <UsersIcon {...iconProps} />;
      case 'asic_assigned':
      case 'asic_removed':
        return <Activity {...iconProps} />;
      case 'comment_added':
        return <MessageSquare {...iconProps} />;
      case 'contract_updated':
        return <DollarSign {...iconProps} />;
      default:
        return <Activity {...iconProps} />;
    }
  };

  const getEventColor = (eventType: ClientAuditEvent['eventType']) => {
    switch (eventType) {
      case 'client_created':
        return 'bg-primary-100 text-primary-700 border-primary-200';
      case 'client_updated':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'asic_assigned':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'asic_removed':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'comment_added':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'contract_updated':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h4 className="text-lg font-medium text-gray-900 mb-2">No events yet</h4>
        <p className="text-gray-500">Client activity and changes will appear here</p>
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
              
              {event.metadata && (
                <div className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {Object.entries(event.metadata).map(([key, value]) => (
                    <span key={key} className="mr-2">
                      {key}: {String(value)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ClientTimeline;