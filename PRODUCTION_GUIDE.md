# Bantay-AI - Production Deployment Guide

## 🏗️ Architecture Overview

This is the production-ready version of Bantay-AI using:
- **Host**: Netlify (Frontend + Serverless Functions)
- **Database**: GitHub Repository (via GitHub API)
- **Data Source**: PAGASA API
- **Monitoring**: Netlify Scheduled Functions

## 🚀 Quick Deployment

### 1. GitHub Setup

1. **Create a GitHub Personal Access Token**:
   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Generate new token with `repo` scope
   - Copy the token (you won't see it again!)

2. **Create a new repository** (or use existing):
   ```bash
   # Initialize repository
   git init
   git add .
   git commit -m "Initial commit: Bantay-AI production setup"
   git remote add origin https://github.com/YOUR_USERNAME/bantay-ai.git
   git push -u origin main
   ```

### 2. Netlify Setup

1. **Connect Repository to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Configure Environment Variables** in Netlify dashboard:
   - Go to Site Settings > Environment Variables
   - Add the following variables:

   ```
   GITHUB_TOKEN=ghp_your_personal_access_token_here
   GITHUB_OWNER=your_github_username_or_org
   GITHUB_REPO=bantay-ai
   PAGASA_API_URL=https://www.panahon.gov.ph/api/v1/aws
   THREAT_THRESHOLD=2.0
   ```

3. **Deploy**: Netlify will automatically build and deploy your site

## 📊 How It Works

### 🧠 24/7 Threat Monitoring
- **Scheduled Function**: Runs every 10 minutes
- **Data Source**: PAGASA Weather API
- **Analysis**: Rule-based AI engine
- **Storage**: GitHub repository (`_data/threats/latest.json`)

### 🔄 Real-time Updates
- **Polling**: App checks for threats every 5 minutes
- **No Push Notifications**: Removed due to Firebase restrictions
- **State Management**: Local storage with server backup

### 💾 Data Storage (GitHub as Database)
```
_data/
├── threats/
│   └── latest.json       # Current threat status
└── users/
    └── USER_ID.json     # User home locations
```

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Test threat monitoring (manual trigger)
curl -X POST https://bantay-ai.netlify.app/.netlify/functions/check-for-threats
```

## 📡 API Endpoints (Netlify Functions)

### Get Threat Status
```
GET /.netlify/functions/get-status
```
Returns current threat level and details.

### Mark User Safe
```
POST /.netlify/functions/mark-safe
Body: { "user_id": "USER_ID" }
```
Updates user's safety status.

### Save User Location
```
POST /.netlify/functions/save-user
Body: { "user_id": "USER_ID", "home_location": {...} }
```
Saves user's home location to GitHub.

### Threat Monitoring (Scheduled)
```
Scheduled: */10 * * * * (every 10 minutes)
```
Automatically checks PAGASA API and updates threat status.

## 🔧 Customization

### Threat Detection Rules
Edit `netlify/functions/check-for-threats.js`:

```javascript
// Modify threshold
const THREAT_THRESHOLD = parseFloat(process.env.THREAT_THRESHOLD) || 2.0;

// Add custom detection logic
if (water_level >= THREAT_THRESHOLD) {
  // Trigger threat
}
```

### Metro Manila Flood Zones
Update `FLOOD_PRONE_AREAS` array in `check-for-threats.js`:

```javascript
const FLOOD_PRONE_AREAS = [
  { 
    name: 'Your Area Name', 
    center: [lat, lng], 
    polygon: [[lat, lng], [lat, lng]] 
  }
];
```

## 📱 Testing

### Manual Threat Trigger
Add to URL: `?forceStatus=danger`
Example: `https://bantay-ai.netlify.app?forceStatus=danger`

### Test User Safe
- Complete onboarding
- Click "I Am Safe" in danger alert

## 🔒 Security

- **No API Keys Exposed**: All external API keys stored as Netlify environment variables
- **CORS Headers**: Configured for API access
- **Rate Limiting**: Built-in with Netlify functions

## 🐛 Troubleshooting

### Functions Not Working
1. Check environment variables in Netlify dashboard
2. Verify GitHub token has `repo` scope
3. Check Netlify function logs

### No Threats Detected
- Check PAGASA API status
- Verify GitHub repository exists
- Monitor function execution logs

### Build Failures
- Ensure Node.js version is 18+
- Check `package.json` dependencies
- Verify `netlify.toml` configuration

## 📈 Monitoring

- **Netlify Functions Logs**: Monitor scheduled function execution
- **GitHub Repository**: Check `_data/` folder for threat/user data
- **Real-time Status**: Built-in threat monitoring every 10 minutes

## 🚨 Emergency Features

- **Offline Mode**: Service worker provides cached data
- **Manual Override**: URL parameters for testing
- **Safe Mode**: Always defaults to safe state on errors
- **User Check-in**: "I Am Safe" functionality during emergencies

---

**Status**: ✅ Production Ready  
**Last Updated**: 2025-11-06  
**Version**: 1.0.0