/**
 * Persona store using Zustand for state management
 * Handles persona creation, management, and persistence
 */

import { create } from 'zustand';
import { Persona } from '../types/persona';
import { getDefaultPersona } from '../validation/personaSchema';

import { SavedPersona } from '../types/persona';

interface PersonaState {
  // Current persona being edited/used
  currentPersona: Persona | null;
  
  // Saved personas and templates
  savedPersonas: SavedPersona[];
  presetTemplates: SavedPersona[];
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Actions
  setCurrentPersona: (persona: Persona | null) => void;
  updateCurrentPersona: (updates: Partial<Persona>) => void;
  resetCurrentPersona: () => void;
  
  // Persona management
  savePersona: (name: string, isTemplate?: boolean) => Promise<void>;
  loadPersona: (id: string) => Promise<void>;
  deletePersona: (id: string) => Promise<void>;
  duplicatePersona: (id: string, newName: string) => Promise<void>;
  
  // Templates
  loadPresetTemplates: () => Promise<void>;
  createFromTemplate: (templateId: string) => void;
  exportTemplate: (templateId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  importTemplate: (templateData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  validateTemplate: (templateData: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  
  // Persistence
  loadSavedPersonas: () => Promise<void>;
  exportPersona: (id: string, format: 'json' | 'yaml') => Promise<string>;
  importPersona: (data: string, format: 'json' | 'yaml') => Promise<void>;
  
  // Validation
  validateCurrentPersona: () => boolean;
  getSensitiveFields: () => string[];
  
  // Utility
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const usePersonaStore = create<PersonaState>((set, get) => ({
  // Initial state
  currentPersona: null,
  savedPersonas: [],
  presetTemplates: [],
  isLoading: false,
  isSaving: false,
  error: null,
  
  // Basic persona actions
  setCurrentPersona: (persona) => {
    set({ currentPersona: persona, error: null });
  },
  
  updateCurrentPersona: (updates) => {
    set((state) => ({
      currentPersona: state.currentPersona 
        ? { ...state.currentPersona, ...updates }
        : null,
      error: null,
    }));
  },
  
  resetCurrentPersona: () => {
    set({ 
      currentPersona: getDefaultPersona(),
      error: null,
    });
  },
  
  // Persona management
  savePersona: async (name, isTemplate = false) => {
    const { currentPersona } = get();
    if (!currentPersona) {
      set({ error: 'No persona to save' });
      return;
    }
    
    set({ isSaving: true, error: null });
    
    try {
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          persona: currentPersona,
          is_template: isTemplate,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save persona: ${response.statusText}`);
      }
      
      const savedPersona = await response.json();
      
      set((state) => ({
        savedPersonas: [...state.savedPersonas, savedPersona],
        isSaving: false,
      }));
      
      // Reload personas to get updated list
      await get().loadSavedPersonas();
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to save persona',
        isSaving: false,
      });
    }
  },
  
  loadPersona: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/personas/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load persona: ${response.statusText}`);
      }
      
      const savedPersona = await response.json();
      
      set({ 
        currentPersona: savedPersona.persona,
        isLoading: false,
      });
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load persona',
        isLoading: false,
      });
    }
  },
  
  deletePersona: async (id) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/personas/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete persona: ${response.statusText}`);
      }
      
      set((state) => ({
        savedPersonas: state.savedPersonas.filter(p => p.id !== id),
        isLoading: false,
      }));
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete persona',
        isLoading: false,
      });
    }
  },
  
  duplicatePersona: async (id, newName) => {
    const { savedPersonas } = get();
    const originalPersona = savedPersonas.find(p => p.id === id);
    
    if (!originalPersona) {
      set({ error: 'Persona not found' });
      return;
    }
    
    set({ isSaving: true, error: null });
    
    try {
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName,
          persona: originalPersona.persona,
          is_template: false,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to duplicate persona: ${response.statusText}`);
      }
      
      const duplicatedPersona = await response.json();
      
