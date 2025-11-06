// Mock API data for Bantay-AI demonstration
// In production, this would be replaced with real backend APIs

const mockUser = {
  user_id: "user-123",
  home_location: {
    lat: 14.5995,
    lng: 120.9842
  },
  fcm_token: "mock-fcm-token-123",
  is_safe: true,
  created_at: "2024-01-01T00:00:00Z",
  last_active: "2024-01-01T12:00:00Z"
};

const mockSensors = [
  {
    sensor_id: "mabini_bridge_water",
    location: { lat: 14.6055, lng: 120.9892 },
    sensor_type: "water_level",
    reading_value: 0.8,
    status: "normal",
    last_updated: "2024-01-01T11:48:00Z",
    battery_level: 85
  },
  {
    sensor_id: "quezon_blvd_wind",
    location: { lat: 14.5955, lng: 120.9792 },
    sensor_type: "wind_speed", 
    reading_value: 15.5,
    status: "normal",
    last_updated: "2024-01-01T11:47:00Z",
    battery_level: 92
  },
  {
    sensor_id: "espana_cam_01",
    location: { lat: 14.6085, lng: 120.9912 },
    sensor_type: "camera",
    reading_value: 1,
    status: "normal",
    last_updated: "2024-01-01T11:46:00Z",
    battery_level: 78
  },
  {
    sensor_id: "roxas_boulevard_water",
    location: { lat: 14.5895, lng: 120.9752 },
    sensor_type: "water_level",
    reading_value: 2.3,
    status: "warning",
    last_updated: "2024-01-01T11:49:00Z",
    battery_level: 67
  }
];

const mockStatusSafe = {
  status: "safe",
  threat: null,
  message: "No threats detected for your area",
  last_checked: "2024-01-01T11:48:00Z"
};

const mockStatusDanger = {
  status: "danger",
  threat: {
    threat_id: "threat-123",
    polygon: [
      [14.5995, 120.9842],
      [14.6095, 120.9942],
      [14.5895, 120.9942],
      [14.5895, 120.9742]
    ],
    threat_type: "flood",
    predicted_eta_minutes: 40,
    source_text: "Mabini St. Bridge",
    description: "Floodwater at Mabini St. Bridge is now 1.5 meters. Based on its 30m/hr speed, it will reach your Home location in 40 minutes.",
    severity: "severe"
  },
  message: "Immediate action required",
  last_checked: "2024-01-01T11:48:00Z"
};

const mockAlertData = {
  title: "🚨 BANTAY-AI: EVACUATE NOW 🚨",
  body: "Floodwater at Mabini St. will reach your home in 40 minutes. Tap for details.",
  threat_type: "flood",
  urgency: "immediate",
  alert_id: "alert-123",
  timestamp: "2024-01-01T11:48:00Z"
};

// Mock API responses
export const mockAPI = {
  // User API
  getUser: () => Promise.resolve(mockUser),
  
  // Sensor API
  getSensors: () => Promise.resolve(mockSensors),
  
  // Status API
  getStatus: (status = 'safe') => {
    return status === 'danger' ? 
      Promise.resolve(mockStatusDanger) : 
      Promise.resolve(mockStatusSafe);
  },
  
  // Alert API
  getAlert: () => Promise.resolve(mockAlertData),
  
  // Mock WebSocket message types
  wsMessages: {
    sensor_update: {
      type: 'sensor_update',
      sensors: mockSensors
    },
    status_change: {
      type: 'status_change',
      status: 'danger',
      threat: mockStatusDanger.threat
    },
    alert: {
      type: 'alert',
      alert: mockAlertData
    }
  }
};

// Simulate API delay for realistic experience
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const simulateAPIDelay = async (min = 100, max = 500) => {
  const randomDelay = Math.random() * (max - min) + min;
  await delay(randomDelay);
};

export default mockAPI;