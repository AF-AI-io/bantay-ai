/**
 * Netlify Function: save-user.js
 * Saves user home location to GitHub repository
 * 
 * Environment Variables Required:
 * - GITHUB_TOKEN: Personal Access Token with repo scopes
 * - GITHUB_OWNER: Repository owner/organization
 * - GITHUB_REPO: Repository name
 * 
 * Request Body:
 * {
 *   "user_id": "string",
 *   "home_location": {
 *     "lat": number,
 *     "lng": number,
 *     "address": string
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
    // Parse request body
    const { user_id, home_location } = JSON.parse(event.body);
    
    if (!user_id || !home_location) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Missing required fields: user_id and home_location',
        }),
      };
    }

    // Get environment variables
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    
    if (!owner || !repo) {
      throw new Error('GITHUB_OWNER and GITHUB_REPO environment variables are required');
    }

    // Prepare user data
    const userData = {
      user_id,
      home_location,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_safe: false,
    };

    // Convert to base64 for GitHub API
    const content = Buffer.from(JSON.stringify(userData, null, 2)).toString('base64');
    const path = `_data/users/${user_id}.json`;

    // Check if file already exists
    let sha;
    try {
      const existingFile = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });
      sha = existingFile.data.sha;
    } catch (error) {
      // File doesn't exist, which is fine
      if (error.status !== 404) {
        throw error;
      }
    }

    // Create or update the file
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Update user ${user_id} location`,
      content,
      sha, // Include SHA if updating existing file
    });

    console.log(`Successfully saved user ${user_id} to GitHub:`, response.status);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        user_id,
        path,
        commit_sha: response.data.commit.sha,
      }),
    };

  } catch (error) {
    console.error('Error saving user:', error);
    
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Failed to save user location',
        details: error.message,
      }),
    };
  }
};