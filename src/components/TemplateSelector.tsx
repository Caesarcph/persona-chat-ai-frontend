import React, { useState, useEffect } from 'react';
import { usePersonaStore, usePresetTemplates, usePersonaLoading } from '../stores';
import { SavedPersona } from '../types/persona';

interface TemplateSelectorProps {
  onTemplateSelect: (templateId: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface TemplatePreviewProps {
  template: SavedPersona;
  onSelect: () => void;
  onPreview: () => void;
  isSelected: boolean;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ 
  template, 
  onSelect, 
  onPreview, 
  isSelected 
}) => {
  const persona = template.persona;
  
  return (
    <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
      isSelected 
        ? 'border-blue-500 bg-blue-50' 
        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">{template.name}</h3>
          
          {/* Quick Preview Info */}
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Role:</span>
              <span>{persona.occupation} in {persona.industry}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-medium">Age:</span>
              <span>{persona.age}</span>
              <span className="font-medium">Location:</span>
              <span>{persona.region}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="font-medium">Style:</span>
              <span className="capitalize">{persona.response_style.replace('_', ' ')}</span>
              <span>•</span>
              <span className="capitalize">{persona.tone}</span>
            </div>
            
            {persona.expertise && persona.expertise.length > 0 && (
              <div className="flex items-start space-x-2">
                <span className="font-medium">Expertise:</span>
                <span className="flex-1">
                  {persona.expertise.slice(0, 3).join(', ')}
                  {persona.expertise.length > 3 && ` +${persona.expertise.length - 3} more`}
                </span>
              </div>
            )}
          </div>
          
          {/* Goal Preview */}
          <div className="mt-3 p-2 bg-gray-100 rounded text-sm">
            <span className="font-medium text-gray-700">Goal: </span>
            <span className="text-gray-600">
              {persona.conversation_goal.length > 100 
                ? `${persona.conversation_goal.substring(0, 100)}...`
                : persona.conversation_goal
              }
            </span>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
        <button
          onClick={onPreview}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          View Details
        </button>
        
        <button
          onClick={onSelect}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isSelected
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isSelected ? 'Selected' : 'Use Template'}
        </button>
      </div>
    </div>
  );
};

const TemplateDetailModal: React.FC<{
  template: SavedPersona;
  onClose: () => void;
  onSelect: () => void;
}> = ({ template, onClose, onSelect }) => {
  const persona = template.persona;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{template.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Detailed Information */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Age:</span> {persona.age}</div>
                <div><span className="font-medium">Gender:</span> {persona.gender}</div>
                <div><span className="font-medium">Location:</span> {persona.region}</div>
                <div><span className="font-medium">Education:</span> {persona.education}</div>
                <div><span className="font-medium">Occupation:</span> {persona.occupation}</div>
                <div><span className="font-medium">Industry:</span> {persona.industry}</div>
              </div>
            </div>
            
            {/* Personality */}
            {persona.big5 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Personality Traits</h3>
                <div className="space-y-2">
                  {Object.entries(persona.big5 || {}).map(([trait, value]) => (
                    <div key={trait} className="flex items-center space-x-3">
                      <span className="w-24 text-sm capitalize">{trait}:</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${value as number}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-8">{value as number}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Expertise */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Areas of Expertise</h3>
              <div className="flex flex-wrap gap-2">
                {persona.expertise.map((skill: string, index: number) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Communication Style */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Communication Style</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Response Style:</span> {persona.response_style.replace('_', ' ')}</div>
                <div><span className="font-medium">Tone:</span> {persona.tone}</div>
                <div><span className="font-medium">Detail Level:</span> {persona.detail_depth}</div>
                <div><span className="font-medium">Language:</span> {persona.language_preference}</div>
              </div>
            </div>
            
            {/* Conversation Goal */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Conversation Goal</h3>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                {persona.conversation_goal}
              </p>
            </div>
            
            {/* Safety & Disclaimers */}
            {persona.disclaimers && persona.disclaimers.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Important Disclaimers</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {persona.disclaimers.map((disclaimer: string, index: number) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-yellow-500 mt-0.5">⚠️</span>
                      <span>{disclaimer}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={onSelect}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Use This Template
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const TemplateSelector: React.FC<TemplateSelectorProps> = ({ 
  onTemplateSelect, 
  onClose, 
  isOpen 
}) => {
  const presetTemplates = usePresetTemplates();
  const { isLoading } = usePersonaLoading();
  const { loadPresetTemplates } = usePersonaStore();
  
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<SavedPersona | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load templates when component mounts
  useEffect(() => {
    if (isOpen && presetTemplates.length === 0) {
      loadPresetTemplates();
    }
  }, [isOpen, presetTemplates.length, loadPresetTemplates]);
  
  // Filter templates based on search
  const filteredTemplates = presetTemplates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.persona.occupation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.persona.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.persona.expertise.some(skill => 
      skill.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    onTemplateSelect(templateId);
    onClose();
  };
  
  if (!isOpen) return null;
  
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
        <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Choose a Persona Template</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search templates by name, role, or expertise..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <svg 
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading templates...</span>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchQuery ? 'No templates found' : 'No templates available'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Templates will appear here once they are loaded'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredTemplates.map((template) => (
                  <TemplatePreview
                    key={template.id}
                    template={template}
                    onSelect={() => handleTemplateSelect(template.id)}
                    onPreview={() => setPreviewTemplate(template)}
                    isSelected={selectedTemplateId === template.id}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Footer */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Template Detail Modal */}
      {previewTemplate && (
        <TemplateDetailModal
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
          onSelect={() => {
            handleTemplateSelect(previewTemplate.id);
            setPreviewTemplate(null);
          }}
        />
      )}
    </>
  );
};

export default TemplateSelector;