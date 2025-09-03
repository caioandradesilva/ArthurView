import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { FirestoreService } from '../../lib/firestore';
import { useAuth } from '../../contexts/AuthContext';
import type { ASIC, Site } from '../../types';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedAsicId?: string;
}

const CreateTicketModal: React.FC<CreateTicketModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  preselectedAsicId 
}) => {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    asicId: preselectedAsicId || ''
  });
  const [asicSearchTerm, setAsicSearchTerm] = useState('');
  const [asicSearchResults, setAsicSearchResults] = useState<ASIC[]>([]);
  const [selectedAsic, setSelectedAsic] = useState<ASIC | null>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && preselectedAsicId) {
      setFormData(prev => ({ ...prev, asicId: preselectedAsicId }));
      loadPreselectedAsic();
    }
    if (isOpen) {
      loadSites();
    }
  }, [isOpen, preselectedAsicId]);

  useEffect(() => {
    if (asicSearchTerm.length >= 3) {
      searchASICs();
    } else {
      setAsicSearchResults([]);
    }
  }, [asicSearchTerm]);

  const loadSites = async () => {
    try {
      const sitesData = await FirestoreService.getSites();
      setSites(sitesData);
    } catch (error) {
      console.error('Error loading sites:', error);
    }
  };

  const loadPreselectedAsic = async () => {
    if (!preselectedAsicId) return;
    try {
      // Load all ASICs to find the preselected one
      const sites = await FirestoreService.getSites();
      let foundAsic: ASIC | null = null;
      
      for (const site of sites && !foundAsic) {
        const containers = await FirestoreService.getContainersBySite(site.id);
        for (const container of containers && !foundAsic) {
          const racks = await FirestoreService.getRacksByContainer(container.id);
          for (const rack of racks && !foundAsic) {
            const asics = await FirestoreService.getASICsByRack(rack.id);
            foundAsic = asics.find(a => a.id === preselectedAsicId) || null;
          }
        }
      }
      
      if (foundAsic) {
        setSelectedAsic(foundAsic);
      }
    } catch (error) {
      console.error('Error loading preselected ASIC:', error);
    }
  };

  const searchASICs = async () => {
    try {
      // Get all ASICs from all sites the user has access to
      const sites = await FirestoreService.getSites();
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
      
      // Filter ASICs based on search term
      const searchLower = asicSearchTerm.toLowerCase();
      const filteredASICs = allASICs.filter(asic => 
        (asic.macAddress && asic.macAddress.toLowerCase().includes(searchLower)) ||
        (asic.serialNumber && asic.serialNumber.toLowerCase().includes(searchLower)) ||
        (asic.ipAddress && asic.ipAddress.toLowerCase().includes(searchLower)) ||
        (asic.location && asic.location.toLowerCase().includes(searchLower)) ||
        (asic.model && asic.model.toLowerCase().includes(searchLower))
      );
      
      setAsicSearchResults(filteredASICs.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Error searching ASICs:', error);
      setAsicSearchResults([]);
    }
  };

  const handleAsicSelect = (asic: ASIC) => {
    setSelectedAsic(asic);
    setFormData({ ...formData, asicId: asic.id });
    setAsicSearchTerm('');
    setAsicSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    
    setLoading(true);
    setError('');

    try {
      // Determine siteId
      let siteId = userProfile.siteIds[0] || sites[0]?.id || '';
      
      if (selectedAsic) {
        // Use the ASIC's site if we have one selected
        const asicSite = sites.find(s => s.id === selectedAsic.siteId);
        if (asicSite) {
          siteId = asicSite.id;
        }
      }

      await FirestoreService.createTicket({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'open',
        asicId: formData.asicId,
        siteId: siteId,
        createdBy: userProfile.name,
        createdBySiteId: siteId,
        assignedTo: [],
        estimatedCost: 0,
        costCurrency: 'USD',
        isUrgent: false,
        clientVisible: userProfile.role !== 'client',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      onSuccess();
      setFormData({ title: '', description: '', priority: 'medium', asicId: preselectedAsicId || '' });
      setSelectedAsic(null);
      setAsicSearchTerm('');
      setAsicSearchResults([]);
    } catch (err: any) {
      setError(err.message || 'Error creating ticket');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Ticket</h2>
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

          {/* ASIC Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select ASIC *
            </label>
            
            {selectedAsic && (
              <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-900">
                      {selectedAsic.macAddress || selectedAsic.serialNumber}
                    </p>
                    <p className="text-sm text-green-700">
                      {selectedAsic.location} • {selectedAsic.model} • {selectedAsic.ipAddress}
                    </p>
                  </div>
                  {!preselectedAsicId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAsic(null);
                        setFormData({ ...formData, asicId: '' });
                      }}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {!preselectedAsicId && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Type at least 3 characters to search ASICs..."
                  value={asicSearchTerm}
                  onChange={(e) => setAsicSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {asicSearchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {asicSearchResults.map((asic) => (
                      <button
                        key={asic.id}
                        type="button"
                        onClick={() => handleAsicSelect(asic)}
                        className="w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">
                          {asic.macAddress || asic.serialNumber}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Serial:</span> {asic.serialNumber} • 
                          <span className="font-medium">Location:</span> {asic.location} • 
                          <span className="font-medium">IP:</span> {asic.ipAddress}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {asic.model} • {asic.hashRate} TH/s • Status: {asic.status}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {asicSearchTerm.length >= 3 && asicSearchResults.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                    <p className="text-sm text-gray-500 text-center">No ASICs found matching your search</p>
                  </div>
                )}
              </div>
            )}
            
            {!formData.asicId && (
              <p className="text-sm text-red-600 mt-1">Please select an ASIC</p>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the issue"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              id="description"
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the issue, symptoms, and any troubleshooting already performed..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priority *
            </label>
            <select
              id="priority"
              required
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="low">Low - Minor issue, no immediate impact</option>
              <option value="medium">Medium - Moderate issue, some impact on operations</option>
              <option value="high">High - Critical issue, significant operational impact</option>
            </select>
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
              disabled={loading || !formData.asicId}
              className="flex-1 px-4 py-2 bg-primary-500 text-dark-900 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;