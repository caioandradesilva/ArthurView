import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  assetType: 'site' | 'container' | 'rack' | 'asic';
  assetName: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  assetType,
  assetName
}) => {
  if (!isOpen) return null;

  const getHierarchyWarning = (type: string) => {
    switch (type) {
      case 'site':
        return 'This will permanently delete the site and ALL containers, racks, ASICs, tickets, comments, costs, and audit events within it.';
      case 'container':
        return 'This will permanently delete the container and ALL racks, ASICs, tickets, comments, costs, and audit events within it.';
      case 'rack':
        return 'This will permanently delete the rack and ALL ASICs, tickets, comments, costs, and audit events within it.';
      case 'asic':
        return 'This will permanently delete the ASIC and ALL related tickets, comments, costs, and audit events.';
      default:
        return 'This action cannot be undone.';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Delete {assetType.charAt(0).toUpperCase() + assetType.slice(1)}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-gray-900 font-medium mb-2">
              Are you sure you want to delete "{assetName}"?
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                <strong>⚠️ Warning:</strong> {getHierarchyWarning(assetType)}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">What will be deleted:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {assetType === 'site' && (
                <>
                  <li>• The site "{assetName}"</li>
                  <li>• All containers within this site</li>
                  <li>• All racks within those containers</li>
                  <li>• All ASICs within those racks</li>
                  <li>• All tickets, comments, costs, and audit events</li>
                </>
              )}
              {assetType === 'container' && (
                <>
                  <li>• The container "{assetName}"</li>
                  <li>• All racks within this container</li>
                  <li>• All ASICs within those racks</li>
                  <li>• All tickets, comments, costs, and audit events</li>
                </>
              )}
              {assetType === 'rack' && (
                <>
                  <li>• The rack "{assetName}"</li>
                  <li>• All ASICs within this rack</li>
                  <li>• All tickets, comments, costs, and audit events</li>
                </>
              )}
              {assetType === 'asic' && (
                <>
                  <li>• The ASIC "{assetName}"</li>
                  <li>• All tickets related to this ASIC</li>
                  <li>• All comments and costs</li>
                  <li>• All audit events</li>
                </>
              )}
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Delete {assetType.charAt(0).toUpperCase() + assetType.slice(1)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;