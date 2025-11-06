import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { 
  ChevronUp, 
  ChevronDown, 
  Shield, 
  AlertTriangle, 
  Activity,
  MapPin,
  Clock,
  TrendingUp,
  Info
} from 'lucide-react';

const StatusSheet = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef(null);
  
  const { 
    currentStatus, 
    lastChecked, 
    nearbySensors,
    threatData,
    wsConnected
  } = useAppStore();

  const formatLastChecked = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const checked = new Date(timestamp);
    const diff = now - checked;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    return checked.toLocaleTimeString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'safe':
        return {
          bg: 'bg-success-50',
          border: 'border-success-200',
          text: 'text-success-700',
          icon: 'text-success-500'
        };
      case 'warning':
        return {
          bg: 'bg-warning-50',
          border: 'border-warning-200',
          text: 'text-warning-700',
          icon: 'text-warning-500'
        };
      case 'danger':
        return {
          bg: 'bg-danger-50',
          border: 'border-danger-200',
          text: 'text-danger-700',
          icon: 'text-danger-500'
        };
      default:
        return {
          bg: 'bg-neutral-50',
          border: 'border-neutral-200',
          text: 'text-neutral-700',
          icon: 'text-neutral-500'
        };
    }
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case 'safe':
        return 'No threats detected for your area';
      case 'warning':
        return 'Monitor conditions - potential risks nearby';
      case 'danger':
        return 'Immediate action required';
      default:
        return 'Status unknown';
    }
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setCurrentY(e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaY = e.clientY - startY;
    const threshold = 50; // Minimum drag distance to trigger expansion
    
    if (deltaY > threshold && !isExpanded) {
      setIsExpanded(true);
      setIsDragging(false);
    } else if (deltaY < -threshold && isExpanded) {
      setIsExpanded(false);
      setIsDragging(false);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const deltaY = e.touches[0].clientY - startY;
    const threshold = 50;
    
    if (deltaY > threshold && !isExpanded) {
      setIsExpanded(true);
      setIsDragging(false);
    } else if (deltaY < -threshold && isExpanded) {
      setIsExpanded(false);
      setIsDragging(false);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const statusColors = getStatusColor(currentStatus);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExpanded]);

  return (
    <div 
      ref={sheetRef}
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        isExpanded ? 'translate-y-0' : 'translate-y-0'
      }`}
      style={{
        height: isExpanded ? '60vh' : '96px',
        maxHeight: '60vh'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className={`h-full ${statusColors.bg} ${statusColors.border} border-t-4 rounded-t-card shadow-lg`}
        style={{
          transform: isDragging ? `translateY(${Math.max(0, currentY - startY) * 0.1}px)` : 'none',
          transition: isDragging ? 'none' : 'transform 300ms ease-out'
        }}
      >
        {/* Handle/Grab Area */}
        <div className="flex justify-center py-3 cursor-pointer">
          <div className="w-12 h-1 bg-neutral-300 rounded-full" />
        </div>

        {/* Collapsed State */}
        {!isExpanded && (
          <div className="flex items-center justify-between px-6 pb-4">
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full ${statusColors.bg} border-2 ${statusColors.border} flex items-center justify-center`}>
                <Shield className={`w-5 h-5 ${statusColors.icon}`} />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`h3 font-bold ${statusColors.text}`}>
                    STATUS: {currentStatus.toUpperCase()}
                  </span>
                </div>
                <p className="small text-neutral-600">
                  {getStatusMessage(currentStatus)}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsExpanded(true)}
              className="p-2 hover:bg-black hover:bg-opacity-10 rounded-button transition-colors"
            >
              <ChevronUp className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        )}

        {/* Expanded State */}
        {isExpanded && (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full ${statusColors.bg} border-2 ${statusColors.border} flex items-center justify-center`}>
                  <Shield className={`w-6 h-6 ${statusColors.icon}`} />
                </div>
                <div>
                  <h2 className={`h2 font-bold ${statusColors.text}`}>
                    Current Status
                  </h2>
                  <p className="small text-neutral-600">
                    {getStatusMessage(currentStatus)}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-black hover:bg-opacity-10 rounded-button transition-colors"
              >
                <ChevronDown className="w-5 h-5 text-neutral-600" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
              {/* System Status */}
              <div className="bg-white rounded-button p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="h3 font-semibold">System Status</h3>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-success-500' : 'bg-neutral-400'}`} />
                    <span className="small text-neutral-600">
                      {wsConnected ? 'Live Data' : 'Offline Mode'}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-neutral-500" />
                      <span className="small text-neutral-600">Last Checked</span>
                    </div>
                    <span className="small font-medium">{formatLastChecked(lastChecked)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-neutral-500" />
                      <span className="small text-neutral-600">Coverage</span>
                    </div>
                    <span className="small font-medium">
                      {nearbySensors.length} sensors active
                    </span>
                  </div>
                </div>
              </div>

              {/* Sensor Summary */}
              <div className="bg-white rounded-button p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="h3 font-semibold">Nearby Sensors</h3>
                  <Activity className="w-5 h-5 text-neutral-500" />
                </div>
                
                {nearbySensors.length > 0 ? (
                  <div className="space-y-2">
                    {nearbySensors.slice(0, 3).map((sensor) => {
                      const isWarning = sensor.sensor_type === 'water_level' 
                        ? sensor.reading_value > 2 
                        : sensor.sensor_type === 'wind_speed'
                        ? sensor.reading_value > 30
                        : false;
                      
                      return (
                        <div key={sensor.sensor_id} className="flex items-center justify-between p-2 bg-neutral-50 rounded-button">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${isWarning ? 'bg-danger-500' : 'bg-success-500'}`} />
                            <span className="small font-medium text-neutral-700">
                              {sensor.sensor_id.replace('_', ' ')}
                            </span>
                          </div>
                          <span className={`small font-semibold ${isWarning ? 'text-danger-600' : 'text-success-600'}`}>
                            {sensor.reading_value}
                            {sensor.sensor_type === 'water_level' ? 'm' : sensor.sensor_type === 'wind_speed' ? 'km/h' : ''}
                          </span>
                        </div>
                      );
                    })}
                    
                    {nearbySensors.length > 3 && (
                      <p className="small text-neutral-500 text-center">
                        +{nearbySensors.length - 3} more sensors
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="small text-neutral-500 text-center py-4">
                    No active sensors in your area
                  </p>
                )}
              </div>

              {/* Threat Information (if any) */}
              {threatData && (
                <div className="bg-danger-50 border border-danger-200 rounded-button p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-danger-500" />
                    <h3 className="h3 font-semibold text-danger-700">Active Threat</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="small text-danger-600">
                      {threatData.description}
                    </p>
                    {threatData.eta_minutes && (
                      <p className="small font-medium text-danger-700">
                        Estimated impact: {threatData.eta_minutes} minutes
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Safety Tips */}
              <div className="bg-primary-50 border border-primary-200 rounded-button p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Info className="w-5 h-5 text-primary-500" />
                  <h3 className="h3 font-semibold text-primary-700">Safety Tips</h3>
                </div>
                
                <ul className="space-y-1">
                  <li className="small text-primary-600">• Stay away from flooded areas</li>
                  <li className="small text-primary-600">• Avoid driving through flood water</li>
                  <li className="small text-primary-600">• Keep emergency contacts ready</li>
                  <li className="small text-primary-600">• Monitor local weather updates</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatusSheet;