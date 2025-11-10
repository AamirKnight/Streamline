// apps/frontend/lib/animations.ts

/**
 * Reusable animation variants for consistent UI
 */

// Fade animations
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.4 }
};

// Slide animations
export const slideInFromLeft = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 100, opacity: 0 },
  transition: { type: 'spring', stiffness: 100, damping: 20 }
};

export const slideInFromRight = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -100, opacity: 0 },
  transition: { type: 'spring', stiffness: 100, damping: 20 }
};

// Scale animations
export const scaleIn = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

export const scaleUp = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { duration: 0.2 }
};

// Stagger animations
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4 }
  }
};

// Card animations
export const cardHover = {
  rest: { scale: 1 },
  hover: { 
    scale: 1.03, 
    y: -5,
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 }
};

// Button animations
export const buttonTap = {
  whileTap: { scale: 0.95 },
  whileHover: { scale: 1.05 }
};

// Loading animations
export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

export const spin = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

// Modal animations
export const modalOverlay = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
};

export const modalContent = {
  initial: { scale: 0.9, opacity: 0, y: 20 },
  animate: { scale: 1, opacity: 1, y: 0 },
  exit: { scale: 0.9, opacity: 0, y: 20 },
  transition: { type: 'spring', damping: 25, stiffness: 300 }
};

// ============================================
// CUSTOM HOOKS
// ============================================

import { useEffect, useState, useRef } from 'react';
import { useInView } from 'framer-motion';

/**
 * Hook for detecting reduced motion preference
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for scroll-triggered animations
 */
export function useScrollAnimation(threshold = 0.1) {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: true, 
    margin: `-${threshold * 100}% 0px` 
  });

  return { ref, isInView };
}

/**
 * Hook for detecting mobile device
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

/**
 * Hook for optimized animations based on device
 */
export function useOptimizedAnimation() {
  const prefersReducedMotion = usePrefersReducedMotion();
  const isMobile = useIsMobile();

  return {
    shouldAnimate: !prefersReducedMotion,
    duration: prefersReducedMotion ? 0 : isMobile ? 0.2 : 0.4,
    easing: 'easeOut'
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get responsive animation duration based on device
 */
export function getAnimationDuration(isMobile: boolean): number {
  return isMobile ? 0.2 : 0.4;
}

/**
 * Create stagger effect for list items
 */
export function createStagger(itemCount: number, baseDelay = 0.1) {
  return {
    animate: {
      transition: {
        staggerChildren: baseDelay,
        delayChildren: 0.1
      }
    }
  };
}

/**
 * Smooth scroll to element
 */
export function smoothScrollTo(elementId: string) {
  const element = document.getElementById(elementId);
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }
}

/**
 * Page transition variants generator
 */
export function createPageTransition(direction: 'left' | 'right' | 'up' | 'down' = 'up') {
  const directions = {
    left: { x: -100 },
    right: { x: 100 },
    up: { y: 20 },
    down: { y: -20 }
  };

  return {
    initial: { ...directions[direction], opacity: 0 },
    animate: { x: 0, y: 0, opacity: 1 },
    exit: { ...directions[direction], opacity: 0 },
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
  };
}