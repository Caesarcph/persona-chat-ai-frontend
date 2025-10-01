/**
 * Main App component with router configuration and performance monitoring
 */

import React from 'react';
import AppRouter from './routes/AppRouter';
import { createPerformanceDebugger } from './utils/performanceMonitor';
import { withPerformanceMonitoring } from './utils/performanceMonitor';

const MonitoredAppRouter = withPerformanceMonitoring(AppRouter, 'AppRouter');

function App() {
  return (
    <>
      <MonitoredAppRouter />
      {/* Performance debugging removed for now */}
    </>
  );
}

export default withPerformanceMonitoring(App, 'App');