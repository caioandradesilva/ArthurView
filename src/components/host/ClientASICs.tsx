import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, MapPin, Wifi, Hash, Plus, X } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import { FirestoreService } from '../../lib/firestore';
import { useAuth } from '../../contexts/AuthContext';
import type { ASIC } from '../../types';

interface ClientASICsProps {
  asics: ASIC[];
  clientId: string;
}

const ClientASICs: React.FC<ClientASICsProps> = ({ asics, clientId }) => {
  const { userProfile } = useAuth();
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [availableASICs, setAvailableASICs] = useState<ASIC[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadAvailableASICs = async () => {
    setLoading(true);
    try {
      const unassignedASICs = await FirestoreService.getUnassignedASICs();
      setAvailableASICs(unassignedASICs);
    } catch (error) {
      console.error('Error loading available ASICs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignASIC = async (asicId: string) => {
    if (!userProfile) return;
    
    try {
      await FirestoreService.assignASICToClient(asicId, clientId, userProfile.name);
      setShowAssignModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Error assigning ASIC:', error);
    }
  };

  const handleUnassignASIC = async (asicId: string) => {
    if (!userProfile || !confirm('Are you sure you want to unassign this ASIC from the client?')) return;
    
    try {
      await FirestoreService.unassignASICFromClient(asicId, userProfile.name);
      window.location.reload();
    } catch (error) {
      console.error('Error unassigning ASIC:', error);
    }
  };

  const filteredAvailableASICs = availableASICs.filter(asic => 
    !searchTerm || 
    (asic.macAddress && asic.macAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (asic.serialNumber && asic.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (asic.location && asic.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalCapacity = asics.reduce((sum, asic) => sum + asic.hashRate, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Client ASICs</h3>
            <p className="text-2xl font-bold text-gray-900">
              {asics.length} units
            </p>
            <p className="text-sm text-gray-600">
              Total capacity: {totalCapacity.toFixed(1)} TH/s
            </p>
          </div>
          <button
            onClick={() => {
              setShowAssignModal(true);
              loadAvailableASICs();
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-dark-900 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Assign ASIC</span>
          </button>
        </div>
      </div>

      {/* ASICs list */}
      {asics.length === 0 ? (
        <div className="text-center py-8">
          <Cpu className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No ASICs assigned</h4>
          <p className="text-gray-500">ASICs assigned to this client will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {asics.map((asic) => (
            <div key={asic.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <Link
                  to={`/asic/${asic.id}`}
                  className="flex items-center space-x-3 flex-1 min-w-0"
                >
                  <Cpu className="h-5 w-5 text-gray-400" />
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">
                      {asic.macAddress || asic.serialNumber}
                    </h4>
                    <p className="text-sm text-gray-600">Serial: {asic.serialNumber}</p>
                  </div>
                </Link>
                <div className="flex items-center space-x-2">
                  <StatusBadge status={asic.status} size="sm" />
                  <button
                    onClick={() => handleUnassignASIC(asic.id)}
                    className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Unassign ASIC"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{asic.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Wifi className="h-3 w-3" />
                  <span>{asic.ipAddress}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Hash className="h-3 w-3" />
                  <span>{asic.hashRate} TH/s</span>
                </div>
                <div className="text-xs text-gray-500">
                  {asic.model}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign ASIC Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Assign ASIC to Client</h2>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search ASICs by MAC, serial, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading available ASICs...</p>
                  </div>
                ) : filteredAvailableASICs.length === 0 ? (
                  <div className="text-center py-8">
                    <Cpu className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No available ASICs</h4>
                    <p className="text-gray-500">All ASICs are currently assigned to clients</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredAvailableASICs.map((asic) => (
                      <button
                        key={asic.id}
                        onClick={() => handleAssignASIC(asic.id)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Cpu className="h-5 w-5 text-gray-400" />
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {asic.macAddress || asic.serialNumber}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {asic.location} • {asic.model} • {asic.hashRate} TH/s
                              </p>
                            </div>
                          </div>
                          <StatusBadge status={asic.status} size="sm" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientASICs;