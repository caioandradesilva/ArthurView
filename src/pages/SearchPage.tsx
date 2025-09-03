import React, { useState, useEffect } from 'react';
import { Search, Cpu, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../components/ui/Breadcrumb';
import StatusBadge from '../components/ui/StatusBadge';
import { FirestoreService } from '../lib/firestore';
import type { ASIC } from '../types';

const SearchPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<ASIC[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const breadcrumbItems = [
    { label: 'Search' }
  ];

  useEffect(() => {
    if (searchTerm.length >= 3) {
      performSearch();
    } else {
      setResults([]);
      setHasSearched(false);
    }
  }, [searchTerm]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const searchResults = await FirestoreService.searchASICs(searchTerm);
      setResults(searchResults);
      setHasSearched(true);
    } catch (error) {
      console.error('Error searching ASICs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto">
      <Breadcrumb items={breadcrumbItems} />
      
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Global Search</h1>
        <p className="text-gray-600 mt-2">Find ASICs by serial number, IP address, or location</p>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by serial number, IP address, or location (e.g., MDC-11-02)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <p className="text-center text-sm text-gray-500 mt-3">
          Type at least 3 characters to start searching
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
            <span className="text-gray-600">Searching...</span>
          </div>
        </div>
      )}

      {/* Search Results */}
      {!loading && hasSearched && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Search Results {results.length > 0 && `(${results.length} found)`}
            </h3>
          </div>
          
          {results.length === 0 ? (
            <div className="p-8 text-center">
              <Cpu className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No ASICs found</h4>
              <p className="text-gray-500">
                Try searching with a different term like serial number, IP address, or location code.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {results.map((asic) => (
                <Link
                  key={asic.id}
                  to={`/asic/${asic.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <Cpu className="h-5 w-5 text-gray-400" />
                        <h4 className="text-lg font-medium text-gray-900 truncate">
                          {asic.macAddress || asic.serialNumber}
                        </h4>
                        <StatusBadge status={asic.status} size="sm" />
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium text-gray-900">MAC Address:</span>
                          <br />
                          {asic.macAddress || 'Not set'}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Serial Number:</span>
                          <br />
                          {asic.serialNumber}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Model:</span>
                          <br />
                          {asic.model}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Location:</span>
                          <br />
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{asic.location}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 mt-3">
                        <div>
                          <span className="font-medium text-gray-900">IP Address:</span> {asic.ipAddress}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Hash Rate:</span> {asic.hashRate} TH/s
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Tips */}
      {!hasSearched && searchTerm.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Search Tips</h3>
          <ul className="space-y-2 text-blue-700">
            <li>• Search by <strong>MAC Address</strong>: Primary hardware identifier (recommended)</li>
            <li>• Search by <strong>Serial Number</strong>: Full or partial serial number</li>
            <li>• Search by <strong>IP Address</strong>: Full or partial IP (e.g., 192.168 or 192.168.1.100)</li>
            <li>• Search by <strong>Location</strong>: Container and rack codes (e.g., DC_11, Rack 02, MDC-11-02)</li>
            <li>• Search by <strong>Position</strong>: Line and column positions (e.g., 9,3)</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchPage;