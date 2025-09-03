import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, MapPin, Package, Server, Cpu } from 'lucide-react';
import { FirestoreService } from '../../lib/firestore';
import type { Site, Container, Rack, ASIC } from '../../types';
import StatusBadge from '../ui/StatusBadge';

interface HierarchyNode {
  type: 'site' | 'container' | 'rack' | 'asic';
  data: Site | Container | Rack | ASIC;
  children?: HierarchyNode[];
  expanded?: boolean;
}

const AssetHierarchy: React.FC = () => {
  const [hierarchy, setHierarchy] = useState<HierarchyNode[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    try {
      const sites = await FirestoreService.getSites();
      const hierarchyData: HierarchyNode[] = [];

      for (const site of sites) {
        const siteNode: HierarchyNode = {
          type: 'site',
          data: site,
          children: [],
          expanded: expandedNodes.has(site.id)
        };

        if (expandedNodes.has(site.id)) {
          const containers = await FirestoreService.getContainersBySite(site.id);
          
          for (const container of containers) {
            const containerNode: HierarchyNode = {
              type: 'container',
              data: container,
              children: [],
              expanded: expandedNodes.has(container.id)
            };

            if (expandedNodes.has(container.id)) {
              const racks = await FirestoreService.getRacksByContainer(container.id);
              
              for (const rack of racks) {
                const rackNode: HierarchyNode = {
                  type: 'rack',
                  data: rack,
                  children: [],
                  expanded: expandedNodes.has(rack.id)
                };

                if (expandedNodes.has(rack.id)) {
                  const asics = await FirestoreService.getASICsByRack(rack.id);
                  rackNode.children = asics.map(asic => ({
                    type: 'asic',
                    data: asic
                  }));
                }

                containerNode.children!.push(rackNode);
              }
            }

            siteNode.children!.push(containerNode);
          }
        }

        hierarchyData.push(siteNode);
      }

      setHierarchy(hierarchyData);
    } catch (error) {
      console.error('Error loading hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = async (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    
    setExpandedNodes(newExpanded);
    
    // Reload hierarchy to fetch children if needed
    await loadHierarchy();
  };

  const getNodeIcon = (type: HierarchyNode['type']) => {
    const iconProps = { className: "h-4 w-4" };
    
    switch (type) {
      case 'site': return <MapPin {...iconProps} />;
      case 'container': return <Package {...iconProps} />;
      case 'rack': return <Server {...iconProps} />;
      case 'asic': return <Cpu {...iconProps} />;
      default: return <Server {...iconProps} />;
    }
  };

  const renderNode = (node: HierarchyNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has((node.data as any).id);
    const paddingLeft = level * 20 + 12;

    return (
      <div key={(node.data as any).id} className="mb-1">
        <div
          className="flex items-center py-2 px-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
          style={{ paddingLeft }}
          onClick={() => toggleNode((node.data as any).id)}
        >
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {hasChildren && (
              <button className="p-0.5 hover:bg-gray-200 rounded">
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3 text-gray-500" />
                ) : (
                  <ChevronRight className="h-3 w-3 text-gray-500" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-4" />}
            
            <div className="text-gray-500">
              {getNodeIcon(node.type)}
            </div>
            
            <span className="font-medium text-gray-900 truncate">
              {node.type === 'site' ? (node.data as Site).name :
               node.type === 'container' ? (node.data as Container).name :
               node.type === 'rack' ? (node.data as Rack).name :
               (node.data as ASIC).macAddress || (node.data as ASIC).serialNumber}
            </span>
            
            {node.type === 'asic' && (
              <StatusBadge status={(node.data as ASIC).status} size="sm" />
            )}
          </div>
          
          {node.type === 'site' && (
            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {(node.data as Site).country}
            </span>
          )}
          
          {node.type === 'asic' && (
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {(node.data as ASIC).serialNumber}
              </div>
              <div className="text-xs text-gray-500">
                {(node.data as ASIC).hashRate} TH/s
              </div>
            </div>
          )}
        </div>
        
        {isExpanded && hasChildren && (
          <div>
            {node.children!.map(child => renderNode(child, level + 1))}
          </div>
        )}
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
        {hierarchy.length === 0 ? (
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
            {hierarchy.map(node => renderNode(node))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetHierarchy;