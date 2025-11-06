# Bantay-AI 🇵🇭

**AI-powered hyper-local flood warnings for the Philippines**

Bantay-AI (Tagalog for "Guard-AI") is a mission-critical Progressive Web App (PWA) that provides street-level flood warnings by combining IoT sensor data with AI-powered predictive modeling.

## 🚀 Features

### Core Functionality
- **Hyper-local Flood Warnings**: Street-specific predictions vs. broad regional alerts
- **Real-time Sensor Integration**: Live data from water level, wind speed, and camera sensors
- **AI Predictive Modeling**: Generates threat polygons and ETA predictions
- **Offline-First PWA**: Works even without internet connection
- **Push Notifications**: System-level emergency alerts
- **Geospatial Mapping**: Interactive Leaflet.js maps with sensor visualization

### User Experience
- **Seamless Onboarding**: Permission requests and home location setup
- **Safe Dashboard**: Interactive map with sensor status and swipe-up status sheet
- **Danger Alert**: Full-screen emergency interface with evacuation routes
- **Mobile-Optimized**: Touch-friendly interface designed for crisis situations

## 🏗️ Architecture

### Frontend Stack
- **React 18** + **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling and consistent design
- **Leaflet.js** for lightweight, offline-capable mapping
- **Zustand** for state management with persistence
- **Service Worker** for offline functionality and push notifications

### Backend Simulation
- **Mock API Server** (Express.js) for development and testing
- **WebSocket** connection for real-time sensor data
- **RESTful APIs** for user data, sensor readings, and status updates

### PWA Features
- **Web App Manifest** for "Add to Home Screen" functionality
- **Service Worker** for caching and offline access
- **Push API** for emergency notifications
- **Background Sync** for data synchronization when back online

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Mock API Server**
   ```bash
   # In a separate terminal
   node mock-server.js
   ```
   The API server will run on `http://localhost:3001`

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   The PWA will be available at `http://localhost:3000`

4. **Build for Production**
   ```bash
   npm run build
   npm run preview
   ```

### Demo Testing

To test the danger alert functionality:
```bash
# Trigger danger state (in another terminal)
curl -X POST http://localhost:3001/api/v1/test/trigger-danger

# Clear danger state
curl -X POST http://localhost:3001/api/v1/test/clear-danger
```

## 📱 User Flow

### 1. Onboarding (First-Time Users)
1. **Notification Permission**: "To send you life-saving alerts, we MUST be able to send you notifications"
2. **Location Permission**: "To give you personal, street-level warnings, we need your location"
3. **Home Location Setup**: Tap to set primary address for protection

### 2. Safe Dashboard
- **Interactive Map**: Shows user's home pin and nearby sensors
- **Bottom Status Sheet**: Swipe up for detailed system status
- **Real-time Updates**: Live sensor data via WebSocket
- **Connection Status**: Shows online/offline state

### 3. Danger Alert
- **Full-Screen Takeover**: Red-themed emergency interface
- **AI-Generated Warning**: "Floodwater at Mabini St. Bridge is 1.5 meters. Based on its 30m/hr speed, it will reach your Home location in 40 minutes."
- **Evacuation Routes**: Direct integration with Google Maps/Waze
- **Safety Confirmation**: "I Am Safe" button for LGU dashboard updates

## 🎨 Design System

### Color Palette
- **Primary Blue**: `#0057B7` (Trust, reliability)
- **Success Green**: `#16A34A` (Safe status)
- **Danger Red**: `#DC2626` (Emergency alerts)
- **Neutral Grays**: High contrast for readability

### Typography
- **Inter Font**: Optimized for screen readability
- **Hierarchical Scale**: Display (48px) to Label (12px)
- **High Contrast**: WCAG AA compliant

### Components
- **Status Sheet**: Bottom-docked, swipeable interface
- **Sensor Markers**: Color-coded by threat level
- **Alert Takeover**: Full-screen emergency modal
- **Touch Targets**: Minimum 48px for crisis situations

## 🗺️ Data Models

### User
```javascript
{
  user_id: "uuid",
  home_location: { lat: 14.5995, lng: 120.9842 },
  fcm_token: "string",
  is_safe: boolean
}
```

### Sensor
```javascript
{
  sensor_id: "string",
  location: { lat: 14.5995, lng: 120.9842 },
  sensor_type: "water_level" | "wind_speed" | "camera",
  reading_value: float,
  status: "normal" | "warning" | "danger"
}
```

### Threat
```javascript
{
  threat_id: "uuid",
  polygon: [[lat, lng], ...],
  threat_type: "flood" | "storm_surge" | "wind",
  predicted_eta_minutes: integer,
  source_text: "string"
}
```

## 🚨 API Endpoints

### Mock Server Endpoints
```
GET  /api/v1/user           # Get user data
POST /api/v1/user/location   # Update home location
GET  /api/v1/sensors         # Get sensor data
GET  /api/v1/status          # Get current status
POST /api/v1/test/trigger-danger  # Demo: trigger alert
POST /api/v1/test/clear-danger    # Demo: clear alert
WebSocket /ws/live          # Real-time sensor updates
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file for custom configuration:
```env
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_WS_URL=ws://localhost:3001/ws/live
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### PWA Configuration
Update `public/manifest.json` for custom app details:
- App name and description
- Icon paths and sizes
- Shortcut definitions
- Theme colors

## 🛡️ Production Deployment

### Building for Production
```bash
# Optimize for production
npm run build

# Test production build
npm run preview
```

### Service Worker
The service worker automatically:
- Caches static assets for offline access
- Handles push notifications
- Provides fallback for network failures
- Supports background sync

### Security Considerations
- Content Security Policy headers
- HTTPS requirement for PWA features
- Secure WebSocket connections (WSS in production)
- Input validation and sanitization

## 🧪 Testing

### Manual Testing Checklist
- [ ] Onboarding flow completes successfully
- [ ] Location permissions granted
- [ ] Home pin placement works
- [ ] Map displays sensors correctly
- [ ] Status sheet expands/collapses
- [ ] Danger alert triggers full-screen
- [ ] Evacuation route opens external app
- [ ] "I Am Safe" button works
- [ ] Offline functionality works
- [ ] Service worker registration

### Browser Testing
Test on multiple browsers and devices:
- Chrome (Android/iOS)
- Safari (iOS)
- Firefox (Android)
- Samsung Internet

## 📊 Performance

### Optimization Features
- **Code Splitting**: Vendor chunks for better caching
- **Lazy Loading**: Components loaded on demand
- **Service Worker**: Aggressive caching strategy
- **Map Optimization**: Vector tiles and clustering
- **Bundle Analysis**: Vite bundle analyzer integration

### Metrics
- **First Contentful Paint**: < 2s
- **Time to Interactive**: < 3s
- **Service Worker**: Caches in < 500ms
- **WebSocket Reconnection**: < 5s

## 🤝 Contributing

This is a demonstration project showcasing modern PWA development for emergency systems. In a production environment, additional considerations would include:

- Real IoT sensor integration
- Backend API development
- Database design (PostgreSQL + PostGIS)
- AI model deployment
- LGU dashboard interface
- Government compliance requirements

## 📄 License

This project is created for demonstration purposes. For production use, ensure compliance with local emergency services and government regulations.

---

**Built with ❤️ for the Philippines**  
*Saving lives through technology*