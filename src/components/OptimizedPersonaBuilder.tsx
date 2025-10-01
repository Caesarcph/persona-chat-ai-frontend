import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PersonaSchema, PersonaFormData, getDefaultPersona } from '../validation/personaSchema';
import { PersonaBuilderProps, AvatarConfig } from '../types/persona';
import SensitiveFieldsDialog from './SensitiveFieldsDialog';
import SafetyWarning from './safety/SafetyWarning';
import TemplateImportExport from './TemplateImportExport';
import { generateAvatarSeed } from '../utils/avatar';
import useSafetyValidation from '../hooks/useSafetyValidation';
import { usePersonaStore } from '../stores';
import { useDebounce, useDebouncedCallback } from '../hooks/useDebounce';
import { LazyAvatarComponent } from './lazy/LazyAvatarComponent';
import { LazyTemplateSelector, useTemplateSelectorPreload } from './lazy/LazyTemplateSelector';
import { 
  LazyPersonalitySectionWrapper,
  LazyKnowledgeSectionWrapper,
  LazyCommunicationSectionWrapper,
  LazyContextSectionWrapper,
  LazySafetySectionWrapper,
  usePersonaSectionPreloads
} from './lazy/LazyPersonaSections';

const OptimizedPersonaBuilder: React.FC<PersonaBuilderProps> = ({
  persona,
  onPersonaChange,
  sensitiveFieldsEnabled
}) => {
  const [showSensitiveDialog, setShowSensitiveDialog] = useState(false);
  const [pendingSensitiveFields, setPendingSensitiveFields] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState('demographics');
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showTemplateImportExport, setShowTemplateImportExport] = useState(false);
  const [importExportMode, setImportExportMode] = useState<'import' | 'export'>('import');

  const { createFromTemplate } = usePersonaStore();
  
  // Preload hooks for performance optimization
  const templateSelectorPreload = useTemplateSelectorPreload();
  const sectionPreloads = usePersonaSectionPreloads();

  // Initialize safety validation
  const { validationResult, validatePersona, getSafetyRecommendations } = useSafetyValidation({
    allowSensitiveFields: sensitiveFieldsEnabled,
    strictValidation: false
  });

  const {
    control,
    watch,
    setValue,
    formState: { errors, isValid },
    reset
  } = useForm<PersonaFormData>({
    resolver: zodResolver(PersonaSchema),
    defaultValues: (persona as PersonaFormData) || getDefaultPersona(),
    mode: 'onChange'
  });

  const watchedValues = watch();
  
  // Debounce the watched values to prevent excessive re-renders
  const debouncedValues = useDebounce(watchedValues, 300);
  
  // Debounced callback for persona changes
  const debouncedOnPersonaChange = useDebouncedCallback(
    (personaData: any) => {
      onPersonaChange(personaData);
    },
    300,
    [onPersonaChange]
  );

  // Debounced callback for safety validation
  const debouncedValidatePersona = useDebouncedCallback(
    (personaData: any) => {
      if (personaData && Object.keys(personaData).length > 0) {
        validatePersona(personaData);
      }
    },
    500,
    [validatePersona]
  );

  // Update parent when debounced form values change and validate safety
  useEffect(() => {
    if (isValid && debouncedValues) {
      debouncedOnPersonaChange(debouncedValues);
      debouncedValidatePersona(debouncedValues);
    }
  }, [debouncedValues, isValid, debouncedOnPersonaChange, debouncedValidatePersona]);

  // Reset form when persona prop changes
  useEffect(() => {
    if (persona) {
      reset(persona as PersonaFormData);
    }
  }, [persona, reset]);

  // Memoized handlers to prevent unnecessary re-renders
  const handleSensitiveFieldChange = useCallback((fieldName: string, value: string) => {
    if (!sensitiveFieldsEnabled) return;
    
    if (value && !watchedValues.sensitive_usage_confirmed) {
      setPendingSensitiveFields([fieldName]);
      setShowSensitiveDialog(true);
    } else {
      setValue(fieldName as any, value);
    }
  }, [sensitiveFieldsEnabled, watchedValues.sensitive_usage_confirmed, setValue]);

  const confirmSensitiveFields = useCallback(() => {
    setValue('sensitive_usage_confirmed', true);
    pendingSensitiveFields.forEach(field => {
      const currentValue = (document.getElementById(field) as HTMLInputElement)?.value || '';
      setValue(field as any, currentValue);
    });
    setShowSensitiveDialog(false);
    setPendingSensitiveFields([]);
  }, [setValue, pendingSensitiveFields]);

  const cancelSensitiveFields = useCallback(() => {
    pendingSensitiveFields.forEach(field => {
      setValue(field as any, '');
      const input = document.getElementById(field) as HTMLInputElement;
      if (input) input.value = '';
    });
    setShowSensitiveDialog(false);
    setPendingSensitiveFields([]);
  }, [setValue, pendingSensitiveFields]);

  const handleAvatarChange = useCallback((avatar: AvatarConfig) => {
    setValue('avatar', avatar);
  }, [setValue]);

  const handleAvatarUpload = useCallback(async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await fetch('/api/avatars/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }
    
    if (result.filePath) {
      setValue('avatar', {
        type: 'uploaded',
        generatedSeed: generateAvatarSeed(watchedValues as any),
        uploadedPath: result.filePath,
        uploadedFilename: result.filename
      });
    }
  }, [setValue, watchedValues]);

  const handleTemplateSelect = useCallback((templateId: string) => {
    createFromTemplate(templateId);
    setShowTemplateSelector(false);
  }, [createFromTemplate]);

  const handleImportTemplate = useCallback(() => {
    setImportExportMode('import');
    setShowTemplateImportExport(true);
  }, []);

  // Memoized sections to prevent unnecessary re-renders
  const sections = useMemo(() => [
    { id: 'demographics', label: 'Demographics', icon: '👤' },
    { id: 'personality', label: 'Personality', icon: '🧠' },
    { id: 'knowledge', label: 'Knowledge', icon: '📚' },
    { id: 'communication', label: 'Communication', icon: '💬' },
    { id: 'context', label: 'Context', icon: '🎯' },
    { id: 'safety', label: 'Safety', icon: '🛡️' },
  ], []);

  // Memoized warning title function
  const getWarningTitle = useCallback((type: string): string => {
    switch (type) {
      case 'sensitive_fields':
        return 'Sensitive Fields Configuration';
      case 'professional_context':
        return 'Professional Context Detected';
      case 'banned_topics':
        return 'Banned Topics Configuration';
      case 'expertise_mismatch':
        return 'Expertise Alignment';
      default:
        return 'Configuration Notice';
    }
  }, []);

  // Memoized array field renderer
  const renderArrayField = useCallback((
    name: any,
    label: string,
    placeholder: string
  ) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          <label className="form-label">{label}</label>
          <div className="space-y-2">
            {(field.value as string[]).map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const newArray = [...(field.value as string[])];
                    newArray[index] = e.target.value;
                    field.onChange(newArray);
                  }}
                  className="input-field flex-1"
                  placeholder={placeholder}
                />
                <button
                  type="button"
                  onClick={() => {
                    const newArray = (field.value as string[]).filter((_, i) => i !== index);
                    field.onChange(newArray);
                  }}
                  className="text-red-600 hover:text-red-800 p-1"
                  aria-label="Remove item"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => field.onChange([...(field.value as string[]), ''])}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add {label.toLowerCase()}</span>
            </button>
          </div>
          {errors[name as keyof typeof errors] && (
            <p className="text-red-600 text-sm mt-1">{errors[name as keyof typeof errors]?.message}</p>
          )}
        </div>
      )}
    />
  ), [control, errors]);

  // Memoized slider renderer
  const renderSlider = useCallback((
    name: any,
    label: string,
    min: number = 0,
    max: number = 100
  ) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          <label className="form-label flex justify-between">
            <span>{label}</span>
            <span className="text-sm text-gray-500">{field.value as number}</span>
          </label>
          <input
            type="range"
            min={min}
            max={max}
            value={field.value as number}
            onChange={(e) => field.onChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      )}
    />
  ), [control]);

  return (
    <div className="h-full flex flex-col">
      {/* Header with Template Actions */}
      <div className="border-b border-gray-200 mb-6">
        {/* Template Actions */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Persona Builder</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowTemplateSelector(true)}
              {...templateSelectorPreload}
              className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Use Template</span>
            </button>
            <button
              onClick={handleImportTemplate}
              className="px-3 py-1.5 text-sm bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3 3m0 0l3-3m-3 3V8" />
              </svg>
              <span>Import</span>
            </button>
          </div>
        </div>
        
        {/* Section Navigation */}
        <nav className="flex space-x-1 overflow-x-auto">
          {sections.map((section) => {
            // Get preload function for this section
            const getPreloadProps = () => {
              switch (section.id) {
                case 'personality':
                  return { onMouseEnter: sectionPreloads.personalityPreload };
                case 'knowledge':
                  return { onMouseEnter: sectionPreloads.knowledgePreload };
                case 'communication':
                  return { onMouseEnter: sectionPreloads.communicationPreload };
                case 'context':
                  return { onMouseEnter: sectionPreloads.contextPreload };
                case 'safety':
                  return { onMouseEnter: sectionPreloads.safetyPreload };
                default:
                  return {};
              }
            };

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                {...getPreloadProps()}
                className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{section.icon}</span>
                <span>{section.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Safety Warnings */}
      {validationResult.warnings.length > 0 && (
        <div className="mb-4">
          {validationResult.warnings.map((warning, index) => {
            const warningKey = `${warning.type}-${index}`;
            if (dismissedWarnings.has(warningKey)) return null;
            
            return (
              <SafetyWarning
                key={warningKey}
                type={warning.type}
                title={getWarningTitle(warning.type)}
                message={warning.message}
                details={warning.suggestion ? [warning.suggestion] : []}
                onDismiss={() => {
                  setDismissedWarnings(prev => new Set([...prev, warningKey]));
                }}
                severity={warning.type === 'sensitive_fields' ? 'warning' : 'info'}
              />
            );
          })}
        </div>
      )}

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        <form className="space-y-6">
          {/* Demographics Section */}
          {activeSection === 'demographics' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Demographics</h3>
              
              {/* Avatar Section - Lazy Loaded */}
              <div className="flex justify-center mb-6">
                <LazyAvatarComponent
                  persona={watchedValues as any}
                  size="large"
                  uploadEnabled={true}
                  onAvatarChange={handleAvatarChange}
                  onAvatarUpload={handleAvatarUpload}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="age"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label htmlFor="age" className="form-label">Age</label>
                      <input
                        {...field}
                        id="age"
                        type="text"
                        className="input-field"
                        placeholder="e.g., 25 or 'mid-20s'"
                      />
                      {errors.age && <p className="text-red-600 text-sm mt-1">{errors.age.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label htmlFor="gender" className="form-label">Gender</label>
                      <input
                        {...field}
                        id="gender"
                        type="text"
                        className="input-field"
                        placeholder="e.g., Female, Male, Non-binary"
                      />
                      {errors.gender && <p className="text-red-600 text-sm mt-1">{errors.gender.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="pronouns"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label htmlFor="pronouns" className="form-label">Pronouns</label>
                      <input
                        {...field}
                        id="pronouns"
                        type="text"
                        className="input-field"
                        placeholder="e.g., she/her, he/him, they/them"
                      />
                      {errors.pronouns && <p className="text-red-600 text-sm mt-1">{errors.pronouns.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="nationality"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label htmlFor="nationality" className="form-label">Nationality</label>
                      <input
                        {...field}
                        id="nationality"
                        type="text"
                        className="input-field"
                        placeholder="e.g., American, Chinese, British"
                      />
                      {errors.nationality && <p className="text-red-600 text-sm mt-1">{errors.nationality.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="region"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label htmlFor="region" className="form-label">Region</label>
                      <input
                        {...field}
                        id="region"
                        type="text"
                        className="input-field"
                        placeholder="e.g., California, Beijing, London"
                      />
                      {errors.region && <p className="text-red-600 text-sm mt-1">{errors.region.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="education"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label htmlFor="education" className="form-label">Education</label>
                      <select {...field} id="education" className="input-field">
                        <option value="">Select education level</option>
                        <option value="high_school">High School</option>
                        <option value="bachelors">Bachelor's Degree</option>
                        <option value="masters">Master's Degree</option>
                        <option value="phd">PhD</option>
                        <option value="professional">Professional Degree</option>
                        <option value="other">Other</option>
                      </select>
                      {errors.education && <p className="text-red-600 text-sm mt-1">{errors.education.message}</p>}
                    </div>
                  )}
                />
              </div>

              {/* Sensitive Fields Section */}
              {sensitiveFieldsEnabled && (
                <div className="border-t pt-6 mt-6">
                  <div className="flex items-center mb-4">
                    <h4 className="text-md font-medium text-gray-900">Sensitive Demographics</h4>
                    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Optional
                    </span>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      These fields are optional and should only be used for legitimate educational, research, or creative purposes.
                      Configuring these fields will require explicit confirmation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="race_ethnicity" className="form-label">Race/Ethnicity</label>
                      <input
                        id="race_ethnicity"
                        type="text"
                        className="input-field"
                        placeholder="Optional"
                        onChange={(e) => handleSensitiveFieldChange('race_ethnicity', e.target.value)}
                        defaultValue={watchedValues.race_ethnicity || ''}
                      />
                    </div>

                    <div>
                      <label htmlFor="religion" className="form-label">Religion</label>
                      <input
                        id="religion"
                        type="text"
                        className="input-field"
                        placeholder="Optional"
                        onChange={(e) => handleSensitiveFieldChange('religion', e.target.value)}
                        defaultValue={watchedValues.religion || ''}
                      />
                    </div>

                    <div>
                      <label htmlFor="political_views" className="form-label">Political Views</label>
                      <input
                        id="political_views"
                        type="text"
                        className="input-field"
                        placeholder="Optional"
                        onChange={(e) => handleSensitiveFieldChange('political_views', e.target.value)}
                        defaultValue={watchedValues.political_views || ''}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lazy-loaded sections for better performance */}
          {activeSection === 'personality' && (
            <LazyPersonalitySectionWrapper
              control={control}
              errors={errors}
              renderSlider={renderSlider}
            />
          )}

          {activeSection === 'knowledge' && (
            <LazyKnowledgeSectionWrapper
              control={control}
              errors={errors}
              renderArrayField={renderArrayField}
            />
          )}

          {activeSection === 'communication' && (
            <LazyCommunicationSectionWrapper
              control={control}
              errors={errors}
            />
          )}

          {activeSection === 'context' && (
            <LazyContextSectionWrapper
              control={control}
              errors={errors}
              renderArrayField={renderArrayField}
            />
          )}

          {activeSection === 'safety' && (
            <LazySafetySectionWrapper
              control={control}
              errors={errors}
              renderArrayField={renderArrayField}
            />
          )}
        </form>
      </div>

      {/* Lazy-loaded Template Selector */}
      <LazyTemplateSelector
        isOpen={showTemplateSelector}
        onTemplateSelect={handleTemplateSelect}
        onClose={() => setShowTemplateSelector(false)}
      />

      {/* Sensitive Fields Dialog */}
      {showSensitiveDialog && (
        <SensitiveFieldsDialog
          isOpen={showSensitiveDialog}
          fields={pendingSensitiveFields}
          onConfirm={confirmSensitiveFields}
          onCancel={cancelSensitiveFields}
        />
      )}

      {/* Template Import/Export */}
      {showTemplateImportExport && (
        <TemplateImportExport
          isOpen={showTemplateImportExport}
          mode={importExportMode}
          onClose={() => setShowTemplateImportExport(false)}
        />
      )}
    </div>
  );
};

export default OptimizedPersonaBuilder;