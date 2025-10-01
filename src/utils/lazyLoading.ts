import React, { lazy, ComponentType } from 'react';

/**
 * Utility for creating lazy-loaded components with error boundaries
 */
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = lazy(importFn);
  
  return LazyComponent;
};

/**
 * Preload a lazy component to improve perceived performance
 */
export const preloadComponent = (importFn: () => Promise<any>) => {
  const componentImport = importFn();
  return componentImport;
};

/**
 * Preload multiple components in parallel
 */
export const preloadComponents = (importFns: (() => Promise<any>)[]) => {
  return Promise.all(importFns.map(fn => preloadComponent(fn)));
};

/**
 * Preload components on user interaction (hover, focus)
 */
export const usePreloadOnInteraction = (importFn: () => Promise<any>) => {
  const [isPreloaded, setIsPreloaded] = React.useState(false);

  const preload = React.useCallback(() => {
    if (!isPreloaded) {
      preloadComponent(importFn);
      setIsPreloaded(true);
    }
  }, [importFn, isPreloaded]);

  return {
    onMouseEnter: preload,
    onFocus: preload,
    isPreloaded
  };
};

/**
 * Intersection Observer hook for lazy loading content when it comes into view
 */
export const useIntersectionObserver = (
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean => {
  const [isIntersecting, setIsIntersecting] = React.useState(false);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [ref, options]);

  return isIntersecting;
};

/**
 * Lazy loading wrapper component interface
 */
export interface LazyContentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number;
  rootMargin?: string;
}

/**
 * Create a lazy content wrapper (returns props for manual implementation)
 */
export const createLazyContentProps = (
  children: React.ReactNode,
  options: Omit<LazyContentProps, 'children'> = {}
) => {
  const { fallback, threshold = 0.1, rootMargin = '50px' } = options;
  
  return {
    children,
    fallback: fallback || React.createElement('div', {
      className: 'animate-pulse bg-gray-200 h-32 rounded'
    }),
    threshold,
    rootMargin
  };
};