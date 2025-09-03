import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FirestoreService } from '../../lib/firestore';
import type { Site, Container, Rack } from '../../types';

interface CreateASICModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateASICModal: React.FC<CreateASICModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [racks, setRacks] = useState<Rack[]>([]);
  const [formData, setFormData] = useState({
    model: '',
    ipAddress: '',
    macAddress: '',
    serialNumber: '',
    hashRate: 0,
    position: { line: 1, column: 1 },
    siteId: '',
    containerId: '',
    rackId: '',
    status: 'offline' as const
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSites();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.siteId) {
      loadContainers(formData.siteId);
    }
  }, [formData.siteId]);

  useEffect(() => {
    if (formData.containerId) {
      loadRacks(formData.containerId);
    }
  }, [formData.containerId]);

  const loadSites = async () => {
    try {
      const sitesData = await FirestoreService.getSites();
      setSites(sitesData);
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const loadContainers = async (siteId: string) => {
    try {
      const containersData = await FirestoreService.getContainersBySite(siteId);
      setContainers(containersData);
    } catch (error) {
      console.error('Error loading containers:', error);
    }
  };

  const loadRacks = async (containerId: string) => {
    try {
      const racksData = await FirestoreService.getRacksByContainer(containerId);
      setRacks(racksData);
    } catch (error) {
      console.error('Error loading racks:', error);
    }
  };

  const generateLocation = () => {
    const container = containers.find(c => c.id === formData.containerId);
    const rack = racks.find(r => r.id === formData.rackId);
    
    if (container && rack) {
      const containerNum = container.name.replace('DC_', '');
      const rackNum = rack.name.replace('Rack ', '').padStart(2, '0');
      return `MDC-${containerNum}-${rackNum} (${formData.position.line},${formData.position.column})`;
    }
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await FirestoreService.createASIC({
        model: formData.model,
        ipAddress: formData.ipAddress,
        macAddress: formData.macAddress,
        serialNumber: formData.serialNumber,
        hashRate: formData.hashRate,
        position: formData.position,
        location: generateLocation(),
        rackId: formData.rackId,
        status: formData.status,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      onSuccess();
      setFormData({
        model: '',
        ipAddress: '',
        macAddress: '',
        serialNumber: '',
        hashRate: 0,
        position: { line: 1, column: 1 },
        siteId: '',
        containerId: '',
        rackId: '',
        status: 'offline'
      });
    } catch (err: any) {
      setError(err.message || 'Error creating ASIC');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New ASIC</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Location Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Location</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Site *</label>
                <select
                  required
                  value={formData.siteId}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    siteId: e.target.value, 
                    containerId: '', 
                    rackId: '' 
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Container *</label>
                <select
                  required
                  value={formData.containerId}
                  onChange={(e) => setFormData({ ...formData, containerId: e.target.value, rackId: '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={!formData.siteId}
                >
                  <option value="">Select container</option>
                  {containers.map((container) => (
                    <option key={container.id} value={container.id}>
                      {container.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rack *</label>
                <select
                  required
                  value={formData.rackId}
                  onChange={(e) => setFormData({ ...formData, rackId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  disabled={!formData.containerId}
                >
                  <option value="">Select rack</option>
                  {racks.map((rack) => (
                    <option key={rack.id} value={rack.id}>
                      {rack.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Line *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="20"
                  value={formData.position.line}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    position: { ...formData.position, line: parseInt(e.target.value) || 1 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Column *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="20"
                  value={formData.position.column}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    position: { ...formData.position, column: parseInt(e.target.value) || 1 }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {generateLocation() && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Generated Location:</p>
                <p className="text-lg font-mono text-gray-900">{generateLocation()}</p>
              </div>
            )}
          </div>

          {/* ASIC Details Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">ASIC Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Model *</label>
                <input
                  type="text"
                  required
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., Antminer S19 Pro"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number *</label>
                <input
                  type="text"
                  required
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  placeholder="Unique serial number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">IP Address *</label>
                <input
                  type="text"
                  required
                  value={formData.ipAddress}
                  onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                  placeholder="192.168.1.100"
                  pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">MAC Address</label>
                <input
                  type="text"
                  value={formData.macAddress}
                  onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                  placeholder="00:1B:44:11:3A:B7"
                  pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Primary identifier for ASIC (recommended)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hash Rate (TH/s) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.1"
                  value={formData.hashRate}
                  onChange={(e) => setFormData({ ...formData, hashRate: parseFloat(e.target.value) || 0 })}
                  placeholder="110.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Initial Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="offline">Offline</option>
                  <option value="online">Online</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="error">Error</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-500 text-dark-900 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create ASIC'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateASICModal;