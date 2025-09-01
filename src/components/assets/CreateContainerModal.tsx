import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { FirestoreService } from '../../lib/firestore';
import type { Site } from '../../types';

interface CreateContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedSiteId?: string;
}

const CreateContainerModal: React.FC<CreateContainerModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  selectedSiteId 
}) => {
  const [sites, setSites] = useState<Site[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    siteId: selectedSiteId || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSites();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedSiteId) {
      setFormData(prev => ({ ...prev, siteId: selectedSiteId }));
    }
  }, [selectedSiteId]);

  const loadSites = async () => {
    try {
      const sitesData = await FirestoreService.getSites();
      setSites(sitesData);
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await FirestoreService.createContainer({
        name: formData.name,
        siteId: formData.siteId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      onSuccess();
      setFormData({ name: '', siteId: selectedSiteId || '' });
    } catch (err: any) {
      setError(err.message || 'Error creating container');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Add New Container</h2>
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
              onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Container Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., DC_11, DC_12"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Format: DC_XX (e.g., DC_11)
            </p>
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
              {loading ? 'Creating...' : 'Create Container'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateContainerModal;