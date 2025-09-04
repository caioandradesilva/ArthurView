import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Package, Server, Cpu } from 'lucide-react';
import { FirestoreService } from '../../lib/firestore';
import { useAuth } from '../../contexts/AuthContext';
import type { ASIC, Site, Container, Rack } from '../../types';

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
    asicId: preselectedAsicId || '',
    assetType: 'none' as 'none' | 'site' | 'container' | 'rack' | 'asic',
    selectedAssetId: preselectedAsicId || ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{
    sites: Site[];
    containers: Container[];
    racks: Rack[];
    asics: ASIC[];
  }>({ sites: [], containers: [], racks: [], asics: [] });
  const [selectedAsset, setSelectedAsset] = useState<{
    type: 'site' | 'container' | 'rack' | 'asic' | null;
    data: Site | Container | Rack | ASIC | null;
  }>({ type: null, data: null });
  const [sites, setSites] = useState<Site[]>([]);
  const [allContainers, setAllContainers] = useState<Container[]>([]);
  const [allRacks, setAllRacks] = useState<Rack[]>([]);
  const [allASICs, setAllASICs] = useState<ASIC[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && preselectedAsicId) {
      setFormData(prev => ({ 
        ...prev, 
        asicId: preselectedAsicId,
        assetType: 'asic',
        selectedAssetId: preselectedAsicId
      }));
      loadPreselectedAsic();
    }
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen, preselectedAsicId]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      performSearch();
    } else {
      setSearchResults({ sites: [], containers: [], racks: [], asics: [] });
    }
  }, [searchTerm]);

  const loadAllData = async () => {
    try {
      const sitesData = await FirestoreService.getSites();
      setSites(sitesData);
      
      // Load all containers, racks, and ASICs
      let allContainersData: Container[] = [];
      let allRacksData: Rack[] = [];
      let allASICsData: ASIC[] = [];
      
      for (const site of sitesData) {
        const containers = await FirestoreService.getContainersBySite(site.id);
        allContainersData = [...allContainersData, ...containers];
        
        for (const container of containers) {
          const racks = await FirestoreService.getRacksByContainer(container.id);
          allRacksData = [...allRacksData, ...racks];
          
          for (const rack of racks) {
            const asics = await FirestoreService.getASICsByRack(rack.id);
            allASICsData = [...allASICsData, ...asics];
          }
        }
      }
      
      setAllContainers(allContainersData);
      setAllRacks(allRacksData);
      setAllASICs(allASICsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadPreselectedAsic = async () => {
    if (!preselectedAsicId) return;
    try {
      const foundAsic = await FirestoreService.getASICById(preselectedAsicId);
      
      if (foundAsic) {
        setSelectedAsset({ type: 'asic', data: foundAsic });
      }
    } catch (error) {
      console.error('Error loading preselected ASIC:', error);
    }
  };

  const performSearch = async () => {
    try {
      const searchLower = searchTerm.toLowerCase();
      
      // Filter sites
      const filteredSites = sites.filter(site => 
        site.name.toLowerCase().includes(searchLower) ||
        site.location.toLowerCase().includes(searchLower)
      );
      
      // Filter containers
      const filteredContainers = allContainers.filter(container => 
        container.name.toLowerCase().includes(searchLower)
      );
      
      // Filter racks
      const filteredRacks = allRacks.filter(rack => 
        rack.name.toLowerCase().includes(searchLower)
      );
      
      // Filter ASICs
      const filteredASICs = allASICs.filter(asic => 
        (asic.macAddress && asic.macAddress.toLowerCase().includes(searchLower)) ||
        (asic.serialNumber && asic.serialNumber.toLowerCase().includes(searchLower)) ||
        (asic.ipAddress && asic.ipAddress.toLowerCase().includes(searchLower)) ||
        (asic.location && asic.location.toLowerCase().includes(searchLower)) ||
        (asic.model && asic.model.toLowerCase().includes(searchLower))
      );
      
      setSearchResults({
        sites: filteredSites.slice(0, 5),
        containers: filteredContainers.slice(0, 5),
        racks: filteredRacks.slice(0, 5),
        asics: filteredASICs.slice(0, 5)
      });
    } catch (error) {
      console.error('Error searching assets:', error);
      setSearchResults({ sites: [], containers: [], racks: [], asics: [] });
    }
  };

  const handleAssetSelect = (type: 'site' | 'container' | 'rack' | 'asic', asset: Site | Container | Rack | ASIC) => {
    setSelectedAsset({ type, data: asset });
    setFormData({ 
      ...formData, 
      assetType: type,
      selectedAssetId: asset.id,
      asicId: type === 'asic' ? asset.id : ''
    });
    setSearchTerm('');
    setSearchResults({ sites: [], containers: [], racks: [], asics: [] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    
    setLoading(true);
    setError('');

    try {
      // Determine siteId
      let siteId = userProfile.siteIds[0] || sites[0]?.id || '';
      
      if (selectedAsset.data) {
        // Determine siteId based on selected asset type
        if (selectedAsset.type === 'site') {
          siteId = selectedAsset.data.id;
        } else if (selectedAsset.type === 'container') {
          siteId = (selectedAsset.data as Container).siteId;
        } else if (selectedAsset.type === 'rack') {
          // Find container first, then site
          const container = allContainers.find(c => c.id === (selectedAsset.data as Rack).containerId);
          if (container) {
            siteId = container.siteId;
          }
        } else if (selectedAsset.type === 'asic') {
          // Find the ASIC's site through rack and container
          const asic = selectedAsset.data as ASIC;
          const rack = allRacks.find(r => r.id === asic.rackId);
          if (rack) {
            const container = allContainers.find(c => c.id === rack.containerId);
            if (container) {
              siteId = container.siteId;
            }
          }
        }
      }

      await FirestoreService.createTicket({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'open',
        asicId: formData.assetType === 'asic' ? formData.selectedAssetId : undefined,
        siteId: siteId,
        createdBy: userProfile.name,
        createdBySiteId: siteId,
        estimatedCost: 0,
        costCurrency: 'USD',
        isUrgent: false,
        clientVisible: userProfile.role !== 'client',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      onSuccess();
      setFormData({ 
        title: '', 
        description: '', 
        priority: 'medium', 
        asicId: preselectedAsicId || '',
        assetType: 'none',
        selectedAssetId: preselectedAsicId || ''
      });
      setSelectedAsset({ type: null, data: null });
      setSearchTerm('');
      setSearchResults({ sites: [], containers: [], racks: [], asics: [] });
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

          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Asset
            </label>
            
            {selectedAsset.data && (
              <div className="mb-3 p-3 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-primary-900">
                      {selectedAsset.type === 'site' && (selectedAsset.data as Site).name}
                      {selectedAsset.type === 'container' && (selectedAsset.data as Container).name}
                      {selectedAsset.type === 'rack' && (selectedAsset.data as Rack).name}
                      {selectedAsset.type === 'asic' && ((selectedAsset.data as ASIC).macAddress || (selectedAsset.data as ASIC).serialNumber)}
                    </p>
                    <p className="text-sm text-primary-700">
                      <span className="capitalize font-medium">{selectedAsset.type}</span>
                      {selectedAsset.type === 'site' && ` • ${(selectedAsset.data as Site).location} • ${(selectedAsset.data as Site).country}`}
                      {selectedAsset.type === 'container' && ` • Container`}
                      {selectedAsset.type === 'rack' && ` • Capacity: ${(selectedAsset.data as Rack).capacity} ASICs`}
                      {selectedAsset.type === 'asic' && ` • ${(selectedAsset.data as ASIC).location} • ${(selectedAsset.data as ASIC).model} • ${(selectedAsset.data as ASIC).ipAddress}`}
                    </p>
                  </div>
                  {!preselectedAsicId && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAsset({ type: null, data: null });
                        setFormData({ ...formData, assetType: 'none', selectedAssetId: '', asicId: '' });
                      }}
                      className="text-primary-600 hover:text-primary-800"
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
                  placeholder="Search sites, containers, racks, or ASICs (optional)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {(searchResults.sites.length > 0 || searchResults.containers.length > 0 || searchResults.racks.length > 0 || searchResults.asics.length > 0) && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {/* Sites */}
                    {searchResults.sites.map((site) => (
                      <button
                        key={`site-${site.id}`}
                        type="button"
                        onClick={() => handleAssetSelect('site', site)}
                        className="w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{site.name}</div>
                            <div className="text-sm text-gray-600">Site • {site.location} • {site.country}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {/* Containers */}
                    {searchResults.containers.map((container) => (
                      <button
                        key={`container-${container.id}`}
                        type="button"
                        onClick={() => handleAssetSelect('container', container)}
                        className="w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{container.name}</div>
                            <div className="text-sm text-gray-600">Container</div>
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {/* Racks */}
                    {searchResults.racks.map((rack) => (
                      <button
                        key={`rack-${rack.id}`}
                        type="button"
                        onClick={() => handleAssetSelect('rack', rack)}
                        className="w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-2">
                          <Server className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">{rack.name}</div>
                            <div className="text-sm text-gray-600">Rack • Capacity: {rack.capacity} ASICs</div>
                          </div>
                        </div>
                      </button>
                    ))}
                    
                    {/* ASICs */}
                    {searchResults.asics.map((asic) => (
                      <button
                        key={`asic-${asic.id}`}
                        type="button"
                        onClick={() => handleAssetSelect('asic', asic)}
                        className="w-full text-left p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center space-x-2">
                          <Cpu className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium text-gray-900">
                              {asic.macAddress || asic.serialNumber}
                            </div>
                            <div className="text-sm text-gray-600">
                              ASIC • <span className="font-medium">Serial:</span> {asic.serialNumber} • 
                              <span className="font-medium">Location:</span> {asic.location} • 
                              <span className="font-medium">IP:</span> {asic.ipAddress}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {asic.model} • {asic.hashRate} TH/s • Status: {asic.status}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {searchTerm.length >= 2 && 
                 searchResults.sites.length === 0 && 
                 searchResults.containers.length === 0 && 
                 searchResults.racks.length === 0 && 
                 searchResults.asics.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                    <p className="text-sm text-gray-500 text-center">No assets found matching your search</p>
                  </div>
                )}
              </div>
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
              placeholder="Brief description of the issue (e.g., 'Rack 01 power issue', 'Container DC_11 cooling problem', 'OHIO site network outage')"
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
              placeholder="Detailed description of the issue, affected equipment (ASIC, rack, container, site), symptoms, and any troubleshooting already performed..."
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
              disabled={loading}
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