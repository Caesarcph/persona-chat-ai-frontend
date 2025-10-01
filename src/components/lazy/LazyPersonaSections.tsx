import React, { Suspense } from 'react';
import { createLazyComponent } from '../../utils/lazyLoading';

// Lazy load heavy persona form sections
const LazyPersonalitySection = createLazyComponent(
  () => import('../persona-sections/PersonalitySection')
);

const LazyKnowledgeSection = createLazyComponent(
  () => import('../persona-sections/KnowledgeSection')
);

const LazyCommunicationSection = createLazyComponent(
  () => import('../persona-sections/CommunicationSection')
);

const LazyContextSection = createLazyComponent(
  () => import('../persona-sections/ContextSection')
);

const LazySafetySection = createLazyComponent(
  () => import('../persona-sections/SafetySection')
);

// Loading fallback for form sections
const SectionLoadingFallback: React.FC<{ title: string }> = ({ title }) => (
  <div className="space-y-4">
    <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-4"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  </div>
);

// Wrapper components with Suspense
export const LazyPersonalitySectionWrapper: React.FC<any> = (props) => (
  <Suspense fallback={<SectionLoadingFallback title="Personality" />}>
    <LazyPersonalitySection {...props} />
  </Suspense>
);

export const LazyKnowledgeSectionWrapper: React.FC<any> = (props) => (
  <Suspense fallback={<SectionLoadingFallback title="Knowledge" />}>
    <LazyKnowledgeSection {...props} />
  </Suspense>
);

export const LazyCommunicationSectionWrapper: React.FC<any> = (props) => (
  <Suspense fallback={<SectionLoadingFallback title="Communication" />}>
    <LazyCommunicationSection {...props} />
  </Suspense>
);

export const LazyContextSectionWrapper: React.FC<any> = (props) => (
  <Suspense fallback={<SectionLoadingFallback title="Context" />}>
    <LazyContextSection {...props} />
  </Suspense>
);

export const LazySafetySectionWrapper: React.FC<any> = (props) => (
  <Suspense fallback={<SectionLoadingFallback title="Safety" />}>
    <LazySafetySection {...props} />
  </Suspense>
);

// Preload hooks for each section
export const usePersonaSectionPreloads = () => {
  const personalityPreload = React.useCallback(() => 
    import('../persona-sections/PersonalitySection'), []);
  const knowledgePreload = React.useCallback(() => 
    import('../persona-sections/KnowledgeSection'), []);
  const communicationPreload = React.useCallback(() => 
    import('../persona-sections/CommunicationSection'), []);
  const contextPreload = React.useCallback(() => 
    import('../persona-sections/ContextSection'), []);
  const safetyPreload = React.useCallback(() => 
    import('../persona-sections/SafetySection'), []);

  return {
    personalityPreload,
    knowledgePreload,
    communicationPreload,
    contextPreload,
    safetyPreload
  };
};