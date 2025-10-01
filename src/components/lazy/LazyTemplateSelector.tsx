import React, { Suspense } from 'react';
import { createLazyComponent, usePreloadOnInteraction } from '../../utils/lazyLoading';

// Lazy load the TemplateSelector component
const LazyTemplateSelectorImpl = createLazyComponent(
  () => import('../TemplateSelector')
);

// Loading fallback for template selector
const TemplateSelectorLoadingFallback: React.FC = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-4">
    <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="border rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                <div className="h-3 bg-gray-200 rounded w-4/6"></div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

interface LazyTemplateSelectorProps {
  onTemplateSelect: (templateId: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

// Wrapper component with Suspense and preloading
export const LazyTemplateSelector: React.FC<LazyTemplateSelectorProps> = (props) => {
  if (!props.isOpen) return null;

  return (
    <Suspense fallback={<TemplateSelectorLoadingFallback />}>
      <LazyTemplateSelectorImpl {...props} />
    </Suspense>
  );
};

// Hook for preloading template selector on user interaction
export const useTemplateSelectorPreload = () => {
  return usePreloadOnInteraction(() => import('../TemplateSelector'));
};

export default LazyTemplateSelector;