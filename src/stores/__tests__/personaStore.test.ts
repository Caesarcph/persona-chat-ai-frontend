/**
 * Tests for persona store
 */

import { renderHook, act } from '@testing-library/react';
import { usePersonaStore } from '../personaStore';
import { Persona } from '../../types/persona';

// Mock fetch
global.fetch = jest.fn();

// Mock getDefaultPersona
jest.mock('../../validation/personaSchema', () => ({
  getDefaultPersona: jest.fn(() => ({
    schema_version: '1.0',
    age: 25,
    gender: 'Non-binary',
    pronouns: 'they/them',
    nationality: 'American',
    region: 'North America',
    education: 'Bachelor\'s Degree',
    occupation: 'Software Developer',
    industry: 'Technology',
    seniority: 'Mid-level',
    politeness_directness: 50,
    expertise: ['JavaScript', 'React'],
    tools: ['VS Code', 'Git'],
    knowledge_cutoff: '2024-01',
    response_style: 'practical',
    tone: 'casual',
    language_preference: 'english',
    detail_depth: 'moderate',
    conversation_goal: 'Help with coding questions',
    banned_topics: ['violence', 'illegal activities'],
  })),
}));

const mockPersona: Persona = {
  schema_version: '1.0',
  age: 30,
  gender: 'Female',
  pronouns: 'she/her',
  nationality: 'Canadian',
  region: 'North America',
  education: 'Master\'s Degree',
  occupation: 'Data Scientist',
  industry: 'Healthcare',
  seniority: 'Senior',
  politeness_directness: 70,
  expertise: ['Python', 'Machine Learning'],
  tools: ['Jupyter', 'TensorFlow'],
  knowledge_cutoff: '2024-01',
  response_style: 'academic',
  tone: 'formal',
  language_preference: 'english',
  detail_depth: 'detailed',
  conversation_goal: 'Provide data analysis insights',
  banned_topics: ['personal medical advice'],
};

