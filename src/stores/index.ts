/**
 * Store exports and initialization
 */

export { useSettingsStore, useSettings, useModels } from './settingsStore';
export { 
  usePersonaStore, 
  useCurrentPersona, 
  useSavedPersonas, 
  usePresetTemplates, 
  usePersonaLoading 
} from './personaStore';
export { 
  useChatStore, 
  useCurrentSession, 
  useMessages, 
  useStreamingState, 
  useChatSessions, 
  useChatLoading 
} from './chatStore';

// Initialize stores with persistence
export const initializeStores = () => {
  // Settings store is already initialized in settingsStore.ts
  // Other stores will be initialized on first use
  console.log('Stores initialized');
};