      set((state) => ({
        savedPersonas: [...state.savedPersonas, duplicatedPersona],
        isSaving: false,
      }));
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to duplicate persona',
        isSaving: false,
      });
    }
  },
  
  // Templates
  loadPresetTemplates: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/personas?templates=true');
      
      if (!response.ok) {
        throw new Error(`Failed to load templates: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      set({ 
        presetTemplates: data.personas || [],
        isLoading: false,
      });
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load templates',
        isLoading: false,
      });
    }
  },
  
  createFromTemplate: (templateId) => {
    const { presetTemplates } = get();
    const template = presetTemplates.find(t => t.id === templateId);
    
    if (template) {
      set({ 
        currentPersona: { ...template.persona },
        error: null,
      });
    } else {
      set({ error: 'Template not found' });
    }
  },

  exportTemplate: async (templateId) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/export`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Export failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Export failed');
      }
      
      return { success: true, data: result.data };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export template';
      set({ error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  importTemplate: async (templateData) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/templates/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Import failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Import failed');
      }
      
      // Reload templates to include the new one
      await get().loadPresetTemplates();
      
      set({ isLoading: false });
      return { success: true, data: result.data };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to import template';
      set({ 
        error: errorMessage,
        isLoading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  validateTemplate: async (templateData) => {
    try {
      const response = await fetch('/api/templates/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(templateData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Validation failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Validation failed');
      }
      
      return { success: true, data: result.data };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to validate template';
      return { success: false, error: errorMessage };
    }
  },
  
  // Persistence
  loadSavedPersonas: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/personas');
      
      if (!response.ok) {
        throw new Error(`Failed to load personas: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      set({ 
        savedPersonas: data.personas || [],
        isLoading: false,
      });
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load personas',
        isLoading: false,
      });
    }
  },
  
  exportPersona: async (id, format) => {
    const { savedPersonas } = get();
    const persona = savedPersonas.find(p => p.id === id);
    
    if (!persona) {
      throw new Error('Persona not found');
    }
    
    if (format === 'json') {
      return JSON.stringify(persona, null, 2);
    } else {
      // Simple YAML-like format for demo
      const yamlLines = [
        `name: "${persona.name}"`,
        `created_at: "${persona.created_at}"`,
        `is_template: ${persona.is_template}`,
        'persona:',
        ...Object.entries(persona.persona).map(([key, value]) => 
          `  ${key}: ${JSON.stringify(value)}`
        ),
      ];
      return yamlLines.join('\n');
    }
  },
  
  importPersona: async (data, format) => {
    set({ isLoading: true, error: null });
    
    try {
      let personaData;
      
      if (format === 'json') {
        personaData = JSON.parse(data);
      } else {
        // Simple YAML parsing for demo
        const lines = data.split('\n');
        const persona: any = {};
        let inPersonaSection = false;
        
        for (const line of lines) {
          if (line.trim() === 'persona:') {
            inPersonaSection = true;
            continue;
          }
          
          if (inPersonaSection && line.startsWith('  ')) {
            const [key, ...valueParts] = line.trim().split(': ');
            const value = valueParts.join(': ');
            try {
              persona[key] = JSON.parse(value);
            } catch {
              persona[key] = value.replace(/^"|"$/g, '');
            }
          }
        }
        
        personaData = { persona };
      }
      
      // Validate the imported persona
      if (!personaData.persona) {
        throw new Error('Invalid persona data');
      }
      
      set({ 
        currentPersona: personaData.persona,
        isLoading: false,
      });
      
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to import persona',
        isLoading: false,
      });
    }
  },
  
  // Validation
  validateCurrentPersona: () => {
    const { currentPersona } = get();
    if (!currentPersona) return false;
    
    // Basic validation - check required fields
    const requiredFields = [
      'age', 'gender', 'pronouns', 'nationality', 'region',
      'education', 'occupation', 'industry', 'seniority',
      'expertise', 'knowledge_cutoff', 'response_style',
      'tone', 'language_preference', 'detail_depth',
      'conversation_goal', 'banned_topics'
    ];
    
    return requiredFields.every(field => {
      const value = currentPersona[field as keyof Persona];
      return value !== undefined && value !== null && value !== '';
    });
  },
  
  getSensitiveFields: () => {
    const { currentPersona } = get();
    if (!currentPersona) return [];
    
    const sensitiveFields = [];
    if (currentPersona.race_ethnicity) sensitiveFields.push('Race/Ethnicity');
    if (currentPersona.religion) sensitiveFields.push('Religion');
    if (currentPersona.political_views) sensitiveFields.push('Political Views');
    
    return sensitiveFields;
  },
  
  // Utility
  clearError: () => {
    set({ error: null });
  },
  
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
}));

// Selectors for better performance
export const useCurrentPersona = () => usePersonaStore((state) => state.currentPersona);
export const useSavedPersonas = () => usePersonaStore((state) => state.savedPersonas);
export const usePresetTemplates = () => usePersonaStore((state) => state.presetTemplates);
export const usePersonaLoading = () => usePersonaStore((state) => ({
  isLoading: state.isLoading,
  isSaving: state.isSaving,
  error: state.error,
}));