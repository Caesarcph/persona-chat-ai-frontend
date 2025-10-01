import React from 'react';
import { Controller } from 'react-hook-form';

interface KnowledgeSectionProps {
  control: any;
  errors: any;
  renderArrayField: (name: string, label: string, placeholder: string) => React.ReactNode;
}

export const KnowledgeSection: React.FC<KnowledgeSectionProps> = ({
  control,
  errors,
  renderArrayField
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Knowledge & Experience</h3>
      
      {renderArrayField('expertise', 'Areas of Expertise', 'e.g., Machine Learning, Marketing')}
      {renderArrayField('tools', 'Tools & Technologies', 'e.g., Python, Photoshop, Excel')}
      {renderArrayField('certifications', 'Certifications', 'e.g., AWS Certified, PMP')}
      
      <Controller
        name="knowledge_cutoff"
        control={control}
        render={({ field }) => (
          <div>
            <label className="form-label">Knowledge Cutoff Date</label>
            <input
              {...field}
              type="month"
              className="input-field"
            />
            {errors.knowledge_cutoff && <p className="text-red-600 text-sm mt-1">{errors.knowledge_cutoff.message}</p>}
          </div>
        )}
      />

      {renderArrayField('information_sources', 'Preferred Information Sources', 'e.g., Academic papers, Industry blogs')}
    </div>
  );
};

export default KnowledgeSection;