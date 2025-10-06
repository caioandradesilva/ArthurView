import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Clock, User, Wrench } from 'lucide-react';
import { MaintenanceFirestoreService } from '../lib/maintenance-firestore';
import { FirestoreService } from '../lib/firestore';
import { useAuth } from '../contexts/AuthContext';
import type { MaintenanceTicket, ASIC, Site, Container, Rack } from '../types';
import Breadcrumb from '../components/ui/Breadcrumb';
import MaintenanceStatusBadge from '../components/maintenance/MaintenanceStatusBadge';

const MaintenanceCalendarPage: React.FC = () => {
  const { userProfile } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'list'>('month');
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>([]);
  const [assetsMap, setAssetsMap] = useState<{ [key: string]: ASIC | Site | Container | Rack }>({});
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const breadcrumbItems = [
    { label: 'Maintenance', href: '/maintenance' },
    { label: 'Calendar' }
  ];

  useEffect(() => {
    if (userProfile) {
      loadMaintenanceTickets();
    }
  }, [userProfile]);

  const generateRecurringOccurrences = (schedule: any): MaintenanceTicket[] => {
    const occurrences: MaintenanceTicket[] = [];

    try {
      if (!schedule.nextScheduledDate) {
        console.error('Schedule missing nextScheduledDate:', schedule);
        return occurrences;
      }

      const startDate = schedule.nextScheduledDate instanceof Date
        ? schedule.nextScheduledDate
        : schedule.nextScheduledDate.toDate();
      const endDate = schedule.endDate
        ? (schedule.endDate instanceof Date ? schedule.endDate : schedule.endDate.toDate())
        : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000);

      console.log('Generating occurrences from', startDate, 'to', endDate);

      let currentDate = new Date(startDate);
      let occurrenceCount = 0;
      const maxOccurrences = 50;

    while (currentDate <= endDate && occurrenceCount < maxOccurrences) {
      occurrences.push({
        id: `recurring-${schedule.id}-${currentDate.getTime()}`,
        ticketNumber: MaintenanceFirestoreService.generateVirtualTicketNumber(schedule.id),
        title: schedule.ticketTemplate.title,
        description: schedule.ticketTemplate.description,
        maintenanceType: schedule.maintenanceType,
        priority: schedule.ticketTemplate.priority,
        status: 'scheduled',
        assetType: schedule.assetType,
        assetId: schedule.assetId,
        siteId: schedule.siteId,
        scheduledDate: new Date(currentDate),
        estimatedDuration: schedule.ticketTemplate.estimatedDuration,
        createdBy: schedule.createdBy,
        createdByRole: 'admin' as any,
        assignedTo: schedule.ticketTemplate.assignedTo,
        partsUsed: [],
        estimatedCost: 0,
        actualCost: 0,
        costCurrency: 'USD',
        isUrgent: false,
        isRecurring: true,
        recurringScheduleId: schedule.id,
        clientVisible: true,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt
      });

      switch (schedule.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + schedule.frequencyValue);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * schedule.frequencyValue));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + schedule.frequencyValue);
          break;
        case 'quarterly':
          currentDate.setMonth(currentDate.getMonth() + (3 * schedule.frequencyValue));
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + schedule.frequencyValue);
          break;
      }

      occurrenceCount++;
    }

    console.log(`Generated ${occurrences.length} occurrences`);
    return occurrences;
    } catch (error) {
      console.error('Error generating recurring occurrences:', error, schedule);
      return occurrences;
    }
  };

  const loadMaintenanceTickets = async () => {
    setLoading(true);
    try {
      const tickets = await MaintenanceFirestoreService.getAllMaintenanceTickets();
      console.log('Loaded tickets:', tickets.length);

      const schedules = await MaintenanceFirestoreService.getActiveMaintenanceSchedules();
      console.log('Loaded schedules:', schedules.length, schedules);

      const expandedTickets = [...tickets];

      for (const schedule of schedules) {
        console.log('Processing schedule:', schedule);
        const occurrences = generateRecurringOccurrences(schedule);
        console.log(`Generated ${occurrences.length} occurrences for schedule ${schedule.id}`, occurrences);
        expandedTickets.push(...occurrences);
      }

      console.log('Total tickets (including recurring):', expandedTickets.length);
      setMaintenanceTickets(expandedTickets);

      const assetIds = [...new Set(tickets.map(t => t.assetId).filter(Boolean))];
      const assetsData: { [key: string]: ASIC | Site | Container | Rack } = {};

      for (const assetId of assetIds) {
        const ticket = tickets.find(t => t.assetId === assetId);
        if (!ticket) continue;

        try {
          let asset: ASIC | Site | Container | Rack | null = null;

          switch (ticket.assetType) {
            case 'asic':
              asset = await FirestoreService.getASICById(assetId);
              break;
            case 'site':
              const sites = await FirestoreService.getSites();
              asset = sites.find(s => s.id === assetId) || null;
              break;
            case 'container':
              const allSites = await FirestoreService.getSites();
              for (const site of allSites) {
                const containers = await FirestoreService.getContainersBySite(site.id);
                asset = containers.find(c => c.id === assetId) || null;
                if (asset) break;
              }
              break;
            case 'rack':
              const sitesForRack = await FirestoreService.getSites();
              for (const site of sitesForRack) {
                const containersForRack = await FirestoreService.getContainersBySite(site.id);
                for (const container of containersForRack) {
                  const racks = await FirestoreService.getRacksByContainer(container.id);
                  asset = racks.find(r => r.id === assetId) || null;
                  if (asset) break;
                }
                if (asset) break;
              }
              break;
          }

          if (asset) {
            assetsData[assetId] = asset;
          }
        } catch (error) {
          console.error(`Error loading asset ${assetId}:`, error);
        }
      }

      setAssetsMap(assetsData);
    } catch (error) {
      console.error('Error loading maintenance tickets:', error);
      setMaintenanceTickets([]);
    } finally {
      setLoading(false);
    }
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(null);
  };

  const getTicketsForDate = (date: Date): MaintenanceTicket[] => {
    return maintenanceTickets.filter(ticket => {
      const ticketDate = ticket.scheduledDate
        ? (ticket.scheduledDate instanceof Date ? ticket.scheduledDate : ticket.scheduledDate.toDate())
        : (ticket.createdAt instanceof Date ? ticket.createdAt : ticket.createdAt.toDate());

      return (
        ticketDate.getFullYear() === date.getFullYear() &&
        ticketDate.getMonth() === date.getMonth() &&
        ticketDate.getDate() === date.getDate()
      );
    });
  };

  const getWeekDates = (date: Date): Date[] => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      dates.push(day);
    }
    return dates;
  };

  const getMaintenanceTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      preventive: 'border-l-4 border-blue-500 bg-blue-50',
      corrective: 'border-l-4 border-orange-500 bg-orange-50',
      predictive: 'border-l-4 border-purple-500 bg-purple-50',
      inspection: 'border-l-4 border-teal-500 bg-teal-50',
      upgrade: 'border-l-4 border-green-500 bg-green-50'
    };
    return colors[type] || 'border-l-4 border-gray-500 bg-gray-50';
  };

  const formatTime = (date: Date | any) => {
    if (!date) return '';
    const d = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const categorizeTickets = () => {
    const now = new Date();
    const upcoming: MaintenanceTicket[] = [];
    const history: MaintenanceTicket[] = [];

    maintenanceTickets.forEach(ticket => {
      const ticketDate = ticket.scheduledDate
        ? (ticket.scheduledDate instanceof Date ? ticket.scheduledDate : ticket.scheduledDate.toDate())
        : (ticket.createdAt instanceof Date ? ticket.createdAt : ticket.createdAt.toDate());

      if (ticketDate >= now && ['scheduled', 'pending_approval', 'approved'].includes(ticket.status)) {
        upcoming.push(ticket);
      } else if (['completed', 'verified', 'closed'].includes(ticket.status)) {
        history.push(ticket);
      }
    });

    return { upcoming, history };
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    const today = new Date();
    const isToday = (date: Date | null) => {
      if (!date) return false;
      return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      );
    };

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200 border border-gray-200 rounded-lg overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-gray-100 p-2 text-center text-sm font-semibold text-gray-700">
            {day}
          </div>
        ))}

        {days.map((date, index) => {
          const tickets = date ? getTicketsForDate(date) : [];
          const isCurrentDay = date ? isToday(date) : false;

          return (
            <div
              key={index}
              className={`bg-white min-h-[100px] p-2 ${date ? 'cursor-pointer hover:bg-gray-50' : ''} ${
                isCurrentDay ? 'bg-blue-50' : ''
              }`}
              onClick={() => date && setSelectedDate(date)}
            >
              {date && (
                <>
                  <div className={`text-sm font-medium mb-1 ${isCurrentDay ? 'text-blue-600' : 'text-gray-900'}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {tickets.slice(0, 2).map(ticket => (
                      <Link
                        key={ticket.id}
                        to={`/maintenance/${ticket.id}`}
                        className={`block text-xs p-1 rounded ${getMaintenanceTypeColor(ticket.maintenanceType)}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="font-medium truncate">#{ticket.ticketNumber}</div>
                        <div className="truncate text-gray-600">{ticket.title}</div>
                      </Link>
                    ))}
                    {tickets.length > 2 && (
                      <div className="text-xs text-gray-500 pl-1">
                        +{tickets.length - 2} more
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekDates = getWeekDates(currentDate);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-4">
          {weekDates.map((date, index) => {
            const tickets = getTicketsForDate(date);
            const isToday =
              date.getDate() === new Date().getDate() &&
              date.getMonth() === new Date().getMonth() &&
              date.getFullYear() === new Date().getFullYear();

            return (
              <div key={index} className="space-y-2">
                <div
                  className={`text-center p-2 rounded-lg ${
                    isToday ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-xs font-medium">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div className="text-lg font-bold">{date.getDate()}</div>
                </div>

                <div className="space-y-2">
                  {tickets.map(ticket => (
                    <Link
                      key={ticket.id}
                      to={`/maintenance/${ticket.id}`}
                      className={`block p-2 rounded-lg ${getMaintenanceTypeColor(ticket.maintenanceType)}`}
                    >
                      <div className="text-xs font-mono text-gray-500">#{ticket.ticketNumber}</div>
                      <div className="text-sm font-medium text-gray-900 truncate">{ticket.title}</div>
                      <div className="text-xs text-gray-600 mt-1">
                        {formatTime(ticket.scheduledDate || ticket.createdAt)}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderListView = () => {
    const { upcoming, history } = categorizeTickets();

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span>Upcoming Maintenance ({upcoming.length})</span>
          </h3>

          {upcoming.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No upcoming maintenance scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming
                .sort((a, b) => {
                  const dateA = a.scheduledDate || a.createdAt;
                  const dateB = b.scheduledDate || b.createdAt;
                  const timeA = dateA instanceof Date ? dateA.getTime() : dateA.toDate().getTime();
                  const timeB = dateB instanceof Date ? dateB.getTime() : dateB.toDate().getTime();
                  return timeA - timeB;
                })
                .map(ticket => (
                  <Link
                    key={ticket.id}
                    to={`/maintenance/${ticket.id}`}
                    className={`block p-4 rounded-lg ${getMaintenanceTypeColor(ticket.maintenanceType)} hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-mono text-gray-500">#{ticket.ticketNumber}</span>
                          <MaintenanceStatusBadge status={ticket.status} size="sm" />
                          <span className="text-xs px-2 py-1 bg-white rounded">
                            {ticket.maintenanceType}
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 mb-1">{ticket.title}</h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{ticket.description}</p>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {(ticket.scheduledDate || ticket.createdAt) instanceof Date
                                ? (ticket.scheduledDate || ticket.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                : (ticket.scheduledDate || ticket.createdAt)
                                    .toDate()
                                    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              {' at '}
                              {formatTime(ticket.scheduledDate || ticket.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <Wrench className="h-3 w-3" />
                            <span>{getAssetName(ticket)}</span>
                          </div>

                          {ticket.assignedTo && ticket.assignedTo.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{ticket.assignedTo.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-gray-500" />
            <span>Maintenance History ({history.length})</span>
          </h3>

          {history.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No completed maintenance yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history
                .sort((a, b) => {
                  const dateA = a.workCompletedAt || a.updatedAt;
                  const dateB = b.workCompletedAt || b.updatedAt;
                  const timeA = dateA instanceof Date ? dateA.getTime() : dateA.toDate().getTime();
                  const timeB = dateB instanceof Date ? dateB.getTime() : dateB.toDate().getTime();
                  return timeB - timeA;
                })
                .slice(0, 10)
                .map(ticket => (
                  <Link
                    key={ticket.id}
                    to={`/maintenance/${ticket.id}`}
                    className="block p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-mono text-gray-500">#{ticket.ticketNumber}</span>
                          <MaintenanceStatusBadge status={ticket.status} size="sm" />
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                            {ticket.maintenanceType}
                          </span>
                        </div>
                        <h4 className="text-base font-semibold text-gray-900 mb-1">{ticket.title}</h4>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-2">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              Completed:{' '}
                              {(ticket.workCompletedAt || ticket.updatedAt) instanceof Date
                                ? (ticket.workCompletedAt || ticket.updatedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                : (ticket.workCompletedAt || ticket.updatedAt)
                                    .toDate()
                                    .toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1">
                            <Wrench className="h-3 w-3" />
                            <span>{getAssetName(ticket)}</span>
                          </div>

                          {ticket.laborHours && (
                            <span className="text-gray-600">{ticket.laborHours}h labor</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}

              {history.length > 10 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Showing 10 most recent. View all in Maintenance page.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 lg:p-6 max-w-7xl mx-auto">
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Maintenance Calendar</h1>
          <p className="text-gray-600 mt-2">View scheduled and historical maintenance</p>
        </div>

        <Link
          to="/maintenance"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mt-4 sm:mt-0"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Maintenance</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => (view === 'week' ? navigateWeek('prev') : navigateMonth('prev'))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>

            <h2 className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
              {view === 'list'
                ? 'All Maintenance'
                : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>

            <button
              onClick={() => (view === 'week' ? navigateWeek('next') : navigateMonth('next'))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={goToToday}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Today
            </button>

            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('month')}
                className={`px-3 py-1 text-sm rounded ${
                  view === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`px-3 py-1 text-sm rounded ${
                  view === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setView('list')}
                className={`px-3 py-1 text-sm rounded ${
                  view === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'list' && renderListView()}
      </div>

      {selectedDate && view === 'month' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-gray-600">
                ×
              </button>
            </div>

            <div className="p-4 space-y-3">
              {getTicketsForDate(selectedDate).length === 0 ? (
                <p className="text-gray-600 text-center py-8">No maintenance scheduled for this date</p>
              ) : (
                getTicketsForDate(selectedDate).map(ticket => (
                  <Link
                    key={ticket.id}
                    to={`/maintenance/${ticket.id}`}
                    className={`block p-3 rounded-lg ${getMaintenanceTypeColor(ticket.maintenanceType)}`}
                    onClick={() => setSelectedDate(null)}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-mono text-gray-500">#{ticket.ticketNumber}</span>
                      <MaintenanceStatusBadge status={ticket.status} size="sm" />
                    </div>
                    <h4 className="font-semibold text-gray-900">{ticket.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                    <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                      <span>{formatTime(ticket.scheduledDate || ticket.createdAt)}</span>
                      <span>•</span>
                      <span>{getAssetName(ticket)}</span>
                      {ticket.assignedTo && ticket.assignedTo.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{ticket.assignedTo.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceCalendarPage;
