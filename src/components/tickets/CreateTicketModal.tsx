import React, { useState, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { FirestoreService } from '../../lib/firestore';
import { useAuth } from '../../contexts/AuthContext';
import type { ASIC } from '../../types';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && preselectedAsicId) {
      setFormData(prev => ({ ...prev, asicId: preselectedAsicId }));
      // You would load the ASIC details here
    }
  }, [isOpen, preselectedAsicId]);

  useEffect(() => {
    if (asicSearchTerm.length >= 3) {
      searchASICs();
    } else {
      setAsicSearchResults([]);
    }
  }, [asicSearchTerm]);

  const searchASICs = async () => {
    try {
      const results = await FirestoreService.searchASICs(asicSearchTerm);
      setAsicSearchResults(results);
    } catch (error) {
      console.error('Error searching ASICs:', error);
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
      await FirestoreService.createTicket({
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        status: 'open',
        asicId: formData.asicId,
        createdBy: userProfile.name,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      onSuccess();
      setFormData({ title: '', description: '', priority: 'medium', asicId: preselectedAsicId || '' });
      setSelectedAsic(null);
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
              ASIC * {selectedAsic && `(${selectedAsic.serialNumber})`}
            </label>
            {!preselectedAsicId && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by serial number, IP, or location..."
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
                        <div className="font-medium text-gray-900">{asic.serialNumber}</div>
                        <div className="text-sm text-gray-600">{asic.location} - {asic.ipAddress}</div>
                      </button>
                    ))}
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