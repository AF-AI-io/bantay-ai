import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { 
  AlertTriangle, 
  Navigation, 
  Shield, 
  Clock,
  MapPin,
  Phone,
  Volume2,
  VolumeX
} from 'lucide-react';

const DangerAlert = () => {
  const { 
    alertData, 
    threatData, 
    homeLocation,
    markUserSafe 
  } = useAppStore();

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [evacuationRoute, setEvacuationRoute] = useState(null);

  // Generate evacuation route (mock data)
  useEffect(() => {
    if (homeLocation) {
      // Mock evacuation center coordinates (would be real in production)
      const evacuationCenter = {
        lat: homeLocation.lat + 0.01, // Offset for demo
        lng: homeLocation.lng + 0.01
      };
      
      setEvacuationRoute(evacuationCenter);
    }
  }, [homeLocation]);

  // Countdown timer for ETA
  useEffect(() => {
    if (threatData?.eta_minutes) {
      let timeLeft = threatData.eta_minutes * 60; // Convert to seconds
      
      const timer = setInterval(() => {
        timeLeft--;
        setCountdown(Math.max(0, timeLeft));
        
        if (timeLeft <= 0) {
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [threatData]);

  // Play alert sound
  useEffect(() => {
    if (soundEnabled && 'Audio' in window) {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  }, [soundEnabled]);

  // Format countdown display
  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Open evacuation routes in external app
  const openEvacuationRoute = () => {
    if (!evacuationRoute || !homeLocation) return;
    
    const url = `https://www.google.com/maps/dir/${homeLocation.lat},${homeLocation.lng}/${evacuationRoute.lat},${evacuationRoute.lng}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Handle "I Am Safe" button
  const handleSafeConfirm = async () => {
    try {
      await markUserSafe();
      // The store will handle the status change back to safe
    } catch (error) {
      console.error('Error marking user safe:', error);
    }
  };

  // Get threat details
  const getThreatDetails = () => {
    if (alertData) return alertData;
    if (threatData) return threatData;
    
    // Default fallback
    return {
      title: 'FLOOD WARNING',
      description: 'Severe flooding detected in your area. Immediate evacuation recommended.',
      type: 'flood',
      urgency: 'immediate'
    };
  };

  const threat = getThreatDetails();

  // Get threat icon based on type
  const getThreatIcon = (type) => {
    switch (type) {
      case 'flood':
        return '🌊';
      case 'storm_surge':
        return '🌊';
      case 'wind':
        return '💨';
      default:
        return '⚠️';
    }
  };

  // Get evacuation center name (mock)
  const getEvacuationCenterName = () => {
    return 'Barangay Evacuation Center';
  };

  // Emergency contact
  const emergencyContact = '911';

  return (
    <div className="h-screen bg-gradient-to-br from-danger-500 via-danger-600 to-red-700 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="warning" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M10 0 L20 10 L10 20 L0 10 Z" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#warning)" />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 pt-12 pb-8 text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-3xl">{getThreatIcon(threat.type)}</span>
          </div>
          <AlertTriangle className="w-12 h-12 animate-bounce" />
        </div>
        
        <h1 className="display font-extrabold mb-2 animate-pulse">
          EVACUATE NOW
        </h1>
        
        <p className="h2 font-semibold opacity-90">
          {threat.title || 'SEVERE FLOOD WARNING'}
        </p>
      </div>

      {/* Main Alert Content */}
      <div className="relative z-10 px-6 mb-8">
        <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-card p-6 mb-6">
          <h2 className="h2 font-bold mb-4 text-center">
            {threat.description}
          </h2>
          
          {/* Threat Details */}
          <div className="space-y-4">
            {countdown !== null && (
              <div className="flex items-center justify-center space-x-3 p-4 bg-white bg-opacity-20 rounded-button">
                <Clock className="w-6 h-6" />
                <div>
                  <p className="small font-semibold">Estimated Impact Time</p>
                  <p className="h3 font-bold">{formatCountdown(countdown)}</p>
                </div>
              </div>
            )}
            
            {homeLocation && (
              <div className="flex items-center justify-center space-x-3 p-4 bg-white bg-opacity-20 rounded-button">
                <MapPin className="w-6 h-6" />
                <div>
                  <p className="small font-semibold">Your Location</p>
                  <p className="body font-medium">
                    {homeLocation.lat.toFixed(4)}, {homeLocation.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Primary Action - Evacuation Route */}
          <button
            onClick={openEvacuationRoute}
            disabled={!evacuationRoute}
            className="w-full bg-white text-danger-600 h-16 rounded-button font-bold text-lg flex items-center justify-center space-x-3 hover:bg-gray-100 transition-colors active:scale-95"
          >
            <Navigation className="w-6 h-6" />
            <span>SHOW EVACUATION ROUTE</span>
            <Navigation className="w-6 h-6" />
          </button>

          {/* Secondary Action - I Am Safe */}
          <button
            onClick={handleSafeConfirm}
            className="w-full bg-transparent border-2 border-white text-white h-14 rounded-button font-semibold text-base flex items-center justify-center space-x-2 hover:bg-white hover:bg-opacity-10 transition-colors active:scale-95"
          >
            <Shield className="w-5 h-5" />
            <span>I AM SAFE</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-30 p-6">
        {/* Emergency Contacts */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Phone className="w-5 h-5" />
            <span className="small font-semibold">Emergency: {emergencyContact}</span>
          </div>
          
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-button transition-colors"
          >
            {soundEnabled ? (
              <Volume2 className="w-5 h-5" />
            ) : (
              <VolumeX className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-white bg-opacity-20 rounded-button p-4">
          <h3 className="small font-bold mb-2">IMMEDIATE ACTIONS:</h3>
          <ol className="small space-y-1">
            <li>1. Grab emergency kit and documents</li>
            <li>2. Turn off utilities if safe to do so</li>
            <li>3. Follow evacuation route to higher ground</li>
            <li>4. Do not attempt to drive through flood water</li>
          </ol>
        </div>

        {/* Evacuation Center Info */}
        {evacuationRoute && (
          <div className="mt-4 bg-white bg-opacity-20 rounded-button p-3">
            <p className="small font-semibold mb-1">Nearest Evacuation Center:</p>
            <p className="small">{getEvacuationCenterName()}</p>
            <p className="small opacity-80">
              Distance: ~{homeLocation ? 
                Math.round(
                  useAppStore.getState().calculateDistance(
                    homeLocation.lat, homeLocation.lng,
                    evacuationRoute.lat, evacuationRoute.lng
                  )
                ) : 0}m away
            </p>
          </div>
        )}
      </div>

      {/* Pulse Animation Overlay */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white opacity-5 rounded-full animate-ping" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white opacity-5 rounded-full animate-ping animation-delay-1000" />
      </div>
    </div>
  );
};

export default DangerAlert;