import React from 'react';
import { Controller } from 'react-hook-form';

interface CommunicationSectionProps {
  control: any;
  errors: any;
  renderSlider: (name: string, label: string, min?: number, max?: number) => React.ReactNode;
}

export const CommunicationSection: React.FC<CommunicationSectionProps> = ({
  control,
  errors,
  renderSlider
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication Preferences</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="response_style"
          control={control}
          render={({ field }) => (
            <div>
              <label className="form-label">Response Style</label>
              <select {...field} className="input-field">
                <option value="academic">Academic</option>
                <option value="practical">Practical</option>
                <option value="storytelling">Storytelling</option>
                <option value="bullet_points">Bullet Points</option>
                <option value="socratic">Socratic</option>
              </select>
            </div>
          )}
        />

        <Controller
          name="tone"
          control={control}
          render={({ field }) => (
            <div>
              <label className="form-label">Tone</label>
              <select {...field} className="input-field">
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="friendly">Friendly</option>
                <option value="formal">Formal</option>
                <option value="enthusiastic">Enthusiastic</option>
              </select>
            </div>
          )}
        />

        <Controller
          name="language_preference"
          control={control}
          render={({ field }) => (
            <div>
              <label className="form-label">Language Preference</label>
              <select {...field} className="input-field">
                <option value="english">English</option>
                <option value="chinese">Chinese</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
                <option value="japanese">Japanese</option>
                <option value="other">Other</option>
              </select>
            </div>
          )}
        />

        <Controller
          name="detail_depth"
          control={control}
          render={({ field }) => (
            <div>
              <label className="form-label">Detail Depth</label>
              <select {...field} className="input-field">
                <option value="brief">Brief</option>
                <option value="moderate">Moderate</option>
                <option value="detailed">Detailed</option>
                <option value="comprehensive">Comprehensive</option>
              </select>
            </div>
          )}
        />
      </div>

      {renderSlider('verbosity', 'Verbosity Level', 0, 100)}
      {renderSlider('technical_depth', 'Technical Depth', 0, 100)}
    </div>
  );
};

export default CommunicationSection;