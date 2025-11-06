import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Netlify Functions API Base URL
const API_BASE_URL = '/.netlify/functions';

// Store for managing app state
export const useAppStore = create(
  persist(
    (set, get) => ({
      // User state
      user: null,
      isLoading: false,
      error: null,
      
      // Permission states
      notificationsPermission: 'denied', // Not used anymore
      locationPermission: 'default',
      
      // App flow state
      isOnboarding: false,
      hasCompletedOnboarding: false,
      
      // Current status
      currentStatus: 'safe', // 'safe' | 'danger' | 'warning'
      lastChecked: null,
      
      // Map and location state
      userLocation: null,
      homeLocation: null,
      map: null,
      
      // Sensor data
      sensors: [],
      nearbySensors: [],
      
      // Real-time data
      threatData: null,
      alertData: null,
      
      // Polling state
      isPolling: false,
      pollInterval: null,
      
      // Actions
      setUser: (user) => set({ user }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      setNotificationsPermission: (permission) => set({ notificationsPermission: permission }),
      setLocationPermission: (permission) => set({ locationPermission: permission }),
      setOnboarding: (isOnboarding) => set({ isOnboarding }),
      setCompletedOnboarding: (completed) => set({ hasCompletedOnboarding: completed }),
      setCurrentStatus: (status) => set({ currentStatus: status }),
      setLastChecked: (time) => set({ lastChecked: time }),
      setUserLocation: (location) => set({ userLocation: location }),
      setHomeLocation: (location) => set({ homeLocation: location }),
      setMap: (map) => set({ map }),
      setSensors: (sensors) => set({ sensors }),
      setNearbySensors: (sensors) => set({ nearbySensors }),
      setThreatData: (data) => set({ threatData: data }),
      setAlertData: (data) => set({ alertData: data }),
      setPolling: (polling) => set({ isPolling: polling }),
      setPollInterval: (interval) => set({ pollInterval: interval }),
      
      // API Methods
      initializeUser: async () => {
        set({ isLoading: true, error: null });
        try {
          // Simulate API delay for better UX
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // For demo, create a demo user if none exists
          let userData = localStorage.getItem('bantay-user');
          if (!userData) {
            userData = {
              id: `demo-user-${Date.now()}`,
              created_at: new Date().toISOString(),
            };
            localStorage.setItem('bantay-user', JSON.stringify(userData));
          } else {
            userData = JSON.parse(userData);
          }
          
          set({ 
            user: userData,
            homeLocation: null, // Will be set during onboarding
            hasCompletedOnboarding: false
          });
        } catch (error) {
          set({ error: error.message });
        } finally {
          set({ isLoading: false });
        }
      },
      
      // Note: Push notifications are no longer supported
      // Removed requestNotificationPermission function
      
      requestLocationPermission: async () => {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          set({ locationPermission: permission.state });
          
          if (permission.state === 'granted') {
            get().getUserLocation();
          }
          
          return permission.state;
        } catch (error) {
          set({ error: error.message });
          return 'denied';
        }
      },
      
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
            set({ userLocation: location });
            
            // Save user location to local storage for demo
            const user = get().user;
            if (user) {
              user.home_location = location;
              localStorage.setItem('bantay-user', JSON.stringify(user));
              set({ user });
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            set({ error: 'Failed to get location' });
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      },
      
      updateUserLocation: async (location) => {
        try {
          const user = get().user;
          if (!user) return;
          
          // Save to local storage (demo mode)
          user.home_location = location;
          localStorage.setItem('bantay-user', JSON.stringify(user));
          set({ 
            homeLocation: location,
            user 
          });
          
          // In production, this would save to Netlify function
          console.log('Location updated:', location);
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      // Generate simulated sensor data
      fetchSensorData: async () => {
        try {
          // Simulate API delay
          await new Promise(resolve => setTimeout(resolve, 300));
          
          // Generate realistic sensor data for Metro Manila
          const baseSensors = [
            { id: 1, name: 'Manila Bay Station', location: { lat: 14.5995, lng: 120.9842 }, type: 'water_level' },
            { id: 2, name: 'Pasig River Station', location: { lat: 14.5700, lng: 121.0000 }, type: 'water_level' },
            { id: 3, name: 'Marikina Station', location: { lat: 14.6500, lng: 121.0500 }, type: 'water_level' },
            { id: 4, name: 'Navotas Station', location: { lat: 14.6700, lng: 120.9400 }, type: 'water_level' },
            { id: 5, name: 'Parañaque Station', location: { lat: 14.4800, lng: 121.0000 }, type: 'water_level' },
          ];
          
          const sensorData = baseSensors.map(sensor => {
            const currentThreatLevel = get().currentStatus;
            let waterLevel = 0.5 + Math.random() * 1.5; // 0.5 - 2.0m normal
            
            // If in danger mode, simulate elevated water levels
            if (currentThreatLevel === 'danger') {
              waterLevel = 2.0 + Math.random() * 1.5; // 2.0 - 3.5m danger
            } else if (currentThreatLevel === 'warning') {
              waterLevel = 1.2 + Math.random() * 0.8; // 1.2 - 2.0m warning
            }
            
            return {
              ...sensor,
              water_level: waterLevel,
              status: waterLevel > 2.5 ? 'danger' : waterLevel > 1.5 ? 'warning' : 'safe',
              last_updated: new Date().toISOString()
            };
          });
          
          set({ sensors: sensorData });
          
          // Filter nearby sensors based on user location
          const userLocation = get().userLocation;
          if (userLocation) {
            const nearby = sensorData.filter(sensor => {
              const distance = get().calculateDistance(
                userLocation.lat, userLocation.lng,
                sensor.location.lat, sensor.location.lng
              );
              return distance < 10000; // Within 10km
            });
            set({ nearbySensors: nearby });
          }
        } catch (error) {
          set({ error: error.message });
        }
      },
      
      // NEW: Fetch current threat status from Netlify function
      fetchCurrentStatus: async () => {
        try {
          console.log('Fetching current threat status...');
          
          // Try to fetch from Netlify function first
          try {
            const response = await fetch(`${API_BASE_URL}/get-status`);
            if (response.ok) {
              const data = await response.json();
              set({ 
                currentStatus: data.threat.level,
                lastChecked: new Date().toISOString(),
                threatData: data.threat
              });
              
              // Update sensors based on threat level
              await get().fetchSensorData();
              
              console.log(`Status updated: ${data.threat.level}`);
              return;
            }
          } catch (netlifyError) {
            console.warn('Netlify function unavailable, using local simulation:', netlifyError);
          }
          
          // Fallback: Simulate status based on URL parameters or random
          const urlParams = new URLSearchParams(window.location.search);
          const forceStatus = urlParams.get('forceStatus');
          let status = 'safe';
          
          if (forceStatus) {
            status = forceStatus;
          } else {
            // Random demo: 30% chance of warning, 5% chance of danger
            const rand = Math.random();
            if (rand < 0.05) status = 'danger';
            else if (rand < 0.30) status = 'warning';
          }
          
          set({ 
            currentStatus: status,
            lastChecked: new Date().toISOString(),
            threatData: {
              is_active: status !== 'safe',
              level: status,
              description: status === 'safe' ? 'No active threats detected' :
                         status === 'warning' ? 'Elevated flood risk detected in multiple areas' :
                         'DANGER: Severe flooding detected. Immediate evacuation recommended.',
              timestamp: new Date().toISOString(),
            }
          });
          
          // Update sensors based on status
          await get().fetchSensorData();
          
        } catch (error) {
          console.error('Error fetching status:', error);
          set({ error: error.message });
        }
      },
      
      // NEW: Mark user as safe (updates Netlify function)
      markUserSafe: async () => {
        try {
          console.log('Marking user as safe...');
          
          const user = get().user;
          if (!user) {
            throw new Error('No user data available');
          }
          
          // Try to update via Netlify function first
          try {
            const response = await fetch(`${API_BASE_URL}/mark-safe`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: user.id })
            });
            
            if (response.ok) {
              console.log('User marked as safe via Netlify function');
            } else {
              throw new Error('Netlify function call failed');
            }
          } catch (netlifyError) {
            console.warn('Netlify function unavailable, using local update:', netlifyError);
          }
          
          // Always update local state regardless of backend call success
          set({ 
            currentStatus: 'safe', 
            alertData: null 
          });
          
          // Reset sensors to safe state
          const sensors = get().sensors.map(sensor => ({
            ...sensor,
            water_level: 0.5 + Math.random() * 1.0,
            status: 'safe'
          }));
          set({ sensors });
          
        } catch (error) {
          console.error('Error marking user as safe:', error);
          set({ error: error.message });
        }
      },
      
      // NEW: Start polling for threat updates every 5 minutes
      startThreatPolling: () => {
        const existingInterval = get().pollInterval;
        if (existingInterval) {
          clearInterval(existingInterval);
        }
        
        console.log('Starting 5-minute threat polling...');
        set({ isPolling: true });
        
        const interval = setInterval(() => {
          console.log('Polling for threat updates...');
          get().fetchCurrentStatus();
        }, 5 * 60 * 1000); // 5 minutes
        
        set({ pollInterval: interval });
        
        // Also fetch immediately
        get().fetchCurrentStatus();
      },
      
      // NEW: Stop threat polling
      stopThreatPolling: () => {
        const interval = get().pollInterval;
        if (interval) {
          clearInterval(interval);
          set({ pollInterval: null });
        }
        set({ isPolling: false });
        console.log('Stopped threat polling');
      },
      
      // Utility functions
      calculateDistance: (lat1, lng1, lat2, lng2) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c * 1000; // Return in meters
      },
      
      // Cleanup
      cleanup: () => {
        get().stopThreatPolling();
      }
    }),
    {
      name: 'bantay-ai-storage',
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        homeLocation: state.homeLocation,
        locationPermission: state.locationPermission,
        user: state.user
      })
    }
  )
);

// Export a simple function to start polling (can be called from App.jsx)
export const startThreatMonitoring = () => {
  useAppStore.getState().startThreatPolling();
};

// Export a function to stop monitoring
export const stopThreatMonitoring = () => {
  useAppStore.getState().stopThreatPolling();
};