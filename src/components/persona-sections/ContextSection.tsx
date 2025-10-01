import React from 'react';
import { Controller } from 'react-hook-form';

interface ContextSectionProps {
  control: any;
  errors: any;
  renderArrayField: (name: string, label: string, placeholder: string) => React.ReactNode;
}

export const ContextSection: React.FC<ContextSectionProps> = ({
  control,
  errors,
  renderArrayField
}) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contextual Variables</h3>
      
      <Controller
        name="conversation_goal"
        control={control}
        render={({ field }) => (
          <div>
            <label className="form-label">Conversation Goal</label>
            <textarea
              {...field}
              className="input-field"
              rows={3}
              placeholder="What is the primary goal of conversations with this persona?"
            />
            {errors.conversation_goal && <p className="text-red-600 text-sm mt-1">{errors.conversation_goal.message}</p>}
          </div>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Controller
          name="time_pressure"
          control={control}
          render={({ field }) => (
            <div>
              <label className="form-label">Time Pressure</label>
              <select {...field} className="input-field">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          )}
        />

        <Controller
          name="budget_constraints"
          control={control}
          render={({ field }) => (
            <div>
              <label className="form-label">Budget Constraints</label>
              <input
                {...field}
                type="text"
                className="input-field"
                placeholder="e.g., Limited, Moderate, Flexible"
              />
            </div>
          )}
        />
      </div>

      {renderArrayField('current_projects', 'Current Projects', 'e.g., Website redesign, Market research')}
      {renderArrayField('goals', 'Goals & Objectives', 'e.g., Increase sales, Learn new skills')}
    </div>
  );
};

export default ContextSection;