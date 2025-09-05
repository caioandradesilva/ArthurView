import React, { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../components/ui/Breadcrumb';
import AssetHierarchy from '../components/assets/AssetHierarchy';
import CreateSiteModal from '../components/assets/CreateSiteModal';
import CreateContainerModal from '../components/assets/CreateContainerModal';
import CreateRackModal from '../components/assets/CreateRackModal';
import CreateASICModal from '../components/assets/CreateASICModal';

const AssetsPage: React.FC = () => {
  const [activeModal, setActiveModal] = useState<'site' | 'container' | 'rack' | 'asic' | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('');
  const [selectedContainerId, setSelectedContainerId] = useState<string>('');

  const breadcrumbItems = [
    { label: 'Assets' }
  ];

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Assets Management</h1>
          <p className="text-gray-600 mt-2">Manage your mining infrastructure hierarchy</p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Link
            to="/bulk-import"
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Bulk Import</span>
          </Link>
          
          <div className="relative">
            <select
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              onChange={(e) => setActiveModal(e.target.value as any)}
              value=""
            >
              <option value="">Add New Asset</option>
              <option value="site">Add Site</option>
              <option value="container">Add Container</option>
              <option value="rack">Add Rack</option>
              <option value="asic">Add ASIC</option>
            </select>
            <Plus className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <AssetHierarchy />

      {/* Modals */}
      <CreateSiteModal
        isOpen={activeModal === 'site'}
        onClose={() => setActiveModal(null)}
        onSuccess={() => {
          setActiveModal(null);
          window.location.reload(); // Refresh to show new data
        }}
      />

      <CreateContainerModal
        isOpen={activeModal === 'container'}
        onClose={() => setActiveModal(null)}
        selectedSiteId={selectedSiteId}
        onSuccess={() => {
          setActiveModal(null);
          window.location.reload();
        }}
      />

      <CreateRackModal
        isOpen={activeModal === 'rack'}
        onClose={() => setActiveModal(null)}
        selectedContainerId={selectedContainerId}
        onSuccess={() => {
          setActiveModal(null);
          window.location.reload();
        }}
      />

      <CreateASICModal
        isOpen={activeModal === 'asic'}
        onClose={() => setActiveModal(null)}
        onSuccess={() => {
          setActiveModal(null);
          window.location.reload();
        }}
      />
    </div>
  );
};

export default AssetsPage;