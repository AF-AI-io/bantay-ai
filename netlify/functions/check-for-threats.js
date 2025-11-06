/**
 * Netlify Function: check-for-threats.js
 * 24/7 scheduled function that monitors PAGASA API and updates threat status
 * Runs every 10 minutes as configured in netlify.toml
 * 
 * Environment Variables Required:
 * - GITHUB_TOKEN: Personal Access Token with repo scopes
 * - GITHUB_OWNER: Repository owner/organization
 * - GITHUB_REPO: Repository name
 * - PAGASA_API_URL: PAGASA API endpoint
 * - THREAT_THRESHOLD: Water level threshold (default: 2.0)
 * 
 * Logic:
 * 1. Fetch data from PAGASA API
 * 2. Analyze water levels and weather conditions
 * 3. Detect threats based on predefined rules
 * 4. Commit threat data to GitHub if threats detected
 */

const { Octokit } = require("@octokit/rest");

// Initialize Octokit with the GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const PAGASA_API_URL = process.env.PAGASA_API_URL || 'https://www.panahon.gov.ph/api/v1/aws';
const THREAT_THRESHOLD = parseFloat(process.env.THREAT_THRESHOLD) || 2.0;

// Metro Manila flood-prone areas coordinates
const FLOOD_PRONE_AREAS = [
  { name: 'Pasig River Basin', center: [14.5700, 121.0000], polygon: [
    [14.55, 120.95], [14.59, 120.95], [14.59, 121.05], [14.55, 121.05]
  ]},
  { name: 'Marikina Valley', center: [14.6500, 121.1000], polygon: [
    [14.63, 121.07], [14.67, 121.07], [14.67, 121.13], [14.63, 121.13]
  ]},
  { name: 'Navotas Coastal', center: [14.6700, 120.9400], polygon: [
    [14.65, 120.92], [14.69, 120.92], [14.69, 120.96], [14.65, 120.96]
  ]},
  { name: 'Parañaque Lowland', center: [14.4800, 121.0000], polygon: [
    [14.46, 120.98], [14.50, 120.98], [14.50, 121.02], [14.46, 121.02]
  ]}
];

// Simulation function for PAGASA data (in production, this would be real API calls)
async function fetchPAGASAData() {
  try {
    console.log(`Fetching PAGASA data from: ${PAGASA_API_URL}`);
    
    // In production, uncomment this to fetch real data:
    /*
    const response = await fetch(PAGASA_API_URL);
    if (!response.ok) {
      throw new Error(`PAGASA API error: ${response.status}`);
    }
    const data = await response.json();
    */
    
    // For demonstration, return simulated data with occasional threats
    const now = new Date();
    const hour = now.getHours();
    
    // Simulate 20% chance of finding a threat during rainy season months
    const isRainySeason = [6, 7, 8, 9, 10, 11].includes(now.getMonth() + 1);
    const shouldSimulateThreat = isRainySeason && Math.random() < 0.2;
    
    const sensors = [
      { id: 1, name: 'Manila Bay Station', lat: 14.5995, lng: 120.9842, water_level: 1.2 + Math.random() * 1.5, rain_intensity: Math.random() * 50 },
      { id: 2, name: 'Pasig River Station', lat: 14.5700, lng: 121.0000, water_level: shouldSimulateThreat ? 2.3 + Math.random() * 0.5 : 0.8 + Math.random() * 1.2, rain_intensity: Math.random() * 80 },
      { id: 3, name: 'Marikina Station', lat: 14.6500, lng: 121.0500, water_level: shouldSimulateThreat ? 2.1 + Math.random() * 0.3 : 0.9 + Math.random() * 1.0, rain_intensity: Math.random() * 90 },
      { id: 4, name: 'Navotas Station', lat: 14.6700, lng: 120.9400, water_level: 1.0 + Math.random() * 1.3, rain_intensity: Math.random() * 60 },
    ];
    
    const weather_data = {
      timestamp: now.toISOString(),
      sensors: sensors,
      alerts: shouldSimulateThreat ? [{
        type: 'flood_warning',
        level: 'yellow',
        message: 'Elevated water levels detected in Pasig River and Marikina Valley'
      }] : []
    };
    
    console.log(`Simulated PAGASA data: ${sensors.length} sensors, ${weather_data.alerts.length} alerts`);
    return weather_data;
    
  } catch (error) {
    console.error('Error fetching PAGASA data:', error);
    
    // Return safe default data on error
    return {
      timestamp: new Date().toISOString(),
      sensors: [],
      alerts: [],
      error: error.message
    };
  }
}