describe('personaStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset store to initial state
    usePersonaStore.setState({
      currentPersona: null,
      savedPersonas: [],
      presetTemplates: [],
      isLoading: false,
      isSaving: false,
      error: null,
    });
  });

  describe('initial state', () => {
    it('should have null current persona initially', () => {
      const { result } = renderHook(() => usePersonaStore());
      
      expect(result.current.currentPersona).toBeNull();
      expect(result.current.savedPersonas).toEqual([]);
      expect(result.current.presetTemplates).toEqual([]);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isSaving).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('persona management', () => {
    it('should set current persona', () => {
      const { result } = renderHook(() => usePersonaStore());
      
      act(() => {
        result.current.setCurrentPersona(mockPersona);
      });
      
      expect(result.current.currentPersona).toEqual(mockPersona);
      expect(result.current.error).toBeNull();
    });

    it('should update current persona', () => {
      const { result } = renderHook(() => usePersonaStore());
      
      act(() => {
        result.current.setCurrentPersona(mockPersona);
      });
      
      act(() => {
        result.current.updateCurrentPersona({ age: 35, occupation: 'Senior Data Scientist' });
      });
      
      expect(result.current.currentPersona?.age).toBe(35);
      expect(result.current.currentPersona?.occupation).toBe('Senior Data Scientist');
      expect(result.current.currentPersona?.gender).toBe('Female'); // Unchanged
    });

    it('should reset current persona', () => {
      const { result } = renderHook(() => usePersonaStore());
      
      act(() => {
        result.current.setCurrentPersona(mockPersona);
      });
      
      act(() => {
        result.current.resetCurrentPersona();
      });
      
      expect(result.current.currentPersona).not.toBeNull();
      expect(result.current.error).toBeNull();
    });
  });

  describe('save persona', () => {
    it('should save persona successfully', async () => {
      const mockResponse = {
        id: '123',
        name: 'Test Persona',
        persona: mockPersona,
        created_at: '2024-01-01',
        is_template: false,
      };
      
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ personas: [mockResponse] }),
        });
      
      const { result } = renderHook(() => usePersonaStore());
      
      act(() => {
        result.current.setCurrentPersona(mockPersona);
      });
      
      await act(async () => {
        await result.current.savePersona('Test Persona');
      });
      
      expect(fetch).toHaveBeenCalledWith('/api/personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Persona',
          persona: mockPersona,
          is_template: false,
        }),
      });
      
      expect(result.current.isSaving).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle save errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });
      
      const { result } = renderHook(() => usePersonaStore());
      
      act(() => {
        result.current.setCurrentPersona(mockPersona);
      });
      
      await act(async () => {
        await result.current.savePersona('Test Persona');
      });
      
      expect(result.current.isSaving).toBe(false);
      expect(result.current.error).toBe('Failed to save persona: Internal Server Error');
    });

    it('should handle no persona to save', async () => {
      const { result } = renderHook(() => usePersonaStore());
      
      await act(async () => {
        await result.current.savePersona('Test Persona');
      });
      
      expect(result.current.error).toBe('No persona to save');
      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe('load persona', () => {
    it('should load persona successfully', async () => {
      const mockResponse = {
        id: '123',
        name: 'Test Persona',
        persona: mockPersona,
        created_at: '2024-01-01',
        is_template: false,
      };
      
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });
      
      const { result } = renderHook(() => usePersonaStore());
      
      await act(async () => {
        await result.current.loadPersona('123');
      });
      
      expect(fetch).toHaveBeenCalledWith('/api/personas/123');
      expect(result.current.currentPersona).toEqual(mockPersona);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle load errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      });
      
      const { result } = renderHook(() => usePersonaStore());
      
      await act(async () => {
        await result.current.loadPersona('123');
      });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe('Failed to load persona: Not Found');
    });
  });

  describe('validation', () => {
    it('should validate complete persona', () => {
      const { result } = renderHook(() => usePersonaStore());
      
      act(() => {
        result.current.setCurrentPersona(mockPersona);
      });
      
      expect(result.current.validateCurrentPersona()).toBe(true);
    });

    it('should invalidate incomplete persona', () => {
      const { result } = renderHook(() => usePersonaStore());
      
      act(() => {
        result.current.setCurrentPersona({
          ...mockPersona,
          age: '', // Missing required field
        } as any);
      });
      
      expect(result.current.validateCurrentPersona()).toBe(false);
    });

    it('should return false for null persona', () => {
      const { result } = renderHook(() => usePersonaStore());
      
      expect(result.current.validateCurrentPersona()).toBe(false);
    });
  });

  describe('sensitive fields', () => {
    it('should detect sensitive fields', () => {
      const { result } = renderHook(() => usePersonaStore());
      
      act(() => {
        result.current.setCurrentPersona({
          ...mockPersona,
          race_ethnicity: 'Asian',
          religion: 'Buddhist',
          political_views: 'Liberal',
        });
      });
      
      const sensitiveFields = result.current.getSensitiveFields();
      expect(sensitiveFields).toEqual(['Race/Ethnicity', 'Religion', 'Political Views']);
    });

    it('should return empty array for no sensitive fields', () => {
      const { result } = renderHook(() => usePersonaStore());
      
      act(() => {
        result.current.setCurrentPersona(mockPersona);
      });
      
      const sensitiveFields = result.current.getSensitiveFields();
      expect(sensitiveFields).toEqual([]);
    });
  });

  describe('export/import', () => {
    it('should export persona as JSON', async () => {
      const mockSavedPersona = {
        id: '123',
        name: 'Test Persona',
        persona: mockPersona,
        created_at: '2024-01-01',
        is_template: false,
      };
      
      const { result } = renderHook(() => usePersonaStore());
      
      act(() => {
        usePersonaStore.setState({
          savedPersonas: [mockSavedPersona],
        });
      });
      
      const exported = await result.current.exportPersona('123', 'json');
      const parsed = JSON.parse(exported);
      
      expect(parsed).toEqual(mockSavedPersona);
    });

    it('should import persona from JSON', async () => {
      const mockPersonaData = {
        persona: mockPersona,
      };
      
      const { result } = renderHook(() => usePersonaStore());
      
      await act(async () => {
        await result.current.importPersona(JSON.stringify(mockPersonaData), 'json');
      });
      
      expect(result.current.currentPersona).toEqual(mockPersona);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle import errors', async () => {
      const { result } = renderHook(() => usePersonaStore());
      
      await act(async () => {
        await result.current.importPersona('invalid json', 'json');
      });
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toContain('Failed to import persona');
    });
  });

  describe('utility functions', () => {
    it('should clear error', () => {
      const { result } = renderHook(() => usePersonaStore());
      
      act(() => {
        usePersonaStore.setState({ error: 'Test error' });
      });
      
      expect(result.current.error).toBe('Test error');
      
      act(() => {
        result.current.clearError();
      });
      
      expect(result.current.error).toBeNull();
    });

    it('should set loading state', () => {
      const { result } = renderHook(() => usePersonaStore());
      
      act(() => {
        result.current.setLoading(true);
      });
      
      expect(result.current.isLoading).toBe(true);
      
      act(() => {
        result.current.setLoading(false);
      });
      
      expect(result.current.isLoading).toBe(false);
    });
  });
});