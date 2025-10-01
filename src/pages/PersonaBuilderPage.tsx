/**
 * Persona Builder page component
 */

import React, { useCallback, useMemo } from 'react';
import { PersonaBuilderErrorBoundary } from '../components/ErrorBoundary';
import PersonaBuilder from '../components/PersonaBuilder';
import { usePersonaStore } from '../stores/personaStore';

const PersonaBuilderPage: React.FC = () => {
  const { currentPersona, setCurrentPersona } = usePersonaStore();
  
  // Stabilize the callback to prevent infinite re-renders
  const handlePersonaChange = useCallback((persona: any) => {
    // Only update if the persona actually changed
    setCurrentPersona(persona);
  }, [setCurrentPersona]);
  
  // Memoize the persona to prevent unnecessary re-renders
  const memoizedPersona = useMemo(() => currentPersona, [currentPersona]);
  
  // For demo purposes, enable sensitive fields
  const sensitiveFieldsEnabled = true;
  
  return (
    <PersonaBuilderErrorBoundary>
      <div className="h-[calc(100vh-8rem)]">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex flex-col">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Persona Builder</h2>
            <p className="text-sm text-gray-600">Configure your AI persona's characteristics</p>
          </div>
          <div className="flex-1 overflow-hidden">
            <PersonaBuilder
              persona={memoizedPersona}
              onPersonaChange={handlePersonaChange}
              sensitiveFieldsEnabled={sensitiveFieldsEnabled}
            />
          </div>
        </div>
      </div>
    </PersonaBuilderErrorBoundary>
  );
};

export default PersonaBuilderPage;