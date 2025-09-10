import React, { useState, useEffect } from 'react';
import { Server, Ticket, DollarSign, Activity, TrendingUp, AlertTriangle, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FirestoreService } from '../../lib/firestore';
import { useAuth } from '../../contexts/AuthContext';
import type { Site, ASIC, Ticket as TicketType } from '../../types';

interface DashboardStats {
  totalASICs: number;
  onlineASICs: number;
  offlineASICs: number;
  maintenanceASICs: number;
  errorASICs: number;
  openTickets: number;
  totalSites: number;
}

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalASICs: 0,
    onlineASICs: 0,
    offlineASICs: 0,
    maintenanceASICs: 0,
    errorASICs: 0,
    openTickets: 0,
    totalSites: 0
  });
  const [recentTickets, setRecentTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      loadDashboardData();
    }
  }, [userProfile]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load sites
      const sites = await FirestoreService.getSites();
      
      // Load all ASICs from all sites
      let allASICs: ASIC[] = [];
      for (const site of sites) {
        const containers = await FirestoreService.getContainersBySite(site.id);
        for (const container of containers) {
          const racks = await FirestoreService.getRacksByContainer(container.id);
          for (const rack of racks) {
            const asics = await FirestoreService.getASICsByRack(rack.id);
            allASICs = [...allASICs, ...asics];
          }
        }
      }

      // Calculate ASIC stats
      const onlineASICs = allASICs.filter(asic => asic.status === 'online').length;
      const offlineASICs = allASICs.filter(asic => asic.status === 'offline').length;
      const maintenanceASICs = allASICs.filter(asic => asic.status === 'maintenance').length;
      const errorASICs = allASICs.filter(asic => asic.status === 'error').length;

      // Load recent tickets
      const tickets = await FirestoreService.getAllTickets();
      const openTickets = tickets.filter(ticket => 
        ticket.status === 'open' || ticket.status === 'in_progress'
      ).length;

      setStats({
        totalASICs: allASICs.length,
        onlineASICs,
        offlineASICs,
        maintenanceASICs,
        errorASICs,
        openTickets,
        totalSites: sites.length
      });

      // Set recent tickets (last 5)
      setRecentTickets(tickets.slice(0, 5));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    {
      title: 'Total ASICs',
      value: loading ? '...' : stats.totalASICs.toString(),
      icon: Server,
      color: 'bg-primary-500',
      subtitle: `${stats.onlineASICs} online, ${stats.offlineASICs} offline`,
      link: '/assets'
    },
    {
      title: 'Online ASICs',
      value: loading ? '...' : stats.onlineASICs.toString(),
      icon: Activity,
      color: 'bg-green-500',
      subtitle: `${stats.maintenanceASICs} in maintenance, ${stats.errorASICs} errors`,
      link: '/assets'
    },
    {
      title: 'Open Tickets',
      value: loading ? '...' : stats.openTickets.toString(),
      icon: Ticket,
      color: 'bg-orange-600',
      subtitle: 'Active maintenance requests',
      link: '/tickets'
    },
    {
      title: 'Mining Sites',
      value: loading ? '...' : stats.totalSites.toString(),
      icon: DollarSign,
      color: 'bg-purple-500',
      subtitle: 'Active mining locations',
      link: '/assets'
    },
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of your mining operations</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        {dashboardCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link
              key={index}
              to={card.link}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow block"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${card.color === 'bg-primary-500' ? 'text-dark-900' : 'text-white'}`} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Activity and System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Tickets</h3>
            <Link
              to="/tickets"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              View all
            </Link>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : recentTickets.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent tickets</p>
                <p className="text-sm text-gray-400 mt-1">New tickets will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    to={`/ticket/${ticket.id}`}
                    className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {ticket.title}
                          </p>
                          <span className="text-xs font-semibold bg-primary-100 text-primary-800 px-1.5 py-0.5 rounded">
                            #{ticket.ticketNumber || 'N/A'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {ticket.createdBy} • {ticket.priority} priority
                        </p>
                      </div>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                        ticket.status === 'in_progress' ? 'bg-orange-100 text-orange-800' :
                        ticket.status === 'waiting_parts' ? 'bg-purple-100 text-purple-800' :
                        ticket.status === 'resolved' ? 'bg-indigo-100 text-indigo-800' :
                        ticket.status === 'closed' ? 'bg-gray-900 text-white' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">ASIC Health</span>
                  <span className={`text-sm font-medium ${
                    stats.onlineASICs > stats.offlineASICs ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {stats.totalASICs > 0 
                      ? `${Math.round((stats.onlineASICs / stats.totalASICs) * 100)}% Online`
                      : 'No ASICs'
                    }
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Tickets</span>
                  <span className={`text-sm font-medium ${
                    stats.openTickets === 0 ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {stats.openTickets === 0 ? 'All Clear' : `${stats.openTickets} Open`}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Mining Sites</span>
                  <span className="text-sm font-medium text-gray-900">
                    {stats.totalSites} Active
                  </span>
                </div>

                {stats.errorASICs > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm font-medium text-red-800">
                        {stats.errorASICs} ASIC{stats.errorASICs > 1 ? 's' : ''} need attention
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/assets"
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left block"
          >
            <Server className="h-8 w-8 text-primary-500 mb-2" />
            <h4 className="font-medium text-gray-900">Manage Assets</h4>
            <p className="text-sm text-gray-500">View and manage your mining infrastructure</p>
          </Link>
          
          <Link
            to="/tickets"
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left block"
          >
            <Plus className="h-8 w-8 text-orange-600 mb-2" />
            <h4 className="font-medium text-gray-900">Create Ticket</h4>
            <p className="text-sm text-gray-500">Report an issue or request maintenance</p>
          </Link>
          
          <Link
            to="/search"
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left block"
          >
            <Activity className="h-8 w-8 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900">Search ASICs</h4>
            <p className="text-sm text-gray-500">Find specific mining units</p>
          </Link>
          
          <button
            onClick={loadDashboardData}
            className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left"
          >
            <TrendingUp className="h-8 w-8 text-purple-700 mb-2" />
            <h4 className="font-medium text-gray-900">Refresh Data</h4>
            <p className="text-sm text-gray-500">Update dashboard statistics</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;