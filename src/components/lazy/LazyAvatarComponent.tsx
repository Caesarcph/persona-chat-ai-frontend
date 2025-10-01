import React, { Suspense } from 'react';
import { createLazyComponent } from '../../utils/lazyLoading';
import { AvatarComponentProps } from '../../types/persona';

// Lazy load the actual AvatarComponent
const LazyAvatarComponentImpl = createLazyComponent(
  () => import('../AvatarComponent')
);

// Loading fallback for avatar
const AvatarLoadingFallback: React.FC<{ size: 'small' | 'medium' | 'large' }> = ({ size }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-24 h-24'
  };

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse flex items-center justify-center`}>
      <svg className="w-1/2 h-1/2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    </div>
  );
};

// Wrapper component with Suspense
export const LazyAvatarComponent: React.FC<AvatarComponentProps> = (props) => {
  return (
    <Suspense fallback={<AvatarLoadingFallback size={props.size} />}>
      <LazyAvatarComponentImpl {...props} />
    </Suspense>
  );
};

export default LazyAvatarComponent;