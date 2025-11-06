import React, { useEffect, useState } from 'react';
import { useAppStore, startThreatMonitoring, stopThreatMonitoring } from './store/appStore';
import OnboardingFlow from './components/OnboardingFlow';
import Dashboard from './components/Dashboard';
import DangerAlert from './components/DangerAlert';
import LoadingScreen from './components/LoadingScreen';
import './index.css';

function App() {
  const { 
    hasCompletedOnboarding, 
    isLoading, 
    currentStatus,
    isOnboarding,
    initializeUser,
    cleanup
  } = useAppStore();

  const [appReady, setAppReady] = useState(false);

  // Initialize app on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        // Register service worker
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
              console.log('[App] Service worker registered:', registration);
            })
            .catch((error) => {
              console.error('[App] Service worker registration failed:', error);
            });
        }

        // Initialize user data from local storage
        initializeUser();
        
        setAppReady(true);
      } catch (error) {
        console.error('[App] Initialization failed:', error);
        setAppReady(true);
      }
    };

    initApp();

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [initializeUser, cleanup]); // Add dependencies

  // Start or stop polling based on app state
  useEffect(() => {
    if (appReady && hasCompletedOnboarding && currentStatus !== 'danger') {
      console.log('[App] Starting threat monitoring...');
      startThreatMonitoring();
    } else if (currentStatus === 'danger') {
      console.log('[App] Stopping threat monitoring - danger state active');
      stopThreatMonitoring();
    }
  }, [appReady, hasCompletedOnboarding, currentStatus]);

  // Handle URL parameters for direct links (e.g., from notifications)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const alert = urlParams.get('alert');
    
    if (alert === 'danger') {
      useAppStore.getState().setThreatData({ 
        level: 'danger', 
        description: 'Threat detected via URL parameter.' 
      });
    }
  }, []);

  // Show loading screen
  if (isLoading || !appReady) {
    return <LoadingScreen />;
  }

  // Show onboarding
  if (isOnboarding || !hasCompletedOnboarding) {
    return <OnboardingFlow />;
  }

  // Show danger alert
  if (currentStatus === 'danger') {
    return <DangerAlert />;
  }

  // Show main dashboard
  return <Dashboard />;
}

export default App;