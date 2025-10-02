import React from 'react';
import { useParams } from 'react-router-dom';
import Breadcrumb from '../components/ui/Breadcrumb';

const MaintenanceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const breadcrumbItems = [
    { label: 'Maintenance', href: '/maintenance' },
    { label: `Maintenance #${id}` }
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Maintenance Details</h1>
        <p className="text-gray-600">Maintenance details page for ticket #{id} - Implementation in progress</p>
      </div>
    </div>
  );
};

export default MaintenanceDetailsPage;
