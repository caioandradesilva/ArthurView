import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FirestoreService } from '../../lib/firestore';
import type { Rack, Site, Container } from '../../types';

interface EditRackModalProps {
  isOpen: boolean;
  onClose: () => void;
  rack: Rack;
  onSuccess: () => void;
}

const EditRackModal: React.FC<EditRackModalProps> = ({ isOpen, onClose, rack, onSuccess }) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [formData, setFormData] = useState({
    name: rack.name,
    containerId: rack.containerId,
    siteId: '',
    capacity: rack.capacity
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: rack.name,
        containerId: rack.containerId,
        siteId: '',
        capacity: rack.capacity
      });
      setError('');
      loadSites();
      loadInitialContainer();
    }
  }, [isOpen, rack]);

  useEffect(() => {
    if (formData.siteId) {
      loadContainers(formData.siteId);
    }
  }, [formData.siteId]);

  const loadSites = async () => {
    try {
      const sitesData = await FirestoreService.getSites();
      setSites(sitesData);
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const loadInitialContainer = async () => {
    try {
      // Find the site that contains this rack's container
      const allContainers = await Promise.all(
        sites.map(async (site) => {
          const containers = await FirestoreService.getContainersBySite(site.id);
          return containers.map(container => ({ ...container, siteId: site.id }));
        })
      );
      
      const flatContainers = allContainers.flat();
      const currentContainer = flatContainers.find(c => c.id === rack.containerId);
      
      if (currentContainer) {
        setFormData(prev => ({ ...prev, siteId: currentContainer.siteId }));
        const siteContainers = await FirestoreService.getContainersBySite(currentContainer.siteId);
        setContainers(siteContainers);
      }
    } catch (error) {
      console.error('Error loading initial container:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await FirestoreService.updateRack(rack.id, {
        name: formData.name,
        containerId: formData.containerId,
        capacity: formData.capacity
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error updating rack');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Rack</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="site" className="block text-sm font-medium text-gray-700 mb-2">
              Site *
            </label>
            <select
              id="site"
              required
              value={formData.siteId}
              onChange={(e) => setFormData({ ...formData, siteId: e.target.value, containerId: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a site</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.country})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="container" className="block text-sm font-medium text-gray-700 mb-2">
              Container *
            </label>
            <select
              id="container"
              required
              value={formData.containerId}
              onChange={(e) => setFormData({ ...formData, containerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={!formData.siteId}
            >
              <option value="">Select a container</option>
              {containers.map((container) => (
                <option key={container.id} value={container.id}>
                  {container.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Rack Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Rack 01, Rack 02"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: Rack XX (e.g., Rack 01)
            </p>
          </div>

          <div>
            <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-2">
              Capacity (number of ASICs)
            </label>
            <input
              type="number"
              id="capacity"
              min="1"
              max="100"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 24 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRackModal;