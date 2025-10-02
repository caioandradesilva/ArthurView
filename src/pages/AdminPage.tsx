import React, { useState, useEffect } from 'react';
import { BarChart3, Wrench, DollarSign, Clock, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MaintenanceFirestoreService } from '../lib/maintenance-firestore';
import Breadcrumb from '../components/ui/Breadcrumb';

const AdminPage: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalMaintenance: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    awaitingParts: 0,
    byType: { preventive: 0, corrective: 0, predictive: 0, inspection: 0, upgrade: 0 }
  });

  const breadcrumbItems = [{ label: 'Admin Dashboard' }];

  useEffect(() => {
    if (userProfile?.role !== 'admin') {
      navigate('/');
      return;
    }
    loadStats();
  }, [userProfile, navigate]);

  const loadStats = async () => {
    try {
      const statsData = await MaintenanceFirestoreService.getMaintenanceStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  if (userProfile?.role !== 'admin') {
    return null;
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />

      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Maintenance analytics and reporting</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Maintenance</h3>
            <Wrench className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.totalMaintenance}</p>
          <p className="text-sm text-gray-500 mt-1">All time</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">In Progress</h3>
            <Clock className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.inProgress}</p>
          <p className="text-sm text-gray-500 mt-1">Active work orders</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Completed</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
          <p className="text-sm text-gray-500 mt-1">Successfully closed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Maintenance by Type</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Preventive</span>
              <span className="text-sm font-semibold text-gray-900">{stats.byType.preventive}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${(stats.byType.preventive / stats.totalMaintenance) * 100 || 0}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-600">Corrective</span>
              <span className="text-sm font-semibold text-gray-900">{stats.byType.corrective}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full"
                style={{ width: `${(stats.byType.corrective / stats.totalMaintenance) * 100 || 0}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-600">Predictive</span>
              <span className="text-sm font-semibold text-gray-900">{stats.byType.predictive}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{ width: `${(stats.byType.predictive / stats.totalMaintenance) * 100 || 0}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-600">Inspection</span>
              <span className="text-sm font-semibold text-gray-900">{stats.byType.inspection}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-teal-500 h-2 rounded-full"
                style={{ width: `${(stats.byType.inspection / stats.totalMaintenance) * 100 || 0}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-600">Upgrade</span>
              <span className="text-sm font-semibold text-gray-900">{stats.byType.upgrade}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${(stats.byType.upgrade / stats.totalMaintenance) * 100 || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Reports</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-gray-900">Operator Performance</span>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-gray-900">Cost Analysis</span>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-gray-900">Response Times</span>
              <Clock className="h-4 w-4 text-gray-400" />
            </button>
            <button className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-gray-900">Asset Downtime</span>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-4">Detailed reporting features coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
