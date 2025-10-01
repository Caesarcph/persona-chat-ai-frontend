/**
 * Settings page component
 */

import React from 'react';
import { SettingsErrorBoundary } from '../components/ErrorBoundary';
import { Settings } from '../components/Settings';

const SettingsPage: React.FC = () => {
  return (
    <SettingsErrorBoundary>
      <div className="h-[calc(100vh-8rem)]">
        <Settings className="h-full" />
      </div>
    </SettingsErrorBoundary>
  );
};

export default SettingsPage;