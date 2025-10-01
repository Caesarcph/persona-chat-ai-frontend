/**
 * Sessions management page component
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useChatStore } from '../stores/chatStore';
import { usePersonaStore } from '../stores/personaStore';

const SessionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const { 
    sessions, 
    loadSessions, 
    deleteSession, 
    exportSession,
    isLoading,
    error 
  } = useChatStore();
  
  const { savedPersonas, loadSavedPersonas } = usePersonaStore();
  
  useEffect(() => {
    loadSessions();
    loadSavedPersonas();
  }, [loadSessions, loadSavedPersonas]);
  
  const handleSessionClick = (sessionId: string) => {
    navigate(`/chat/${sessionId}`);
  };
  
  const handleDeleteSelected = async () => {
    for (const sessionId of selectedSessions) {
      await deleteSession(sessionId);
    }
    setSelectedSessions([]);
    setShowDeleteConfirm(false);
  };
  
  const handleExportSession = async (sessionId: string, format: 'json' | 'markdown') => {
    try {
      const exportData = await exportSession(sessionId, format);
      const blob = new Blob([exportData], { 
        type: format === 'json' ? 'application/json' : 'text/markdown' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session-${sessionId}.${format === 'json' ? 'json' : 'md'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  
  const toggleSessionSelection = (sessionId: string) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId) 
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };
  
  const getPersonaName = (personaId?: string) => {
    if (!personaId) return 'Unknown Persona';
    const persona = savedPersonas.find(p => p.id === personaId);
    return persona?.name || 'Unknown Persona';
  };
  
  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <div className="h-[calc(100vh-8rem)]">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Chat Sessions</h2>
              <p className="text-sm text-gray-600">
                Manage your conversation history and export sessions
              </p>
            </div>
            
            {selectedSessions.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedSessions.length} selected
                </span>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete Selected
                </button>
              </div>
            )}
          </div>
          
          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          {/* Sessions list */}
          <div className="flex-1 overflow-auto">
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Sessions Yet</h3>
                <p className="text-gray-600 text-sm mb-4">
                  Start a conversation to create your first chat session.
                </p>
                <button
                  onClick={() => navigate('/persona')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Create Persona
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedSessions.includes(session.id)}
                          onChange={() => toggleSessionSelection(session.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => handleSessionClick(session.id)}
                        >
                          <h3 className="text-sm font-medium text-gray-900">
                            {session.name || 'Untitled Session'}
                          </h3>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span>{getPersonaName(session.persona_id)}</span>
                            <span>{session.message_count} messages</span>
                            <span>{new Date(session.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleExportSession(session.id, 'json')}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Export as JSON"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleExportSession(session.id, 'markdown')}
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Export as Markdown"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => deleteSession(session.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete Session"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Delete Sessions
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Are you sure you want to delete {selectedSessions.length} session(s)? 
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSelected}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default SessionsPage;