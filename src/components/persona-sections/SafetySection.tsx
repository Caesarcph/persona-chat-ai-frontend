import React from 'react';
import { Controller } from 'react-hook-form';

interface SafetySectionProps {
  control: any;
  errors: any;
  renderArrayField: (name: string, label: string, placeholder: string) => React.ReactNode;
}

export const SafetySection: React.FC<SafetySectionProps> = ({
  control,
  errors,
  renderArrayField
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety & Content Guidelines</h3>
      
      {renderArrayField('banned_topics', 'Banned Topics', 'e.g., Politics, Personal finances')}
      
      <Controller
        name="sensitive_handling"
        control={control}
        render={({ field }) => (
          <div>
            <label className="form-label">Sensitive Content Handling</label>
            <select {...field} className="input-field">
              <option value="strict">Strict - Avoid all sensitive topics</option>
              <option value="moderate">Moderate - Handle with care</option>
              <option value="open">Open - Discuss when relevant</option>
            </select>
            {errors.sensitive_handling && <p className="text-red-600 text-sm mt-1">{errors.sensitive_handling.message}</p>}
          </div>
        )}
      />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Safety Guidelines</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Personas should not provide harmful, illegal, or unethical advice</li>
          <li>• Sensitive topics should be handled with appropriate care and context</li>
          <li>• Personal information should never be requested or stored</li>
          <li>• Professional boundaries should be maintained in all interactions</li>
        </ul>
      </div>
    </div>
  );
};

export default SafetySection;