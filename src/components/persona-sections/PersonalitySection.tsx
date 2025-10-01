import React from 'react';
import { Controller } from 'react-hook-form';

interface PersonalitySectionProps {
  control: any;
  errors: any;
  renderSlider: (name: string, label: string, min?: number, max?: number) => React.ReactNode;
}

export const PersonalitySection: React.FC<PersonalitySectionProps> = ({
  control,
  errors,
  renderSlider
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Personality & Psychology</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Controller
          name="mbti"
          control={control}
          render={({ field }) => (
            <div>
              <label className="form-label">MBTI Type (Optional)</label>
              <input
                {...field}
                type="text"
                className="input-field"
                placeholder="e.g., INTJ, ENFP"
                maxLength={4}
              />
              {errors.mbti && <p className="text-red-600 text-sm mt-1">{errors.mbti.message}</p>}
            </div>
          )}
        />

        <Controller
          name="enneagram"
          control={control}
          render={({ field }) => (
            <div>
              <label className="form-label">Enneagram (Optional)</label>
              <input
                {...field}
                type="text"
                className="input-field"
                placeholder="e.g., 5w4, 2w3"
              />
              {errors.enneagram && <p className="text-red-600 text-sm mt-1">{errors.enneagram.message}</p>}
            </div>
          )}
        />
      </div>

      {/* Big Five Personality Traits */}
      <div>
        <h4 className="text-md font-medium text-gray-900 mb-4">Big Five Personality Traits</h4>
        <div className="space-y-4">
          {renderSlider('big5.openness', 'Openness to Experience')}
          {renderSlider('big5.conscientiousness', 'Conscientiousness')}
          {renderSlider('big5.extraversion', 'Extraversion')}
          {renderSlider('big5.agreeableness', 'Agreeableness')}
          {renderSlider('big5.neuroticism', 'Neuroticism')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="risk_preference"
          control={control}
          render={({ field }) => (
            <div>
              <label className="form-label">Risk Preference</label>
              <select {...field} className="input-field">
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
              </select>
            </div>
          )}
        />

        <Controller
          name="decision_style"
          control={control}
          render={({ field }) => (
            <div>
              <label className="form-label">Decision Style</label>
              <select {...field} className="input-field">
                <option value="analytical">Analytical</option>
                <option value="intuitive">Intuitive</option>
                <option value="collaborative">Collaborative</option>
                <option value="decisive">Decisive</option>
              </select>
            </div>
          )}
        />

        <Controller
          name="humor"
          control={control}
          render={({ field }) => (
            <div>
              <label className="form-label">Humor Style</label>
              <select {...field} className="input-field">
                <option value="none">None/Serious</option>
                <option value="dry">Dry</option>
                <option value="playful">Playful</option>
                <option value="witty">Witty</option>
                <option value="serious">Serious</option>
              </select>
            </div>
          )}
        />
      </div>

      {renderSlider('politeness_directness', 'Communication Style (0=Very Polite, 100=Very Direct)')}
    </div>
  );
};

export default PersonalitySection;