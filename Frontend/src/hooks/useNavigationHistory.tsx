import { useLocation, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

// Store navigation history
const navigationStack: string[] = [];

export const useNavigationHistory = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Track navigation - call this when entering a page
  const trackNavigation = useCallback(() => {
    const currentPath = location.pathname;
    // Don't add duplicates
    if (navigationStack[navigationStack.length - 1] !== currentPath) {
      navigationStack.push(currentPath);
      // Keep stack manageable
      if (navigationStack.length > 20) {
        navigationStack.shift();
      }
    }
  }, [location.pathname]);

  // Smart back navigation
  const goBack = useCallback((defaultPath?: string) => {
    // Remove current page from stack
    navigationStack.pop();
    
    // Get previous page
    const previousPath = navigationStack.pop();
    
    if (previousPath) {
      navigate(previousPath);
    } else if (defaultPath) {
      navigate(defaultPath);
    } else {
      navigate(-1);
    }
  }, [navigate]);

  // Navigate to a new page while tracking
  const navigateTo = useCallback((path: string) => {
    navigationStack.push(location.pathname);
    navigate(path);
  }, [navigate, location.pathname]);

  return {
    trackNavigation,
    goBack,
    navigateTo,
    currentPath: location.pathname,
  };
};

// Helper to get the logical parent route
export const getLogicalParent = (pathname: string, referrer?: string): string => {
  // If coming from dashboard, go back to dashboard
  if (referrer?.includes('/dashboard')) {
    return '/dashboard';
  }
  
  // If coming from comptabilite, go back to comptabilite
  if (referrer?.includes('/comptabilite')) {
    return '/comptabilite';
  }

  // For edit forms, go back to detail page
  if (pathname.includes('/edit')) {
    return pathname.replace('/edit', '');
  }

  // For facturer action, go back to devis detail
  if (pathname.includes('/facturer')) {
    return pathname.replace('/facturer', '').replace('/devis', '/devis');
  }

  // Default module paths
  if (pathname.startsWith('/devis/')) return '/devis';
  if (pathname.startsWith('/factures/')) return '/factures';
  if (pathname.startsWith('/clients/')) return '/clients';
  
  return '/dashboard';
};
