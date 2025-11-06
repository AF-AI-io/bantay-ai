import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Netlify Functions API Base URL
const API_BASE_URL = '/.netlify/functions';

// This is the polling interval handle
let threatPollInterval = null;

export const useAppStore = create(
  persist(
    (set, get) => ({
      // User state
      user: null, // Will be set on init
      isLoading: true,
      error: null,
      
      // Permission states
      locationPermission: 'default',
      
      // App flow state
      isOnboarding: true,
      hasCompletedOnboarding: false,
      
      // Current status
      currentStatus: 'safe', // 'safe' | 'danger' | 'warning'
      lastChecked: null,
      
      // Map and location state
      userLocation: null, // User's current physical location
      homeLocation: null, // The saved location we are monitoring

      
      // Data from the backend
      nearbySensors: [], // This will now come from threatData
      threatData: null,
      wsConnected: false, // We use polling, so this will be false
      
      // --- CORE ACTIONS ---
      
      // 1. Called by App.jsx on load
      initializeUser: () => {
        set({ isLoading: true, error: null });
        
        // Get user from local storage
        const storedUser = get().user;
        const storedOnboarding = get().hasCompletedOnboarding;

        if (storedUser && storedOnboarding) {
          // User exists, move to dashboard
          set({ 
            user: storedUser,
            homeLocation: get().homeLocation, // Load saved home
            isOnboarding: false,
            hasCompletedOnboarding: true,
            isLoading: false 
          });
        } else {
          // New user, start onboarding
          const newUserID = `user_${Date.now()}`;
          set({ 
            user: { id: newUserID },
            isOnboarding: true,
            hasCompletedOnboarding: false,
            isLoading: false 
          });
        }
      },

      // 2. Called by OnboardingFlow.jsx
      requestLocationPermission: async () => {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          set({ locationPermission: permission.state });
          
          if (permission.state === 'granted' || permission.state === 'prompt') {
            get().getUserLocation(); // Try to get location
          }
          return permission.state;
        } catch (error) {
          set({ error: error.message });
          return 'denied';
        }
      },

      // 3. Called by requestLocationPermission
      getUserLocation: () => {
        if (!navigator.geolocation) {
          set({ error: 'Geolocation not supported' });
          return;
        }
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
            set({ userLocation: location }); // Set current location
          },
          (error) => {
            console.error('Geolocation error:', error);
            set({ error: 'Failed to get location' });
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      },

      // 4. Called by OnboardingFlow.jsx to save the home location
      updateUserLocation: async (location) => {
        const user = get().user;
        if (!user) return;

        // Optimistically set home location in state
        set({ homeLocation: location });

        try {
          // Actually call the Netlify function to save it to GitHub
          const response = await fetch(`${API_BASE_URL}/save-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              user_id: user.id,
              home_location: location
            })
          });

          if (!response.ok) {
            throw new Error('Failed to save user location to backend');
          }

          const data = await response.json();
          console.log('User location saved to GitHub:', data);
        } catch (error) {
          console.error('Error saving user location:', error);
          set({ error: error.message });
          // Note: In a real app, you might want to retry this.
        }
      },

      // 5. Called by polling to get status
      fetchCurrentStatus: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/get-status`);
          if (!response.ok) {
            throw new Error('API server is not responding');
          }
          
          const data = await response.json();
          
          set({ 
            currentStatus: data.threat.level,
            lastChecked: new Date().toISOString(),
            threatData: data.threat,
            // Update sensors based on REAL data from the threat object
            nearbySensors: data.threat.sensors || [] 
          });
          
        } catch (error) {
          console.error('Error fetching status:', error);
          set({ error: error.message, currentStatus: 'safe' }); // Default to safe on error
        }
      },

      // 6. Called by DangerAlert.jsx
      markUserSafe: async () => {
        const user = get().user;
        if (!user) return;

        // Optimistically update UI
        set({ currentStatus: 'safe', threatData: null, nearbySensors: [] });

        try {
          const response = await fetch(`${API_BASE_URL}/mark-safe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id })
          });

          if (!response.ok) {
            throw new Error('Failed to mark user as safe on backend');
          }

          console.log('User marked as safe on backend');
          get().fetchCurrentStatus(); // Re-sync with server
          
        } catch (error) {
          console.error('Error marking user as safe:', error);
          // In a real app, queue this with background sync
        }
      },

      // --- POLLING ---
      startThreatPolling: () => {
        if (threatPollInterval) {
          clearInterval(threatPollInterval);
        }
        
        console.log('Starting 5-minute threat polling...');
        
        // Run immediately first
        get().fetchCurrentStatus();
        
        threatPollInterval = setInterval(() => {
          console.log('Polling for threat updates...');
          get().fetchCurrentStatus();
        }, 5 * 60 * 1000); // 5 minutes
      },

      stopThreatPolling: () => {
        if (threatPollInterval) {
          clearInterval(threatPollInterval);
          threatPollInterval = null;
        }
        console.log('Stopped threat polling');
      },
      
      // --- HELPERS ---
      setCompletedOnboarding: (completed) => {
        set({ hasCompletedOnboarding: completed, isOnboarding: false });
      },

      calculateDistance: (lat1, lng1, lat2, lng2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c * 1000; // Return in meters
      },
      cleanup: () => {
        get().stopThreatPolling();
      }
    }),
    {
      name: 'bantay-ai-storage', // Local storage key
      partialize: (state) => ({
        // Only save these things to local storage
        user: state.user,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        homeLocation: state.homeLocation,
        locationPermission: state.locationPermission,
      })
    }
  )
);

// Export functions to be called from App.jsx
export const startThreatMonitoring = () => {
  useAppStore.getState().startThreatPolling();
};

export const stopThreatMonitoring = () => {
  useAppStore.getState().stopThreatPolling();
};