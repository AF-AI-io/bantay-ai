/**
 * Netlify Function: get-status.js
 * Fetches the latest threat status from GitHub repository
 * 
 * Environment Variables Required:
 * - GITHUB_TOKEN: Personal Access Token with repo scopes
 * - GITHUB_OWNER: Repository owner/organization
 * - GITHUB_REPO: Repository name
 * 
 * Returns:
 * {
 *   "threat": {
 *     "is_active": boolean,
 *     "level": "safe" | "warning" | "danger",
 *     "description": string,
 *     "polygon": [
 *       [lat, lng],
 *       [lat, lng]
 *     ],
 *     "timestamp": string,
 *     "sources": string[]
 *   }
 * }
 */

const { Octokit } = require("@octokit/rest");

// Initialize Octokit with the GitHub token
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  try {
    // Get environment variables
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    
    if (!owner || !repo) {
      throw new Error('GITHUB_OWNER and GITHUB_REPO environment variables are required');
    }

    const path = '_data/threats/latest.json';

    // Try to fetch the latest threat file
    let threatData;
    try {
      const response = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      // Decode base64 content
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      threatData = JSON.parse(content);
    } catch (error) {
      if (error.status === 404) {
        // No active threat, return safe status
        threatData = {
          is_active: false,
          level: 'safe',
          description: 'No active threats detected',
          polygon: null,
          timestamp: new Date().toISOString(),
          sources: ['PAGASA'],
        };
      } else {
        throw error;
      }
    }

    // Add computed fields
    const response = {
      threat: {
        ...threatData,
        last_updated: threatData.timestamp,
        hours_active: threatData.is_active ? 
          Math.floor((new Date() - new Date(threatData.timestamp)) / (1000 * 60 * 60)) : 0,
      }
    };

    console.log(`Returning threat status:`, response.threat.level);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(response),
    };

  } catch (error) {
    console.error('Error fetching threat status:', error);
    
    // Return safe status on error to prevent false alarms
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        threat: {
          is_active: false,
          level: 'safe',
          description: 'Status check failed - defaulting to safe',
          timestamp: new Date().toISOString(),
          sources: ['PAGASA'],
        }
      }),
    };
  }
};