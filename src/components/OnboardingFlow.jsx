import React, { useState } from 'react';
import { useAppStore } from '../store/appStore';
import { 
  Shield, 
  Bell, 
  MapPin, 
  CheckCircle, 
  ChevronRight,
  AlertTriangle 
} from 'lucide-react';

const OnboardingFlow = () => {
  const { 
    requestNotificationPermission,
    requestLocationPermission,
    setOnboarding,
    setCompletedOnboarding,
    setHomeLocation,
    userLocation,
    getUserLocation
  } = useAppStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [notificationGranted, setNotificationGranted] = useState(false);
  const [locationGranted, setLocationGranted] = useState(false);
  const [homeSet, setHomeSet] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const totalSteps = 3;

  const handleNotificationRequest = async () => {
    setIsProcessing(true);
    const permission = await requestNotificationPermission();
    setNotificationGranted(permission === 'granted');
    setIsProcessing(false);
    
    if (permission === 'granted') {
      setTimeout(() => {
        setCurrentStep(2);
      }, 1000);
    }
  };

  const handleLocationRequest = async () => {
    setIsProcessing(true);
    const permission = await requestLocationPermission();
    setLocationGranted(permission === 'granted');
    setIsProcessing(false);
    
    if (permission === 'granted') {
      setTimeout(() => {
        setCurrentStep(3);
      }, 1000);
    }
  };

  const handleHomeSetup = async () => {
    if (!userLocation) {
      // Get user location if not already available
      getUserLocation();
    }
    
    setIsProcessing(true);
    
    // Simulate home location setting
    setTimeout(() => {
      setHomeSet(true);
      setCompletedOnboarding(true);
      setIsProcessing(false);
    }, 1000);
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center space-x-2 mb-8">
      {[1, 2, 3].map((step) => (
        <div
          key={step}
          className={`w-3 h-3 rounded-full transition-colors duration-300 ${
            step <= currentStep 
              ? 'bg-primary-500' 
              : 'bg-neutral-200'
          }`}
        />
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Bell className="w-10 h-10 text-primary-500" />
        </div>
        <h1 className="h1 mb-4">Enable Notifications</h1>
        <p className="body text-neutral-600 mb-6 max-w-sm mx-auto">
          To send you life-saving alerts, we need permission to send notifications. 
          These will only be used for critical emergency warnings.
        </p>
      </div>

      <button
        onClick={handleNotificationRequest}
        disabled={isProcessing || notificationGranted}
        className={`btn-primary w-full flex items-center justify-center space-x-2 ${
          notificationGranted ? 'bg-success-500' : ''
        }`}
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full loading-spinner" />
            <span>Requesting...</span>
          </>
        ) : notificationGranted ? (
          <>
            <CheckCircle className="w-5 h-5" />
            <span>Notifications Enabled</span>
          </>
        ) : (
          <>
            <Bell className="w-5 h-5" />
            <span>Allow Notifications</span>
          </>
        )}
      </button>

      {notificationGranted && (
        <div className="mt-4 p-3 bg-success-100 border border-success-200 rounded-button">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-success-500" />
            <span className="small text-success-700">
              You'll receive critical flood warnings here
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <MapPin className="w-10 h-10 text-primary-500" />
        </div>
        <h1 className="h1 mb-4">Enable Location</h1>
        <p className="body text-neutral-600 mb-6 max-w-sm mx-auto">
          To give you personal, street-level warnings, we need access to your location. 
          This allows us to send hyper-local alerts only when you're in danger.
        </p>
      </div>

      <button
        onClick={handleLocationRequest}
        disabled={isProcessing || locationGranted}
        className={`btn-primary w-full flex items-center justify-center space-x-2 ${
          locationGranted ? 'bg-success-500' : ''
        }`}
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full loading-spinner" />
            <span>Requesting...</span>
          </>
        ) : locationGranted ? (
          <>
            <CheckCircle className="w-5 h-5" />
            <span>Location Enabled</span>
          </>
        ) : (
          <>
            <MapPin className="w-5 h-5" />
            <span>Allow Location Access</span>
          </>
        )}
      </button>

      {locationGranted && (
        <div className="mt-4 p-3 bg-success-100 border border-success-200 rounded-button">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-success-500" />
            <span className="small text-success-700">
              We'll only use your location for safety alerts
            </span>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="text-center">
      <div className="mb-8">
        <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-success-500" />
        </div>
        <h1 className="h1 mb-4">Set Your Home Location</h1>
        <p className="body text-neutral-600 mb-6 max-w-sm mx-auto">
          Tap anywhere on the map to set your home location. This is the primary address 
          we'll protect and monitor for flood risks.
        </p>
      </div>

      {!homeSet ? (
        <button
          onClick={handleHomeSetup}
          disabled={isProcessing}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full loading-spinner" />
              <span>Setting Home...</span>
            </>
          ) : (
            <>
              <MapPin className="w-5 h-5" />
              <span>Use Current Location</span>
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      ) : (
        <div className="p-4 bg-success-100 border border-success-200 rounded-button">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="w-5 h-5 text-success-500" />
            <span className="small font-semibold text-success-700">
              Home Location Set
            </span>
          </div>
          <p className="small text-success-600">
            We'll monitor this location for flood risks
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-card shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Shield className="w-8 h-8 text-primary-500" />
              <span className="h2 font-bold text-primary-500">Bantay-AI</span>
            </div>
            <p className="small text-neutral-500">Philippines Flood Warning System</p>
          </div>

          {/* Progress Indicator */}
          {renderStepIndicator()}

          {/* Step Content */}
          <div className="min-h-[400px] flex flex-col justify-center">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
          </div>

          {/* Help Text */}
          <div className="mt-8 p-4 bg-neutral-50 rounded-button border border-neutral-200">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-warning-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="small font-semibold text-neutral-700 mb-1">
                  Your Privacy Matters
                </p>
                <p className="small text-neutral-600">
                  Location data is only used for safety alerts and is never shared with third parties.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Skip Option */}
        {currentStep > 1 && (
          <div className="text-center mt-6">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              className="small text-neutral-500 underline hover:text-neutral-700"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingFlow;