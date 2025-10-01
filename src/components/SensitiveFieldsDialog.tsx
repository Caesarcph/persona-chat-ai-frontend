import React from 'react';
import { SensitiveFieldsDialogProps } from '../types/persona';

const SensitiveFieldsDialog: React.FC<SensitiveFieldsDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  fields
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6" role="dialog" aria-labelledby="dialog-title" aria-describedby="dialog-description">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 id="dialog-title" className="text-lg font-semibold text-gray-900">
            Sensitive Fields Confirmation
          </h3>
        </div>
        
        <div id="dialog-description" className="mb-6">
          <p className="text-gray-700 mb-4">
            You are about to configure sensitive demographic fields:
          </p>
          
          <ul className="list-disc list-inside text-sm text-gray-600 mb-4 space-y-1">
            {fields.map((field) => (
              <li key={field} className="capitalize">
                {field.replace('_', ' ')}
              </li>
            ))}
          </ul>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-yellow-800 mb-2">Usage Guidelines:</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Use only for legitimate educational, research, or creative purposes</li>
              <li>• Avoid stereotyping or reinforcing harmful biases</li>
              <li>• Consider the ethical implications of your persona configuration</li>
              <li>• Remember that AI responses may not accurately represent real groups</li>
            </ul>
          </div>
          
          <p className="text-sm text-gray-600">
            By confirming, you acknowledge that you will use these fields responsibly and understand 
            the potential implications of demographic-based persona simulation.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          >
            I Understand & Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default SensitiveFieldsDialog;