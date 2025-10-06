import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Wrench, Clock, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MaintenanceFirestoreService } from '../lib/maintenance-firestore';
import { FirestoreService } from '../lib/firestore';
import { useAuth } from '../contexts/AuthContext';
import type { MaintenanceTicket, ASIC, Site, Container, Rack } from '../types';
import Breadcrumb from '../components/ui/Breadcrumb';
import CreateMaintenanceModal from '../components/maintenance/CreateMaintenanceModal';
import MaintenanceList from '../components/maintenance/MaintenanceList';

const MaintenancePage: React.FC = () => {
  const { userProfile } = useAuth();
  const [maintenanceTickets, setMaintenanceTickets] = useState<MaintenanceTicket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<MaintenanceTicket[]>([]);
  const [assetsMap, setAssetsMap] = useState<{ [key: string]: ASIC | Site | Container | Rack }>({});
  const [loading, setLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [stats, setStats] = useState({
    totalMaintenance: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    awaitingParts: 0,
    byType: { preventive: 0, corrective: 0, predictive: 0, inspection: 0, upgrade: 0 }
  });

  const breadcrumbItems = [{ label: 'Maintenance' }];

  useEffect(() => {
    if (userProfile) {
      loadMaintenanceTickets();
      loadStats();
    }
  }, [userProfile]);

  useEffect(() => {
    applyFilters();
  }, [maintenanceTickets, searchTerm, statusFilter, typeFilter, priorityFilter]);

  const loadMaintenanceTickets = async () => {
    setLoading(true);
    try {
      const tickets = await MaintenanceFirestoreService.getAllMaintenanceTickets();
      const schedules = await MaintenanceFirestoreService.getActiveMaintenanceSchedules();
      console.log('MaintenancePage loaded tickets:', tickets);
      console.log('MaintenancePage loaded schedules:', schedules);

      const allTickets = [...tickets];

      for (const schedule of schedules) {
        const nextOccurrence: MaintenanceTicket = {
          id: `recurring-${schedule.id}-${schedule.nextScheduledDate.getTime()}`,
          ticketNumber: 9000 + parseInt(schedule.id.slice(-3), 16) % 1000,
          title: schedule.ticketTemplate.title,
          description: schedule.ticketTemplate.description,
          maintenanceType: schedule.maintenanceType,
          priority: schedule.ticketTemplate.priority,
          status: 'scheduled',
          assetType: schedule.assetType,
          assetId: schedule.assetId,
          siteId: schedule.siteId,
          scheduledDate: schedule.nextScheduledDate,
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
        };
        allTickets.push(nextOccurrence);
      }

      console.log('MaintenancePage total tickets (including recurring):', allTickets.length);
      setMaintenanceTickets(allTickets);

      const assetIds = [...new Set(allTickets.map(t => t.assetId).filter(Boolean))];
      const assetsData: { [key: string]: ASIC | Site | Container | Rack } = {};

      for (const assetId of assetIds) {
        const ticket = allTickets.find(t => t.assetId === assetId);
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

  const loadStats = async () => {
    try {
      const statsData = await MaintenanceFirestoreService.getMaintenanceStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading maintenance stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...maintenanceTickets];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => {
        if (statusFilter === 'scheduled') {
          return ['scheduled', 'pending_approval', 'approved'].includes(ticket.status);
        } else if (statusFilter === 'in_progress') {
          return ['in_progress', 'dispatched'].includes(ticket.status);
        } else if (statusFilter === 'completed') {
          return ['completed', 'verified', 'closed'].includes(ticket.status);
        } else if (statusFilter === 'awaiting_parts') {
          return ticket.status === 'awaiting_parts';
        }
        return ticket.status === statusFilter;
      });
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.maintenanceType === typeFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter);
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(ticket =>
        ticket.title.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower) ||
        ticket.createdBy.toLowerCase().includes(searchLower) ||
        ticket.ticketNumber.toString().includes(searchLower) ||
        (ticket.assignedTo && ticket.assignedTo.some(name => name.toLowerCase().includes(searchLower)))
      );
    }

    setFilteredTickets(filtered);
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Maintenance</h1>
          <p className="text-gray-600 mt-2">Manage maintenance requests and work orders</p>
        </div>

        <div className="flex space-x-3 mt-4 sm:mt-0">
          <Link
            to="/maintenance/calendar"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
          >
            <Calendar className="h-4 w-4" />
            <span>Calendar</span>
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-primary-500 text-dark-900 px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Request</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.scheduled}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.inProgress}</p>
            </div>
            <Wrench className="h-8 w-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.completed}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Awaiting Parts</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.awaitingParts}</p>
            </div>
            <Package className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search maintenance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_parts">Awaiting Parts</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Types</option>
              <option value="preventive">Preventive</option>
              <option value="corrective">Corrective</option>
              <option value="predictive">Predictive</option>
              <option value="inspection">Inspection</option>
              <option value="upgrade">Upgrade</option>
            </select>
          </div>

          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all') && (
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>Showing {filteredTickets.length} of {maintenanceTickets.length} maintenance requests</span>
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
                setPriorityFilter('all');
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      <MaintenanceList
        tickets={filteredTickets}
        assetsMap={assetsMap}
        loading={loading}
        onRefresh={loadMaintenanceTickets}
      />

      <CreateMaintenanceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          loadMaintenanceTickets();
          loadStats();
        }}
      />
    </div>
  );
};

export default MaintenancePage;
