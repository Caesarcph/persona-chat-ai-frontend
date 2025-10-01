/**
 * Main application router configuration
 * Handles routing between different app sections
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from '../components/ErrorBoundary';
import Layout from '../components/Layout';
import PersonaBuilderPage from '../pages/PersonaBuilderPage';
import ChatPage from '../pages/ChatPage';
import SettingsPage from '../pages/SettingsPage';
import SessionsPage from '../pages/SessionsPage';
import NotFoundPage from '../pages/NotFoundPage';

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Layout>
          <Routes>
            {/* Default route - redirect to persona builder */}
            <Route path="/" element={<Navigate to="/persona" replace />} />
            
            {/* Main application routes */}
            <Route path="/persona" element={<PersonaBuilderPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/chat/:sessionId" element={<ChatPage />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            
            {/* 404 page */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default AppRouter;