// Bantay-AI Mock API Server
// This simulates the backend API endpoints for development and testing
// In production, this would be replaced with the actual backend

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Mock data
let currentStatus = 'safe';
let userData = {
  user_id: 'user-123',
  home_location: { lat: 14.5995, lng: 120.9842 },
  fcm_token: 'mock-fcm-token-123',
  is_safe: true
};

let sensors = [
  {
    sensor_id: 'mabini_bridge_water',
    location: { lat: 14.6055, lng: 120.9892 },
    sensor_type: 'water_level',
    reading_value: 0.8,
    status: 'normal',
    last_updated: new Date().toISOString(),
    battery_level: 85
  },
  {
    sensor_id: 'quezon_blvd_wind',
    location: { lat: 14.5955, lng: 120.9792 },
    sensor_type: 'wind_speed',
    reading_value: 15.5,
    status: 'normal',
    last_updated: new Date().toISOString(),
    battery_level: 92
  },
  {
    sensor_id: 'roxas_boulevard_water',
    location: { lat: 14.5895, lng: 120.9752 },
    sensor_type: 'water_level',
    reading_value: 2.3,
    status: 'warning',
    last_updated: new Date().toISOString(),
    battery_level: 67
  }
];

// API Routes

// User endpoints
app.get('/api/v1/user', (req, res) => {
  res.json(userData);
});

app.post('/api/v1/user/location', (req, res) => {
  const { home_location } = req.body;
  if (home_location) {
    userData.home_location = home_location;
  }
  res.json({ success: true, user: userData });
});

app.post('/api/v1/user/safe', (req, res) => {
  userData.is_safe = true;
  currentStatus = 'safe';
  res.json({ success: true, message: 'User marked as safe' });
});

// Sensor endpoints
app.get('/api/v1/sensors', (req, res) => {
  res.json(sensors);
});

// Status endpoints
app.get('/api/v1/status', (req, res) => {
  const status = {
    status: currentStatus,
    last_checked: new Date().toISOString(),
    threat: currentStatus === 'danger' ? {
      threat_id: 'threat-123',
      polygon: [
        [14.5995, 120.9842],
        [14.6095, 120.9942],
        [14.5895, 120.9942],
        [14.5895, 120.9742]
      ],
      threat_type: 'flood',
      predicted_eta_minutes: 40,
      source_text: 'Mabini St. Bridge',
      description: 'Floodwater at Mabini St. Bridge is now 1.5 meters. Based on its 30m/hr speed, it will reach your Home location in 40 minutes.',
      severity: 'severe'
    } : null
  };
  
  res.json(status);
});

// Test endpoints for demo
app.post('/api/v1/test/trigger-danger', (req, res) => {
  currentStatus = 'danger';
  userData.is_safe = false;
  res.json({ success: true, message: 'Danger status triggered' });
});

app.post('/api/v1/test/clear-danger', (req, res) => {
  currentStatus = 'safe';
  userData.is_safe = true;
  res.json({ success: true, message: 'Danger status cleared' });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start HTTP server
const server = app.listen(PORT, () => {
  console.log(`🚀 Bantay-AI Mock API Server running on http://localhost:${PORT}`);
  console.log(`📊 API Endpoints:`);
  console.log(`   GET  /api/v1/user - Get user data`);
  console.log(`   POST /api/v1/user/location - Update user location`);
  console.log(`   GET  /api/v1/sensors - Get sensor data`);
  console.log(`   GET  /api/v1/status - Get current status`);
  console.log(`   POST /api/v1/test/trigger-danger - Trigger danger state`);
  console.log(`   POST /api/v1/test/clear-danger - Clear danger state`);
});

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ server, path: '/ws/live' });

wss.on('connection', (ws) => {
  console.log('[WS] Client connected');
  
  // Send initial connection message
  ws.send(JSON.stringify({
    type: 'connection',
    status: 'connected',
    timestamp: new Date().toISOString()
  }));
  
  // Simulate periodic sensor updates
  const sensorInterval = setInterval(() => {
    // Randomly update sensor values
    sensors = sensors.map(sensor => {
      let newValue = sensor.reading_value;
      
      if (sensor.sensor_type === 'water_level') {
        newValue += (Math.random() - 0.5) * 0.2;
        newValue = Math.max(0, Math.min(5, newValue));
      } else if (sensor.sensor_type === 'wind_speed') {
        newValue += (Math.random() - 0.5) * 5;
        newValue = Math.max(0, Math.min(100, newValue));
      }
      
      return {
        ...sensor,
        reading_value: newValue,
        status: sensor.sensor_type === 'water_level' && newValue > 2 ? 'warning' : 'normal',
        last_updated: new Date().toISOString()
      };
    });
    
    // Send sensor update
    ws.send(JSON.stringify({
      type: 'sensor_update',
      sensors: sensors,
      timestamp: new Date().toISOString()
    }));
  }, 10000); // Every 10 seconds
  
  ws.on('close', () => {
    console.log('[WS] Client disconnected');
    clearInterval(sensorInterval);
  });
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('[WS] Received message:', data);
      
      // Handle client messages
      if (data.type === 'subscribe') {
        ws.send(JSON.stringify({
          type: 'subscribed',
          channel: data.channel
        }));
      }
    } catch (error) {
      console.error('[WS] Error parsing message:', error);
    }
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Shutdown complete');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Shutdown complete');
    process.exit(0);
  });
});