// AI logic to analyze sensor data and determine threat level
function analyzeThreats(sensorData) {
  const threats = [];
  const highRiskSensors = [];
  
  sensorData.sensors.forEach(sensor => {
    const { water_level, rain_intensity, name } = sensor;
    
    // Rule 1: Water level threshold check
    if (water_level >= THREAT_THRESHOLD) {
      threats.push({
        type: 'high_water_level',
        severity: water_level > 3.0 ? 'danger' : 'warning',
        sensor: name,
        value: water_level,
        threshold: THREAT_THRESHOLD,
        description: `${name}: Water level at ${water_level.toFixed(1)}m (threshold: ${THREAT_THRESHOLD}m)`
      });
      highRiskSensors.push(sensor);
    }
    
    // Rule 2: Heavy rain + water level combination
    if (rain_intensity > 60 && water_level > 1.5) {
      threats.push({
        type: 'heavy_rain_water_risk',
        severity: 'warning',
        sensor: name,
        rain_intensity,
        water_level,
        description: `${name}: Heavy rain (${rain_intensity.toFixed(0)}mm/hr) + elevated water (${water_level.toFixed(1)}m)`
      });
    }
    
    // Rule 3: Rising trend detection (simulated)
    if (water_level > 2.0) {
      threats.push({
        type: 'rising_water_trend',
        severity: 'warning',
        sensor: name,
        water_level,
        description: `${name}: Rapidly rising water level detected at ${water_level.toFixed(1)}m`
      });
    }
  });
  
  // Determine overall threat level
  let overallLevel = 'safe';
  let description = 'All monitored areas show normal conditions.';
  
  if (threats.length > 0) {
    const hasDangerThreats = threats.some(t => t.severity === 'danger');
    const hasWarningThreats = threats.some(t => t.severity === 'warning');
    
    if (hasDangerThreats) {
      overallLevel = 'danger';
      description = 'DANGER: Severe flooding detected in multiple areas. Immediate evacuation recommended.';
    } else if (hasWarningThreats) {
      overallLevel = 'warning';
      description = 'WARNING: Elevated flood risk detected. Stay alert and prepare for potential evacuation.';
    }
  }
  
  return {
    level: overallLevel,
    description,
    threats,
    affected_areas: highRiskSensors.map(sensor => {
      // Find which flood-prone area this sensor belongs to
      const area = FLOOD_PRONE_AREAS.find(area => {
        const distance = Math.sqrt(
          Math.pow(area.center[0] - sensor.lat, 2) + 
          Math.pow(area.center[1] - sensor.lng, 2)
        );
        return distance < 0.1; // Within ~11km radius
      });
      
      return area || { name: 'Unknown Area', polygon: null };
    })
  };
}

exports.handler = async (event, context) => {
  try {
    console.log('Starting threat analysis...');
    
    // Get environment variables
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    
    if (!owner || !repo) {
      throw new Error('GITHUB_OWNER and GITHUB_REPO environment variables are required');
    }
    
    // Fetch data from PAGASA API
    const pagasaData = await fetchPAGASAData();
    
    // Analyze threats using AI logic
    const threatAnalysis = analyzeThreats(pagasaData);
    
    // Check if we need to update the threat status
    let shouldUpdateThreat = threatAnalysis.level !== 'safe';
    
    if (shouldUpdateThreat) {
      console.log(`Threat detected: ${threatAnalysis.level}`);
      
      // Prepare threat data
      const threatData = {
        is_active: true,
        level: threatAnalysis.level,
        description: threatAnalysis.description,
        polygon: threatAnalysis.affected_areas.length > 0 ? 
          threatAnalysis.affected_areas.filter(a => a.polygon).map(a => a.polygon).flat() : null,
        timestamp: new Date().toISOString(),
        sources: ['PAGASA', 'Automated Analysis'],
        sensors: pagasaData.sensors,
        threat_details: threatAnalysis.threats,
        confidence_score: Math.min(threatAnalysis.threats.length * 20 + 60, 95), // 60-95%
      };
      
      // Convert to base64 for GitHub API
      const content = Buffer.from(JSON.stringify(threatData, null, 2)).toString('base64');
      const path = '_data/threats/latest.json';
      
      // Check if current threat is less severe than new threat
      let currentThreat = null;
      try {
        const existingFile = await octokit.repos.getContent({
          owner,
          repo,
          path,
        });
        const content = Buffer.from(existingFile.data.content, 'base64').toString('utf-8');
        currentThreat = JSON.parse(content);
        
        // Don't downgrade from danger to warning
        if (currentThreat.level === 'danger' && threatData.level !== 'danger') {
          shouldUpdateThreat = false;
        }
      } catch (error) {
        // No existing threat, safe to proceed
        if (error.status !== 404) {
          throw error;
        }
      }
      
      // Update threat data if needed
      if (shouldUpdateThreat) {
        const response = await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path,
          message: `Update threat status: ${threatData.level.toUpperCase()}`,
          content,
        });
        
        console.log(`Successfully updated threat status: ${threatData.level}`);
        
        return {
          statusCode: 200,
          body: JSON.stringify({
            success: true,
            threat_updated: true,
            level: threatData.level,
            description: threatData.description,
            commit_sha: response.data.commit.sha,
            threat_count: threatAnalysis.threats.length,
          }),
        };
      } else {
        console.log('Threat detected but not updating (already active or downgrade prevented)');
      }
    } else {
      console.log('No threats detected, all areas safe');
      
      // Optionally clear active threat if it exists and no new threats
      const path = '_data/threats/latest.json';
      try {
        const existingFile = await octokit.repos.getContent({
          owner,
          repo,
          path,
        });
        
        // Clear the threat
        const safeData = {
          is_active: false,
          level: 'safe',
          description: 'All clear - threat conditions resolved',
          polygon: null,
          timestamp: new Date().toISOString(),
          sources: ['PAGASA', 'Automated Analysis'],
        };
        
        const content = Buffer.from(JSON.stringify(safeData, null, 2)).toString('base64');
        
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path,
          message: 'Clear threat: All areas safe',
          content,
        });
        
        console.log('Cleared active threat - all areas now safe');
        
      } catch (error) {
        // No active threat to clear, which is fine
        if (error.status !== 404) {
          console.error('Error clearing threat:', error);
        }
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        threat_updated: shouldUpdateThreat,
        level: threatAnalysis.level,
        threats_found: threatAnalysis.threats.length,
        timestamp: new Date().toISOString(),
      }),
    };
    
  } catch (error) {
    console.error('Error in threat analysis:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Threat analysis failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};