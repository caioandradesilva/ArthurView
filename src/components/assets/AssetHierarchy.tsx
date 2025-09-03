import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, MapPin, Package, Server, Cpu, Edit } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FirestoreService } from '../../lib/firestore';
import type { Site, Container, Rack, ASIC } from '../../types';
import StatusBadge from '../ui/StatusBadge';
import EditSiteModal from './EditSiteModal';
import EditContainerModal from './EditContainerModal';
import EditRackModal from './EditRackModal';

interface HierarchyData {
  sites: Site[];
  containers: { [siteId: string]: Container[] };
  racks: { [containerId: string]: Rack[] };
  asics: { [rackId: string]: ASIC[] };
}

const AssetHierarchy: React.FC = () => {
  const [data, setData] = useState<HierarchyData>({
    sites: [],
    containers: {},
    racks: {},
    asics: {}
  });
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set());
  const [editModal, setEditModal] = useState<{
    type: 'site' | 'container' | 'rack' | null;
    item: Site | Container | Rack | null;
  }>({ type: null, item: null });

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const sites = await FirestoreService.getSites();
      setData(prev => ({ ...prev, sites }));
    } catch (error) {
      console.error('Error loading sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContainers = async (siteId: string) => {
    if (data.containers[siteId]) return; // Already loaded
    
    setLoadingNodes(prev => new Set(prev).add(siteId));
    try {
      const containers = await FirestoreService.getContainersBySite(siteId);
      setData(prev => ({
        ...prev,
        containers: { ...prev.containers, [siteId]: containers }
      }));
    } catch (error) {
      console.error('Error loading containers:', error);
    } finally {
      setLoadingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(siteId);
        return newSet;
      });
    }
  };

  const loadRacks = async (containerId: string) => {
    if (data.racks[containerId]) return; // Already loaded
    
    setLoadingNodes(prev => new Set(prev).add(containerId));
    try {
      const racks = await FirestoreService.getRacksByContainer(containerId);
      setData(prev => ({
        ...prev,
        racks: { ...prev.racks, [containerId]: racks }
      }));
    } catch (error) {
      console.error('Error loading racks:', error);
    } finally {
      setLoadingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(containerId);
        return newSet;
      });
    }
  };

  const loadASICs = async (rackId: string) => {
    if (data.asics[rackId]) return; // Already loaded
    
    setLoadingNodes(prev => new Set(prev).add(rackId));
    try {
      const asics = await FirestoreService.getASICsByRack(rackId);
      setData(prev => ({
        ...prev,
        asics: { ...prev.asics, [rackId]: asics }
      }));
    } catch (error) {
      console.error('Error loading ASICs:', error);
    } finally {
      setLoadingNodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(rackId);
        return newSet;
      });
    }
  };

  const toggleNode = async (nodeId: string, nodeType: 'site' | 'container' | 'rack') => {
    const newExpanded = new Set(expandedNodes);
    
    if (newExpanded.has(nodeId)) {
      // Collapse
      newExpanded.delete(nodeId);
    } else {
      // Expand
      newExpanded.add(nodeId);
      
      // Load children data if needed
      if (nodeType === 'site') {
        await loadContainers(nodeId);
      } else if (nodeType === 'container') {
        await loadRacks(nodeId);
      } else if (nodeType === 'rack') {
        await loadASICs(nodeId);
      }
    }
    
    setExpandedNodes(newExpanded);
  };

  const getNodeIcon = (type: 'site' | 'container' | 'rack' | 'asic') => {
    const iconProps = { className: "h-4 w-4" };
    
    switch (type) {
      case 'site': return <MapPin {...iconProps} />;
      case 'container': return <Package {...iconProps} />;
      case 'rack': return <Server {...iconProps} />;
      case 'asic': return <Cpu {...iconProps} />;
      default: return <Server {...iconProps} />;
    }
  };

  const renderSite = (site: Site) => {
    const isExpanded = expandedNodes.has(site.id);
    const isLoading = loadingNodes.has(site.id);
    const containers = data.containers[site.id] || [];

    return (
      <div key={site.id} className="mb-1">
        <div
          className="flex items-center py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors group"
        >
          <div 
            className="flex items-center space-x-2 flex-1 min-w-0 cursor-pointer"
            onClick={() => toggleNode(site.id, 'site')}
          >
            <button className="p-0.5 hover:bg-gray-200 rounded">
              {isLoading ? (
                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : isExpanded ? (
                <ChevronDown className="h-3 w-3 text-gray-500" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-500" />
              )}
            </button>
            
            <div className="text-gray-500">
              {getNodeIcon('site')}
            </div>
            
            <span className="font-medium text-gray-900 truncate">
              {site.name}
            </span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditModal({ type: 'site', item: site });
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
          >
            <Edit className="h-3 w-3 text-gray-500" />
          </button>
          
          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {site.country}
          </span>
        </div>
        
        {isExpanded && (
          <div className="ml-5">
            {containers.map(container => renderContainer(container))}
          </div>
        )}
      </div>
    );
  };

  const renderContainer = (container: Container) => {
    const isExpanded = expandedNodes.has(container.id);
    const isLoading = loadingNodes.has(container.id);
    const racks = data.racks[container.id] || [];

    return (
      <div key={container.id} className="mb-1">
        <div
          className="flex items-center py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors group"
        >
          <div 
            className="flex items-center space-x-2 flex-1 min-w-0 cursor-pointer"
            onClick={() => toggleNode(container.id, 'container')}
          >
            <button className="p-0.5 hover:bg-gray-200 rounded">
              {isLoading ? (
                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : isExpanded ? (
                <ChevronDown className="h-3 w-3 text-gray-500" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-500" />
              )}
            </button>
            
            <div className="text-gray-500">
              {getNodeIcon('container')}
            </div>
            
            <span className="font-medium text-gray-900 truncate">
              {container.name}
            </span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditModal({ type: 'container', item: container });
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
          >
            <Edit className="h-3 w-3 text-gray-500" />
          </button>
        </div>
        
        {isExpanded && (
          <div className="ml-5">
            {racks.map(rack => renderRack(rack))}
          </div>
        )}
      </div>
    );
  };

  const renderRack = (rack: Rack) => {
    const isExpanded = expandedNodes.has(rack.id);
    const isLoading = loadingNodes.has(rack.id);
    const asics = data.asics[rack.id] || [];

    return (
      <div key={rack.id} className="mb-1">
        <div
          className="flex items-center py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors group"
        >
          <div 
            className="flex items-center space-x-2 flex-1 min-w-0 cursor-pointer"
            onClick={() => toggleNode(rack.id, 'rack')}
          >
            <button className="p-0.5 hover:bg-gray-200 rounded">
              {isLoading ? (
                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
              ) : isExpanded ? (
                <ChevronDown className="h-3 w-3 text-gray-500" />
              ) : (
                <ChevronRight className="h-3 w-3 text-gray-500" />
              )}
            </button>
            
            <div className="text-gray-500">
              {getNodeIcon('rack')}
            </div>
            
            <span className="font-medium text-gray-900 truncate">
              {rack.name}
            </span>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditModal({ type: 'rack', item: rack });
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
          >
            <Edit className="h-3 w-3 text-gray-500" />
          </button>
        </div>
        
        {isExpanded && (
          <div className="ml-5">
            {asics.map(asic => renderASIC(asic))}
          </div>
        )}
      </div>
    );
  };

  const renderASIC = (asic: ASIC) => {
    return (
      <div key={asic.id} className="mb-1">
        <div className="flex items-center py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className="w-4" /> {/* Spacer for alignment */}
            
            <div className="text-gray-500">
              {getNodeIcon('asic')}
            </div>
            
            <span className="font-medium text-gray-900 truncate">
              {asic.macAddress || asic.serialNumber}
            </span>
            
            <StatusBadge status={asic.status} size="sm" />
          </div>
          
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {asic.serialNumber}
            </div>
            <div className="text-xs text-gray-500">
              {asic.hashRate} TH/s
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Asset Hierarchy</h3>
        <p className="text-sm text-gray-500 mt-1">Navigate through your mining infrastructure</p>
      </div>
      
      <div className="p-4">
        {data.sites.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No sites configured</h4>
            <p className="text-gray-500 mb-4">Start by adding your mining sites</p>
            <button className="bg-primary-500 text-dark-900 px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors">
              Add First Site
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {data.sites.map(site => renderSite(site))}
          </div>
        )}
      </div>
      
      {/* Edit Modals */}
      {editModal.type === 'site' && editModal.item && (
        <EditSiteModal
          isOpen={true}
          onClose={() => setEditModal({ type: null, item: null })}
          site={editModal.item as Site}
          onSuccess={() => {
            setEditModal({ type: null, item: null });
            loadSites();
          }}
        />
      )}
      
      {editModal.type === 'container' && editModal.item && (
        <EditContainerModal
          isOpen={true}
          onClose={() => setEditModal({ type: null, item: null })}
          container={editModal.item as Container}
          onSuccess={() => {
            setEditModal({ type: null, item: null });
            loadSites();
          }}
        />
      )}
      
      {editModal.type === 'rack' && editModal.item && (
        <EditRackModal
          isOpen={true}
          onClose={() => setEditModal({ type: null, item: null })}
          rack={editModal.item as Rack}
          onSuccess={() => {
            setEditModal({ type: null, item: null });
            loadSites();
          }}
        />
      )}
    </div>
  );
};

export default AssetHierarchy;