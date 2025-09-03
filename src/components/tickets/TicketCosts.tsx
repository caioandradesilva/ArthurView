import React, { useState } from 'react';
import { DollarSign, Plus, Calendar } from 'lucide-react';
import { FirestoreService } from '../../lib/firestore';
import { useAuth } from '../../contexts/AuthContext';
import type { CostRecord } from '../../types';

interface TicketCostsProps {
  costs: CostRecord[];
  ticketId: string;
  siteId?: string;
}

const TicketCosts: React.FC<TicketCostsProps> = ({ costs, ticketId, siteId = 'default-site' }) => {
  const { userProfile } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    amount: 0,
    currency: 'USD' as 'USD' | 'BRL',
    category: 'parts' as 'parts' | 'labor' | 'other'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddCost = async () => {
    console.log('handleAddCost called with:', { formData, ticketId, siteId, userProfile });
    
    if (!userProfile || !formData.description.trim() || formData.amount <= 0) {
      console.error('No user profile found');
      console.error('Validation failed:', { description: formData.description, amount: formData.amount });
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('Creating cost record...');
      await FirestoreService.createCostRecord({
        description: formData.description.trim(),
        amount: formData.amount,
        currency: formData.currency,
        category: formData.category,
        ticketId: ticketId,
        asicId: undefined, // Use undefined instead of empty string
        siteId: siteId,
        createdBy: userProfile.name,
        isEstimate: true,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Cost record created successfully');
      
      // Reset form
      setFormData({ description: '', amount: 0, currency: 'USD', category: 'parts' });
      setShowAddForm(false);
      
      // Force reload to show new cost
      console.error('Error adding cost record:', error);
      setError(`Failed to add cost: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const totalCosts = costs.reduce((total, cost) => {
    // Simple currency conversion - in production you'd use real exchange rates
    const usdAmount = cost.currency === 'BRL' ? cost.amount / 5.5 : cost.amount;
    return total + usdAmount;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ticket Costs</h3>
            <p className="text-2xl font-bold text-gray-900">
              ${totalCosts.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-600">{costs.length} cost entries</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-dark-900 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Cost</span>
          </button>
        </div>
      </div>

      {/* Add cost form */}
      {showAddForm && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Add Cost Entry</h4>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g., Replacement part, Labor cost"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="parts">Parts</option>
                <option value="labor">Labor</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency *
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="USD">USD ($)</option>
                <option value="BRL">BRL (R$)</option>
              </select>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setError('');
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddCost}
              disabled={loading}
              className="px-4 py-2 bg-primary-500 text-dark-900 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Adding...' : 'Add Cost'}
            </button>
          </div>
        </div>
      )}

      {/* Costs list */}
      {costs.length === 0 ? (
        <div className="text-center py-8">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">No cost records yet</h4>
          <p className="text-gray-500">Costs related to this ticket will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {costs.map((cost) => (
            <div key={cost.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">{cost.description}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span className="capitalize">{cost.category}</span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(cost.createdAt).toLocaleDateString('en-US')}</span>
                    </div>
                    <span>Added by {cost.createdBy}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {cost.currency} {cost.amount.toLocaleString()}
                  </p>
                  <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    cost.category === 'parts' ? 'bg-blue-100 text-blue-800' :
                    cost.category === 'labor' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {cost.category}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TicketCosts;