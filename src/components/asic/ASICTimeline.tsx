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
                <span>{new Date(event.createdAt).toLocaleString()}</span>
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

export default ASICTimeline;