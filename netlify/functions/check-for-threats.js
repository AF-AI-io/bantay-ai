/**
 * Netlify Function: check-for-threats.js
 * 24/7 scheduled function that monitors Open-Meteo API and updates threat status
 * Runs every 10 minutes as configured in netlify.toml
 * * Environment Variables Required:
 * - GITHUB_TOKEN: Personal Access Token with repo scopes
 * - GITHUB_OWNER: Repository owner/organization
 * - GITHUB_REPO: Repository name
 * - OPEN_METEO_URL: The URL for the Open-Meteo API
 * - THREAT_THRESHOLD: Precipitation threshold (e.g., 2.0 mm)
 */

const { Octokit } = require("@octokit/rest");

// Initialize Octokit with the GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Get API URL and Threshold from Netlify env
const API_URL = process.env.OPEN_METEO_URL || 'https://api.open-meteo.com/v1/forecast?latitude=14.60&longitude=120.98&hourly=precipitation';
const THREAT_THRESHOLD = parseFloat(process.env.THREAT_THRESHOLD) || 2.0;

// Simple Metro Manila polygon (for demo)
const METRO_MANILA_POLYGON = [
  [14.75, 120.90],
  [14.75, 121.15],
  [14.40, 121.15],
  [14.40, 120.90],
  [14.75, 120.90] // Close the loop
];

// Fetch data from Open-Meteo
async function fetchWeatherData() {
  try {
    console.log(`Fetching weather data from: ${API_URL}`);
    
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    const data = await response.json();
    
    // Get the most recent hourly precipitation
    const recentPrecipitation = data?.hourly?.precipitation?.[0] || 0;
    console.log(`Fetched data. Most recent precipitation: ${recentPrecipitation}mm`);
    return {
      precipitation: recentPrecipitation,
      timestamp: data?.hourly?.time?.[0] || new Date().toISOString()
    };
    
  } catch (error) {
    console.error('Error fetching weather data:', error);
    return { precipitation: 0, timestamp: new Date().toISOString(), error: error.message };
  }
}

// "AI" logic to analyze data
function analyzeThreats(weatherData) {
  const { precipitation } = weatherData;
  let level = 'safe';
  let description = 'All monitored areas show normal conditions.';

  // Rule 1: Precipitation threshold check
  if (precipitation >= THREAT_THRESHOLD) {
    level = 'danger';
    description = `DANGER: Heavy precipitation detected (${precipitation}mm). Risk of localized flooding.`;
  } else if (precipitation > (THREAT_THRESHOLD / 2)) {
    level = 'warning';
    description = `WARNING: Moderate precipitation detected (${precipitation}mm). Monitor conditions.`;
  }
  
  return { level, description, precipitation };
}

exports.handler = async (event, context) => {
  try {
    console.log('Starting threat analysis...');
    
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    
    if (!owner || !repo) {
      throw new Error('GITHUB_OWNER and GITHUB_REPO environment variables are required');
    }
    
    const weatherData = await fetchWeatherData();
    const threatAnalysis = analyzeThreats(weatherData);
    
    const path = '_data/threats/latest.json';
    let currentSha = undefined;

    // Get the current threat file to see if we need to update it
    let currentThreatLevel = 'safe';
    try {
      const existingFile = await octokit.repos.getContent({ owner, repo, path });
      currentSha = existingFile.data.sha;
      const content = Buffer.from(existingFile.data.content, 'base64').toString('utf-8');
      currentThreatLevel = JSON.parse(content).level || 'safe';
    } catch (error) {
      if (error.status !== 404) throw error; // 404 is fine, means file doesn't exist
      console.log('No existing threat file found. Will create one.');
    }

    // Only update if the status has changed
    if (threatAnalysis.level === currentThreatLevel) {
      console.log(`No change in status. Current level: ${currentThreatLevel}. Skipping update.`);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, threat_updated: false, level: currentThreatLevel }),
      };
    }

    console.log(`Status changed from ${currentThreatLevel} to ${threatAnalysis.level}. Updating GitHub...`);

    // Prepare new threat data
    const threatData = {
      is_active: threatAnalysis.level !== 'safe',
      level: threatAnalysis.level,
      description: threatAnalysis.description,
      polygon: threatAnalysis.level !== 'safe' ? METRO_MANILA_POLYGON : null,
      timestamp: new Date().toISOString(),
      sources: ['Open-Meteo'],
      precipitation: weatherData.precipitation,
    };
    
    const content = Buffer.from(JSON.stringify(threatData, null, 2)).toString('base64');
    
    // Update the file in GitHub
    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Update threat status: ${threatData.level.toUpperCase()}`,
      content,
      sha: currentSha, // Include sha if updating
    });
    
    console.log(`Successfully updated threat status to: ${threatData.level}`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, threat_updated: true, level: threatData.level }),
    };
    
  } catch (error) {
    console.error('Error in threat analysis:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Threat analysis failed', details: error.message }),
    };
  }
};