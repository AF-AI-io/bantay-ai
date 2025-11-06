/**
 * Netlify Function: mark-safe.js
 * Updates user safety status in GitHub repository
 * 
 * Environment Variables Required:
 * - GITHUB_TOKEN: Personal Access Token with repo scopes
 * - GITHUB_OWNER: Repository owner/organization
 * - GITHUB_REPO: Repository name
 * 
 * Request Body:
 * {
 *   "user_id": "string"
 * }
 * 
 * Returns:
 * {
 *   "success": boolean,
 *   "user_id": "string",
 *   "is_safe": boolean,
 *   "timestamp": string
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
    const { user_id } = JSON.parse(event.body);
    
    if (!user_id) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: 'Missing required field: user_id',
        }),
      };
    }

    // Get environment variables
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    
    if (!owner || !repo) {
      throw new Error('GITHUB_OWNER and GITHUB_REPO environment variables are required');
    }

    const path = `_data/users/${user_id}.json`;

    // Get the current user file
    let userData;
    let sha;
    try {
      const response = await octokit.repos.getContent({
        owner,
        repo,
        path,
      });

      // Decode base64 content
      const content = Buffer.from(response.data.content, 'base64').toString('utf-8');
      userData = JSON.parse(content);
      sha = response.data.sha;
    } catch (error) {
      if (error.status === 404) {
        // User doesn't exist, create them with safe status
        userData = {
          user_id,
          home_location: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_safe: true,
        };
      } else {
        throw error;
      }
    }

    // Update the user data
    userData.is_safe = true;
    userData.updated_at = new Date().toISOString();
    userData.last_safe_report = new Date().toISOString();

    // Convert to base64 for GitHub API
    const content = Buffer.from(JSON.stringify(userData, null, 2)).toString('base64');

    // Create or update the file
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: `Mark user ${user_id} as safe`,
      content,
      sha, // Include SHA if updating existing file
    });

    console.log(`Successfully marked user ${user_id} as safe`);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        user_id,
        is_safe: true,
        timestamp: userData.updated_at,
        commit_sha: response.data.commit.sha,
      }),
    };

  } catch (error) {
    console.error('Error marking user as safe:', error);
    
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Failed to mark user as safe',
        details: error.message,
      }),
    };
  }
};