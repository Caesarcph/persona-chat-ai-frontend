/**
 * Chat page component
 */

import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChatInterfaceErrorBoundary } from '../components/ErrorBoundary';
import { ChatDemo } from '../components/ChatDemo';
import { usePersonaStore } from '../stores/personaStore';
import { useChatStore } from '../stores/chatStore';

const ChatPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  
  const { currentPersona } = usePersonaStore();
  const { currentSession, loadSession, createSession, clearCurrentSession } = useChatStore();
  
  useEffect(() => {
    if (sessionId) {
      // Load specific session
      loadSession(sessionId);
    } else if (!currentSession && currentPersona) {
      // Create new session with current persona
      createSession(currentPersona);
    } else if (!currentPersona) {
      // No persona available, redirect to persona builder
      navigate('/persona');
    }
  }, [sessionId, currentSession, currentPersona, loadSession, createSession, navigate]);
  
  // Clear session when component unmounts
  useEffect(() => {
    return () => {
      if (!sessionId) {
        // Only clear if we're not viewing a specific session
        clearCurrentSession();
      }
    };
  }, [sessionId, clearCurrentSession]);
  
  if (!currentPersona) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Persona Configured</h3>
          <p className="text-gray-600 text-sm mb-4">
            You need to configure a persona before starting a chat session.
          </p>
          <button
            onClick={() => navigate('/persona')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Configure Persona
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <ChatInterfaceErrorBoundary>
      <div className="h-[calc(100vh-8rem)]">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full">
          <ChatDemo />
        </div>
      </div>
    </ChatInterfaceErrorBoundary>
  );
};

export default ChatPage;