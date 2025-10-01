/**
 * Main layout component with navigation and responsive design
 */

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { usePersonaStore } from '../stores/personaStore';
import { useChatStore } from '../stores/chatStore';
import { OfflineDetection } from './OfflineDetection';
import { useApiErrorHandling } from '../hooks/useErrorHandling';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Store hooks
  const { settings, applyTheme } = useSettingsStore();
  const { currentPersona, resetCurrentPersona } = usePersonaStore();
  const { currentSession, clearCurrentSession } = useChatStore();
  
  // Error handling
  const { errorState } = useApiErrorHandling();
  
  // Apply theme on mount and settings change
  useEffect(() => {
    applyTheme();
  }, [applyTheme, settings.theme, settings.fontSize]);

  // Health check effect
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health');
        if (response.ok) {
          const data = await response.json();
          const healthy = data.status === 'healthy' && data.services?.ollama === 'healthy';
          setIsHealthy(healthy);
        } else {
          setIsHealthy(false);
        }
      } catch (error) {
        console.error('Health check failed:', error);
        setIsHealthy(false);
      }
    };

    // Initial check
    checkHealth();
    
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);
  
  const handleResetPersona = () => {
    resetCurrentPersona();
    // If we're in chat, clear the session and go to persona builder
    if (location.pathname.startsWith('/chat')) {
      clearCurrentSession();
      navigate('/persona');
    }
  };
  
  const handleStartChat = () => {
    if (hasMinimumPersonaData && isHealthy !== false) {
      navigate('/chat');
    }
  };

  const handleConnectionChange = (online: boolean) => {
    setIsOnline(online);
  };

  // Health change handler is now handled directly in useEffect
  
  const isActive = (path: string) => {
    if (path === '/chat') {
      return location.pathname.startsWith('/chat');
    }
    return location.pathname === path;
  };
  
  // Check if persona has minimum required fields for chat
  const hasMinimumPersonaData = currentPersona && (
    currentPersona.age && 
    currentPersona.occupation && 
    currentPersona.industry
  );

  const navigationItems = [
    {
      path: '/persona',
      label: 'Persona Builder',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      path: '/chat',
      label: 'Chat',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      disabled: !hasMinimumPersonaData || isHealthy === false,
      tooltip: !hasMinimumPersonaData 
        ? 'Fill in basic persona info (age, occupation, industry) to enable chat'
        : isHealthy === false 
        ? 'Chat unavailable - AI service not responding'
        : undefined,
    },
    {
      path: '/sessions',
      label: 'Sessions',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline Detection */}
      <OfflineDetection onConnectionChange={handleConnectionChange} />
      
      {/* Service Health Alert */}
      {isHealthy === false && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Service Issues Detected:</strong> Some features may not be available. 
                {!isOnline && ' You appear to be offline.'}
                {isOnline && ' Ollama AI service is not responding.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and title */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">
                  PersonaChatAI
                </h1>
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Demo
                </span>
              </Link>
              
              {/* Current session indicator */}
              {currentSession && (
                <div className="ml-4 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {currentSession.name || 'Active Session'}
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle mobile menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                />
              </svg>
            </button>

            {/* Desktop navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : item.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={(e) => {
                    if (item.disabled) {
                      e.preventDefault();
                    }
                  }}
                  aria-label={item.label}
                  title={item.tooltip}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Link>
              ))}
              
              {/* Action buttons */}
              <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-200">
                <button
                  onClick={handleResetPersona}
                  className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  aria-label="Reset Persona Configuration"
                >
                  Reset Persona
                </button>
                
                {hasMinimumPersonaData && !location.pathname.startsWith('/chat') && (
                  <button
                    onClick={handleStartChat}
                    disabled={isHealthy === false}
                    className={`px-3 py-1 text-sm rounded focus:outline-none focus:ring-2 ${
                      isHealthy !== false
                        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    aria-label="Start Chat with Current Persona"
                    title={isHealthy === false ? 'Chat unavailable - AI service not responding' : 'Start Chat with Current Persona'}
                  >
                    {isHealthy !== false ? 'Start Chat' : 'Chat Unavailable'}
                  </button>
                )}
                
                {!hasMinimumPersonaData && !location.pathname.startsWith('/chat') && (
                  <div className="px-3 py-1 text-sm text-gray-500 bg-gray-100 rounded cursor-help" 
                       title="Fill in basic persona info (age, occupation, industry) to enable chat">
                    Complete Persona First
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
        
        {/* Mobile navigation menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-100 text-blue-700'
                      : item.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={(e) => {
                    if (item.disabled) {
                      e.preventDefault();
                    }
                  }}
                >
                  {item.icon}
                  <span className="ml-3">{item.label}</span>
                </Link>
              ))}
              
              {/* Mobile action buttons */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <button
                  onClick={handleResetPersona}
                  className="w-full text-left px-3 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  Reset Persona
                </button>
                
                {hasMinimumPersonaData && !location.pathname.startsWith('/chat') && (
                  <button
                    onClick={handleStartChat}
                    disabled={isHealthy === false}
                    className={`w-full text-left px-3 py-2 text-base font-medium rounded-md ${
                      isHealthy !== false
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isHealthy !== false ? 'Start Chat' : 'Chat Unavailable'}
                  </button>
                )}
                
                {!hasMinimumPersonaData && !location.pathname.startsWith('/chat') && (
                  <div className="w-full text-left px-3 py-2 text-base font-medium text-gray-500 bg-gray-100 rounded-md">
                    Complete Basic Info First
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Service Health Monitor (in sidebar or settings) */}
        {location.pathname === '/settings' && (
          <div className="mb-6">
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="text-lg font-medium mb-2">Service Status</h3>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  isHealthy ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className={`text-sm ${
                  isHealthy ? 'text-green-700' : 'text-red-700'
                }`}>
                  {isHealthy ? 'All services healthy' : 'Service issues detected'}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {children}
      </main>
    </div>
  );
};

export default Layout;