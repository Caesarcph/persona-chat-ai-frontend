import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PersonaFormData, PersonaBuilderProps, AvatarConfig } from '../types/persona';
import { PersonaSchema, getDefaultPersona } from '../validation/personaSchema';
import { usePersonaStore } from '../stores';
import { useSafetyValidation } from '../hooks/useSafetyValidation';
import { generateAvatarSeed } from '../utils/avatar';
import SafetyWarning from './safety/SafetyWarning';
import AvatarComponent from './AvatarComponent';
import SensitiveFieldsDialog from './SensitiveFieldsDialog';
import TemplateSelector from './TemplateSelector';
import TemplateImportExport from './TemplateImportExport';

const PersonaBuilder: React.FC<PersonaBuilderProps> = ({
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
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  const { createFromTemplate } = usePersonaStore();

  // Initialize safety validation
  const { validationResult, validatePersona, getSafetyRecommendations, setValidationResult } = useSafetyValidation({
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

  // Update parent when form values change (with debouncing)
  useEffect(() => {
    // Clear previous timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Debounce the update to prevent infinite loops
    updateTimeoutRef.current = setTimeout(() => {
      const personaData = watchedValues as any;
      if (personaData && Object.keys(personaData).length > 0) {
        // Ensure we have the required fields with defaults
        const completePersona = {
          ...getDefaultPersona(),
          ...personaData
        };
        onPersonaChange(completePersona);
      }
    }, 100); // 100ms debounce
    
    // Cleanup timeout on unmount
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [watchedValues]); // Only depend on watchedValues
  
  // Separate effect for safety validation to avoid circular dependencies
  useEffect(() => {
    if (watchedValues && Object.keys(watchedValues).length > 0) {
      try {
        const result = validatePersona(watchedValues as any);
        setValidationResult(result);
      } catch (error) {
        console.warn('Safety validation error:', error);
      }
    }
  }, [watchedValues?.age, watchedValues?.occupation, watchedValues?.industry, watchedValues?.expertise]); // Only validate on key field changes

  // Reset form when persona prop changes (but avoid infinite loops)
  useEffect(() => {
    if (persona && JSON.stringify(persona) !== JSON.stringify(watchedValues)) {
      reset(persona as PersonaFormData);
    }
  }, [persona]); // Remove reset from dependencies to avoid loops

  const handleSensitiveFieldChange = (fieldName: string, value: string) => {
    if (!sensitiveFieldsEnabled) return;
    
    if (value && !watchedValues.sensitive_usage_confirmed) {
      setPendingSensitiveFields([fieldName]);
      setShowSensitiveDialog(true);
    } else {
      setValue(fieldName as any, value);
    }
  };

  const confirmSensitiveFields = () => {
    setValue('sensitive_usage_confirmed', true);
    pendingSensitiveFields.forEach(field => {
      // Re-trigger the field change after confirmation
      const currentValue = (document.getElementById(field) as HTMLInputElement)?.value || '';
      setValue(field as any, currentValue);
    });
    setShowSensitiveDialog(false);
    setPendingSensitiveFields([]);
  };

  const cancelSensitiveFields = () => {
    // Clear the pending fields
    pendingSensitiveFields.forEach(field => {
      setValue(field as any, '');
      const input = document.getElementById(field) as HTMLInputElement;
      if (input) input.value = '';
    });
    setShowSensitiveDialog(false);
    setPendingSensitiveFields([]);
  };

  const handleAvatarChange = (avatar: AvatarConfig) => {
    setValue('avatar', avatar);
  };

  const handleAvatarUpload = async (file: File): Promise<void> => {
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
    
    // Update persona with uploaded avatar
    if (result.filePath) {
      setValue('avatar', {
        type: 'uploaded',
        generatedSeed: generateAvatarSeed(watchedValues as any),
        uploadedPath: result.filePath,
        uploadedFilename: result.filename
      });
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    createFromTemplate(templateId);
    setShowTemplateSelector(false);
  };

  const handleImportTemplate = () => {
    setImportExportMode('import');
    setShowTemplateImportExport(true);
  };

  const getWarningTitle = (type: string): string => {
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
  };

  const sections = [
    { id: 'demographics', label: 'Demographics', icon: '👤' },
    { id: 'personality', label: 'Personality', icon: '🧠' },
    { id: 'knowledge', label: 'Knowledge', icon: '📚' },
    { id: 'communication', label: 'Communication', icon: '💬' },
    { id: 'context', label: 'Context', icon: '🎯' },
    { id: 'safety', label: 'Safety', icon: '🛡️' },
  ];

  const renderArrayField = (
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
  );

  const renderSlider = (
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
  );

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
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap ${
                activeSection === section.id
                  ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
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
              
              {/* Avatar Section */}
              <div className="flex justify-center mb-6">
                <AvatarComponent
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Controller
                  name="occupation"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label htmlFor="occupation" className="form-label">Occupation</label>
                      <input
                        {...field}
                        id="occupation"
                        type="text"
                        className="input-field"
                        placeholder="e.g., Software Engineer"
                      />
                      {errors.occupation && <p className="text-red-600 text-sm mt-1">{errors.occupation.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="industry"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label htmlFor="industry" className="form-label">Industry</label>
                      <input
                        {...field}
                        id="industry"
                        type="text"
                        className="input-field"
                        placeholder="e.g., Technology, Healthcare"
                      />
                      {errors.industry && <p className="text-red-600 text-sm mt-1">{errors.industry.message}</p>}
                    </div>
                  )}
                />

                <Controller
                  name="seniority"
                  control={control}
                  render={({ field }) => (
                    <div>
                      <label htmlFor="seniority" className="form-label">Seniority</label>
                      <select {...field} id="seniority" className="input-field">
                        <option value="">Select seniority</option>
                        <option value="entry">Entry Level</option>
                        <option value="junior">Junior</option>
                        <option value="mid">Mid Level</option>
                        <option value="senior">Senior</option>
                        <option value="lead">Lead</option>
                        <option value="executive">Executive</option>
                      </select>
                      {errors.seniority && <p className="text-red-600 text-sm mt-1">{errors.seniority.message}</p>}
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

          {/* Personality Section */}
          {activeSection === 'personality' && (
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
          )}

          {/* Knowledge Section */}
          {activeSection === 'knowledge' && (
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
          )}

          {/* Communication Section */}
          {activeSection === 'communication' && (
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
                        <option value="formal">Formal</option>
                        <option value="casual">Casual</option>
                        <option value="playful">Playful</option>
                        <option value="serious">Serious</option>
                        <option value="encouraging">Encouraging</option>
                        <option value="neutral">Neutral</option>
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
                        <option value="bilingual">Bilingual</option>
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
                        <option value="concise">Concise</option>
                        <option value="moderate">Moderate</option>
                        <option value="detailed">Detailed</option>
                      </select>
                    </div>
                  )}
                />
              </div>

              {renderArrayField('structure_preference', 'Structure Preferences', 'e.g., Numbered lists, Headers, Examples')}
            </div>
          )}

          {/* Context Section */}
          {activeSection === 'context' && (
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
                      placeholder="Describe the primary purpose of conversations with this persona..."
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
                        placeholder="e.g., Limited budget, No constraints"
                      />
                    </div>
                  )}
                />
              </div>

              {renderArrayField('compliance_requirements', 'Compliance Requirements', 'e.g., HIPAA, GDPR, SOX')}
              {renderArrayField('cultural_considerations', 'Cultural Considerations', 'e.g., Collectivist culture, Direct communication')}
            </div>
          )}

          {/* Safety Section */}
          {activeSection === 'safety' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Safety & Restrictions</h3>
              
              {renderArrayField('banned_topics', 'Banned Topics', 'e.g., Politics, Personal finances')}
              
              <Controller
                name="sensitive_handling"
                control={control}
                render={({ field }) => (
                  <div>
                    <label className="form-label">Sensitive Content Handling</label>
                    <select {...field} className="input-field">
                      <option value="strict">Strict - Refuse all sensitive topics</option>
                      <option value="moderate">Moderate - Handle with disclaimers</option>
                      <option value="relaxed">Relaxed - Discuss with appropriate context</option>
                    </select>
                  </div>
                )}
              />

              {renderArrayField('disclaimers', 'Custom Disclaimers', 'e.g., Not a licensed professional, Educational purposes only')}
            </div>
          )}
        </form>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-200 pt-4 mt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {watchedValues?.age && watchedValues?.occupation && watchedValues?.industry ? (
              <span className="text-green-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Ready to chat! Other fields will use defaults.
              </span>
            ) : (
              <span className="text-amber-600 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Fill age, occupation & industry to start chatting
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => {
                // Save current persona and navigate to chat
                onPersonaChange(watchedValues as any);
                // Use React Router navigation
                setTimeout(() => {
                  navigate('/chat');
                }, 100); // Small delay to ensure persona is saved
              }}
              disabled={!watchedValues?.age || !watchedValues?.occupation || !watchedValues?.industry}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                watchedValues?.age && watchedValues?.occupation && watchedValues?.industry
                  ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Start Chat
            </button>
            
            <button
              type="button"
              onClick={() => {
                // Save persona to store
                onPersonaChange(watchedValues as any);
                // Show success message
                const message = (watchedValues?.age && watchedValues?.occupation && watchedValues?.industry) 
                  ? 'Persona saved! You can now start chatting.'
                  : 'Persona saved! Fill in age, occupation & industry to enable chat.';
                alert(message);
              }}
              className="px-4 py-2 rounded-md text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Save Persona
            </button>
          </div>
        </div>
        
        {/* Quick Start Tip */}
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Quick Start:</strong> Just fill in Age, Occupation, and Industry in the Demographics section to start chatting! 
            All other fields are optional and will use sensible defaults.
          </p>
        </div>
      </div>

      {/* Sensitive Fields Dialog */}
      <SensitiveFieldsDialog
        isOpen={showSensitiveDialog}
        onConfirm={confirmSensitiveFields}
        onCancel={cancelSensitiveFields}
        fields={pendingSensitiveFields}
      />

      {/* Template Selector */}
      <TemplateSelector
        isOpen={showTemplateSelector}
        onTemplateSelect={handleTemplateSelect}
        onClose={() => setShowTemplateSelector(false)}
      />

      {/* Template Import/Export */}
      <TemplateImportExport
        isOpen={showTemplateImportExport}
        mode={importExportMode}
        onClose={() => setShowTemplateImportExport(false)}
      />
    </div>
  );
};

export default PersonaBuilder;

