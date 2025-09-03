import React, { useState, useEffect } from 'react';
import { Server, Ticket, DollarSign, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { FirestoreService } from '../../lib/firestore';
import { useAuth } from '../../contexts/AuthContext';
import type { ASIC, Ticket as TicketType, CostRecord } from '../../types';

const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalASICs: 0,
    onlineASICs: 0,
    openTickets: 0,
    monthlyMaintenanceCost: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentTickets, setRecentTickets] = useState<TicketType[]>([]);
  const [indexCreationTriggered, setIndexCreationTriggered] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Trigger index creation in development
  useEffect(() => {
    if (!indexCreationTriggered && userProfile?.role === 'admin') {
      setIndexCreationTriggered(true);
      // Only run in development
      if (import.meta.env.DEV) {
        console.log('🔥 Triggering index creation queries...');
        FirestoreService.triggerIndexCreation();
      }
    }
  }, [userProfile, indexCreationTriggered]);

  const loadDashboardData = async () => {
    try {
      // Note: In a real implementation, you'd create aggregate queries or use cloud functions
      // For now, this is a simplified version
      setStats({
        totalASICs: 0,
        onlineASICs: 0,
        openTickets: 0,
        monthlyMaintenanceCost: 0
      });
      setRecentTickets([]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    {
      title: 'Total ASICs',
      value: stats.totalASICs,
      icon: Server,
      color: 'bg-primary-500',
      change: '+2.5%',
      changeType: 'positive' as const,
    },
    {
      title: 'Online ASICs',
      value: stats.onlineASICs,
      icon: Activity,
      color: 'bg-green-500',
      change: '+0.8%',
      changeType: 'positive' as const,
    },
    {
      title: 'Open Tickets',
      value: stats.openTickets,
      icon: Ticket,
      color: 'bg-dark-600',
      change: '-12%',
      changeType: 'positive' as const,
    },
    {
      title: 'Monthly Costs',
      value: `$${stats.monthlyMaintenanceCost.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-purple-500',
      change: '+5.2%',
      changeType: 'negative' as const,
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow h-32"></div>
            ))}
          </div>
          <div className="bg-white rounded-lg shadow h-96"></div>
        </div>
      </div>
    );
  }

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
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className={`h-4 w-4 ${card.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={`text-sm font-medium ml-1 ${card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                      {card.change}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">vs last month</span>
                  </div>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className={`h-6 w-6 ${card.color === 'bg-primary-500' ? 'text-dark-900' : 'text-white'}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tickets */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Tickets</h3>
          </div>
          <div className="p-6">
            {recentTickets.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent tickets</p>
                <p className="text-sm text-gray-400 mt-1">New tickets will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTickets.slice(0, 5).map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="font-medium text-gray-900 truncate">{ticket.title}</p>
                      <p className="text-sm text-gray-500">ASIC: {ticket.asicId}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                        ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ticket.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* System Alerts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">System Alerts</h3>
          </div>
          <div className="p-6">
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No active alerts</p>
              <p className="text-sm text-gray-400 mt-1">System is running smoothly</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left">
           <Server className="h-8 w-8 text-primary-500 mb-2" />
            <h4 className="font-medium text-gray-900">Add New ASIC</h4>
            <p className="text-sm text-gray-500">Register a new mining unit</p>
          </button>
          
          <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left">
           <Ticket className="h-8 w-8 text-dark-600 mb-2" />
            <h4 className="font-medium text-gray-900">Create Ticket</h4>
            <p className="text-sm text-gray-500">Report an issue</p>
          </button>
          
          <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left">
           <Activity className="h-8 w-8 text-primary-600 mb-2" />
            <h4 className="font-medium text-gray-900">System Status</h4>
            <p className="text-sm text-gray-500">View overall health</p>
          </button>
          
          <button className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left">
           <DollarSign className="h-8 w-8 text-dark-700 mb-2" />
            <h4 className="font-medium text-gray-900">Cost Reports</h4>
            <p className="text-sm text-gray-500">View maintenance costs</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;