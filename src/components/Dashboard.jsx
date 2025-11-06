import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import StatusSheet from './StatusSheet';
import MapComponent from './MapComponent';
import { 
  Shield, 
  Settings, 
  RefreshCw, 
  MapPin,
  AlertCircle,
  Wifi,
  WifiOff
} from 'lucide-react';

const Dashboard = () => {
  const { 
    currentStatus,
    lastChecked,
    userLocation,
    homeLocation,
    nearbySensors,
    wsConnected, // This will be false, but we'll leave it
    fetchCurrentStatus, // This is the REAL function
    // fetchSensorData, // <--- THIS WAS THE BUG. It's gone now.
    getUserLocation
  } = useAppStore();

  const [showSettings, setShowSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Now we only call the one real function
      await fetchCurrentStatus();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLocationUpdate = () => {
    getUserLocation();
  };

  const formatLastChecked = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const checked = new Date(timestamp);
    const diff = now - checked;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    return checked.toLocaleTimeString();
  };

  return (
    <div className="h-screen bg-neutral-50 relative overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-white shadow-md">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-primary-500" />
            <div>
              <h1 className="h2 font-bold text-neutral-900">Bantay-AI</h1>
              <p className="small text-neutral-500">Flood Warning System</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Connection Status */}
            <div className="flex items-center space-x-1">
              {/* We use polling, so show offline icon as "not real-time" */}
              <WifiOff className="w-4 h-4 text-neutral-400" />
              <span className="small text-neutral-500">
                Polling
              </span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 hover:bg-neutral-100 rounded-button transition-colors"
            >
              <RefreshCw 
                className={`w-5 h-5 text-neutral-600 ${
                  refreshing ? 'loading-spinner' : ''
                }`} 
              />
            </button>

            {/* Settings Button */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-neutral-100 rounded-button transition-colors"
            >
              <Settings className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </div>

        {/* Status Banner */}
        <div className="px-4 pb-3">
          <div className={`p-3 rounded-button border ${
            currentStatus === 'safe' 
              ? 'bg-success-50 border-success-200' 
              : currentStatus === 'warning'
              ? 'bg-warning-50 border-warning-200'
              : 'bg-danger-50 border-danger-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${
                  currentStatus === 'safe' 
                    ? 'bg-success-500' 
                    : currentStatus === 'warning'
                    ? 'bg-warning-500'
                    : 'bg-danger-500'
                }`} />
                <span className={`small font-semibold ${
                  currentStatus === 'safe' 
                    ? 'text-success-700' 
                    : currentStatus === 'warning'
                    ? 'text-warning-700'
                    : 'text-danger-700'
                }`}>
                  {currentStatus === 'safe' ? 'SAFE' : 
                   currentStatus === 'warning' ? 'CAUTION' : 'DANGER'}
                </span>
              </div>
              
              <span className="small text-neutral-500">
                Last checked: {formatLastChecked(lastChecked)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Map Container */}
      <div className="h-full pt-32">
        <MapComponent />
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-24 right-4 z-40 flex flex-col space-y-3">
        {/* My Location Button */}
        {userLocation && (
          <button
            onClick={handleLocationUpdate}
            className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-primary-500 hover:bg-primary-50 transition-colors"
            title="Update my location"
          >
            <MapPin className="w-6 h-6 text-primary-500" />
          </button>
        )}
      </div>

      {/* Status Sheet */}
      <StatusSheet />

      {/* Settings Panel (if needed) */}
      {showSettings && (
        <div className="absolute inset-0 z-60 bg-black bg-opacity-50 flex items-end">
          <div className="w-full bg-white rounded-t-card p-6 max-h-96">
            <div className="flex items-center justify-between mb-4">
              <h2 className="h2 font-semibold">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-neutral-50 rounded-button">
                <h3 className="small font-semibold mb-2">Home Location</h3>
                {homeLocation ? (
                  <p className="small text-neutral-600">
                    {homeLocation.address}
                  </p>
                ) : (
                  <p className="small text-neutral-500">Not set</p>
                )}
              </div>
              
              <div className="p-4 bg-neutral-50 rounded-button">
                <h3 className="small font-semibold mb-2">Nearby Sensors</h3>
                <p className="small text-neutral-600">
                  {nearbySensors.length} sensors found in last update.
                </p>
              </div>
              
              <div className="p-4 bg-neutral-50 rounded-button">
                <h3 className="small font-semibold mb-2">Connection</h3>
                <div className="flex items-center space-x-2">
                    <WifiOff className="w-4 h-4 text-neutral-400" />
                    <span className="small text-neutral-500">Polling every 5 minutes</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Contact Info (always visible in corner) */}
      <div className="absolute top-20 left-4 z-30">
        <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-button p-3 shadow-lg max-w-xs">
          <div className="flex items-center space-x-2 mb-1">
            <AlertCircle className="w-4 h-4 text-primary-500" />
            <span className="small font-semibold text-neutral-700">Emergency</span>
          </div>
          <p className="small text-neutral-600">
            Call 911 for immediate assistance
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;