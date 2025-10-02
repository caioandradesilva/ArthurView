import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import Breadcrumb from '../components/ui/Breadcrumb';

const MaintenanceCalendarPage: React.FC = () => {
  const breadcrumbItems = [
    { label: 'Maintenance', href: '/maintenance' },
    { label: 'Calendar' }
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Maintenance Calendar</h1>
          <p className="text-gray-600 mt-2">View scheduled and ongoing maintenance</p>
        </div>
        <Link
          to="/maintenance"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Maintenance</span>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Calendar View</h2>
          <p className="text-gray-600">Calendar implementation in progress - will show scheduled maintenance</p>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceCalendarPage;
