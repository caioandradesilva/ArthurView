import React, { useState, useEffect } from 'react';
import { X, Search, MapPin, Package, Server, Cpu } from 'lucide-react';
import { MaintenanceFirestoreService } from '../../lib/maintenance-firestore';
import { FirestoreService } from '../../lib/firestore';
import { useAuth } from '../../contexts/AuthContext';
import type { ASIC, Site, Container, Rack, User } from '../../types';

interface CreateMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateMaintenanceModal: React.FC<CreateMaintenanceModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    maintenanceType: 'preventive' as 'preventive' | 'corrective' | 'predictive' | 'inspection' | 'upgrade',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    assetType: 'asic' as 'site' | 'container' | 'rack' | 'asic',
    assetId: '',
    scheduledDate: '',
    estimatedDuration: 0,
    assignedTo: [] as string[],
    isUrgent: false,
    isRecurring: false,
    recurringFrequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly',
    recurringFrequencyValue: 1,
    recurringEndDate: ''
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
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAllData();
      loadAvailableUsers();
    }
  }, [isOpen]);

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

  const loadAvailableUsers = async () => {
    try {
      const users = await FirestoreService.getUsersByRole(['operator', 'admin']);
      setAvailableUsers(users);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const performSearch = async () => {
    try {
      const searchLower = searchTerm.toLowerCase();

      const filteredSites = sites.filter(site =>
        site.name.toLowerCase().includes(searchLower) ||
        site.location.toLowerCase().includes(searchLower)
      );

      const filteredContainers = allContainers.filter(container =>
        container.name.toLowerCase().includes(searchLower)
      );

      const filteredRacks = allRacks.filter(rack =>
        rack.name.toLowerCase().includes(searchLower)
      );

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
    setFormData({ ...formData, assetType: type, assetId: asset.id });
    setSearchTerm('');
    setSearchResults({ sites: [], containers: [], racks: [], asics: [] });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;

    setLoading(true);
    setError('');

    try {
      let siteId = userProfile.siteIds[0] || sites[0]?.id || '';

      if (selectedAsset.data) {
        if (selectedAsset.type === 'site') {
          siteId = selectedAsset.data.id;
        } else if (selectedAsset.type === 'container') {
          siteId = (selectedAsset.data as Container).siteId;
        } else if (selectedAsset.type === 'rack') {
          const container = allContainers.find(c => c.id === (selectedAsset.data as Rack).containerId);
          if (container) {
            siteId = container.siteId;
          }
        } else if (selectedAsset.type === 'asic') {
          siteId = (selectedAsset.data as ASIC).siteId;
        }
      }

      if (formData.isRecurring && formData.scheduledDate) {
        await MaintenanceFirestoreService.createMaintenanceSchedule({
          name: formData.title,
          description: formData.description,
          assetType: formData.assetType,
          assetId: formData.assetId,
          siteId: siteId,
          maintenanceType: formData.maintenanceType as 'preventive' | 'inspection',
          frequency: formData.recurringFrequency,
          frequencyValue: formData.recurringFrequencyValue,
          startDate: new Date(formData.scheduledDate),
          endDate: formData.recurringEndDate ? new Date(formData.recurringEndDate) : undefined,
          nextScheduledDate: new Date(formData.scheduledDate),
          ticketTemplate: {
            title: formData.title,
            description: formData.description,
            priority: formData.priority,
            estimatedDuration: formData.estimatedDuration || 0,
            assignedTo: formData.assignedTo
          },
          isActive: true,
          createdBy: userProfile.name,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        await MaintenanceFirestoreService.createMaintenanceTicket({
          title: formData.title,
          description: formData.description,
          maintenanceType: formData.maintenanceType,
          priority: formData.priority,
          status: 'pending_approval',
          assetType: formData.assetType,
          assetId: formData.assetId,
          siteId: siteId,
          scheduledDate: formData.scheduledDate ? new Date(formData.scheduledDate) : undefined,
          estimatedDuration: formData.estimatedDuration || undefined,
          createdBy: userProfile.name,
          createdByRole: userProfile.role,
          assignedTo: formData.assignedTo,
          partsUsed: [],
          estimatedCost: 0,
          actualCost: 0,
          costCurrency: 'USD',
          isUrgent: formData.isUrgent,
          isRecurring: false,
          clientVisible: userProfile.role !== 'client',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      onSuccess();
      setFormData({
        title: '',
        description: '',
        maintenanceType: 'preventive',
        priority: 'medium',
        assetType: 'asic',
        assetId: '',
        scheduledDate: '',
        estimatedDuration: 0,
        assignedTo: [],
        isUrgent: false,
        isRecurring: false,
        recurringFrequency: 'monthly',
        recurringFrequencyValue: 1,
        recurringEndDate: ''
      });
      setSelectedAsset({ type: null, data: null });
      setSearchTerm('');
    } catch (err: any) {
      setError(err.message || 'Error creating maintenance request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create Maintenance Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Asset *</label>

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
                      {selectedAsset.type === 'site' && ` • ${(selectedAsset.data as Site).location}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAsset({ type: null, data: null });
                      setFormData({ ...formData, assetId: '' });
                    }}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search for asset..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {(searchResults.sites.length > 0 || searchResults.containers.length > 0 || searchResults.racks.length > 0 || searchResults.asics.length > 0) && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
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
                          <div className="text-sm text-gray-600">Site • {site.location}</div>
                        </div>
                      </div>
                    </button>
                  ))}

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
                          <div className="text-sm text-gray-600">Rack</div>
                        </div>
                      </div>
                    </button>
                  ))}

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
                          <div className="font-medium text-gray-900">{asic.macAddress || asic.serialNumber}</div>
                          <div className="text-sm text-gray-600">ASIC • {asic.location}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
            <input
              type="text"
              id="title"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the maintenance"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              id="description"
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the maintenance work required..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="maintenanceType" className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
              <select
                id="maintenanceType"
                required
                value={formData.maintenanceType}
                onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="preventive">Preventive</option>
                <option value="corrective">Corrective</option>
                <option value="predictive">Predictive</option>
                <option value="inspection">Inspection</option>
                <option value="upgrade">Upgrade</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">Priority *</label>
              <select
                id="priority"
                required
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="scheduledDate" className="block text-sm font-medium text-gray-700 mb-2">Scheduled Date</label>
              <input
                type="datetime-local"
                id="scheduledDate"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label htmlFor="estimatedDuration" className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration (hours)
              </label>
              <input
                type="number"
                id="estimatedDuration"
                min="0"
                step="0.5"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData({ ...formData, estimatedDuration: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700 mb-2">
              Assign To
            </label>
            <select
              id="assignedTo"
              value={formData.assignedTo[0] || ''}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value ? [e.target.value] : [] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Unassigned</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.name}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4 border-t border-gray-200 pt-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isUrgent"
                checked={formData.isUrgent}
                onChange={(e) => setFormData({ ...formData, isUrgent: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isUrgent" className="ml-2 block text-sm text-gray-900">
                Mark as urgent/emergency maintenance
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isRecurring" className="ml-2 block text-sm text-gray-900">
                Set as recurring maintenance
              </label>
            </div>

            {formData.isRecurring && (
              <div className="ml-6 space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-700 font-medium">Recurring Schedule Settings</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="recurringFrequency" className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency
                    </label>
                    <select
                      id="recurringFrequency"
                      value={formData.recurringFrequency}
                      onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="recurringFrequencyValue" className="block text-sm font-medium text-gray-700 mb-2">
                      Every
                    </label>
                    <input
                      type="number"
                      id="recurringFrequencyValue"
                      min="1"
                      value={formData.recurringFrequencyValue}
                      onChange={(e) => setFormData({ ...formData, recurringFrequencyValue: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Example: Every 2 {formData.recurringFrequency === 'daily' ? 'days' :
                                formData.recurringFrequency === 'weekly' ? 'weeks' :
                                formData.recurringFrequency === 'monthly' ? 'months' :
                                formData.recurringFrequency === 'quarterly' ? 'quarters' : 'years'}
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="recurringEndDate" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    id="recurringEndDate"
                    value={formData.recurringEndDate}
                    onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Leave empty for indefinite recurrence</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> This will create a schedule that automatically generates maintenance requests
                    based on your chosen frequency. The first maintenance will be created for the scheduled date above.
                  </p>
                </div>
              </div>
            )}
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
              disabled={loading || !formData.assetId}
              className="flex-1 px-4 py-2 bg-primary-500 text-dark-900 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating...' : 'Create Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMaintenanceModal;
