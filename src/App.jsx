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
    fetchCurrentStatus,
    fetchSensorData,
    cleanup
  } = useAppStore();

  const [appReady, setAppReady] = useState(false);
  const [isPollingActive, setIsPollingActive] = useState(false);

  // Initialize app on mount
  useEffect(() => {
    const initApp = async () => {
      try {
        // Register service worker
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
              console.log('[App] Service worker registered:', registration);
              
              // Listen for service worker updates
              registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                  newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                      console.log('[App] New content available, will use on next load');
                    }
                  });
                }
              });
            })
            .catch((error) => {
              console.error('[App] Service worker registration failed:', error);
            });
        }

        // Initialize user data
        await initializeUser();

        // If user exists, fetch initial data
        if (hasCompletedOnboarding) {
          await Promise.all([
            fetchCurrentStatus(),
            fetchSensorData()
          ]);
        }

        setAppReady(true);
      } catch (error) {
        console.error('[App] Initialization failed:', error);
        setAppReady(true); // Still allow app to load even if some init fails
      }
    };

    initApp();

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, []);

  // Start threat monitoring when user completes onboarding
  useEffect(() => {
    if (hasCompletedOnboarding && appReady && !isPollingActive) {
      console.log('[App] Starting threat monitoring (polling every 5 minutes)...');
      startThreatMonitoring();
      setIsPollingActive(true);
    }
  }, [hasCompletedOnboarding, appReady, isPollingActive]);

  // Stop threat monitoring when app is in danger state
  useEffect(() => {
    if (currentStatus === 'danger' && isPollingActive) {
      console.log('[App] Stopping threat monitoring - danger state active');
      stopThreatMonitoring();
      setIsPollingActive(false);
    }
  }, [currentStatus, isPollingActive]);

  // Handle URL parameters for direct links
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const alert = urlParams.get('alert');
    
    if (alert === 'danger') {
      useAppStore.getState().setCurrentStatus('danger');
    }
  }, []);

  // Show loading screen while initializing
  if (!appReady || isLoading) {
    return <LoadingScreen />;
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding && !isOnboarding) {
    return <OnboardingFlow />;
  }

  // Show danger alert if status is danger
  if (currentStatus === 'danger') {
    return <DangerAlert />;
  }

  // Show main dashboard
  return <Dashboard />;
}

export default App;