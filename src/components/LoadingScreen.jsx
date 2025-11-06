import React from 'react';
import { Shield, MapPin, Bell } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 flex items-center justify-center p-4">
      <div className="text-center text-white">
        {/* Logo and App Name */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="h1 font-bold mb-2">Bantay-AI</h1>
          <p className="body opacity-90">Philippines Flood Warning System</p>
        </div>

        {/* Loading Spinner */}
        <div className="mb-8">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full loading-spinner mx-auto mb-4" />
          <p className="small opacity-80">Initializing safety systems...</p>
        </div>

        {/* Feature Icons */}
        <div className="flex justify-center space-x-8 opacity-60">
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2 mx-auto">
              <MapPin className="w-6 h-6" />
            </div>
            <p className="small">Location</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2 mx-auto">
              <Bell className="w-6 h-6" />
            </div>
            <p className="small">Alerts</p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mb-2 mx-auto">
              <Shield className="w-6 h-6" />
            </div>
            <p className="small">Protection</p>
          </div>
        </div>

        {/* Version Info */}
        <div className="mt-12 opacity-50">
          <p className="small">v1.0.0 - Life-Saving Technology</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;