/**
 * Netlify Function to proxy Ola Maps API calls
 * This keeps API credentials secure on the server side
 */

const https = require('https');

// Cache for OAuth token to avoid repeated requests
let tokenCache = {
  accessToken: null,
  expiresAt: 0
};

/**
 * Get OAuth access token from Ola Maps
 */
async function getAccessToken() {
  // Check if cached token is still valid (with 5 minute buffer)
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 300000) {
    return tokenCache.accessToken;
  }

  const clientId = process.env.OLA_MAPS_CLIENT_ID;
  const clientSecret = process.env.OLA_MAPS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing Ola Maps credentials');
  }

  return new Promise((resolve, reject) => {
    const postData = new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'openid',
      client_id: clientId,
      client_secret: clientSecret,
    }).toString();

    const options = {
      hostname: 'api.olamaps.io',
      port: 443,
      path: '/auth/v1/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (res.statusCode !== 200) {
            reject(new Error(`Token request failed: ${result.error || res.statusMessage}`));
            return;
          }

          // Cache the token
          tokenCache.accessToken = result.access_token;
          tokenCache.expiresAt = Date.now() + (result.expires_in * 1000);

          resolve(result.access_token);
        } catch (error) {
          reject(new Error(`Failed to parse token response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Token request error: ${error.message}`));
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Make authenticated request to Ola Maps API
 */
async function makeOlaMapsRequest(path, method = 'GET', queryParams = {}) {
  const apiKey = process.env.OLA_MAPS_API_KEY;
  const clientId = process.env.OLA_MAPS_CLIENT_ID;
  const clientSecret = process.env.OLA_MAPS_CLIENT_SECRET;

  if (!apiKey && (!clientId || !clientSecret)) {
    throw new Error('Missing Ola Maps API credentials');
  }

  let authHeader;
  if (apiKey) {
    // Use API key method
    authHeader = `Bearer ${apiKey}`;
  } else {
    // Use OAuth token
    const token = await getAccessToken();
    authHeader = `Bearer ${token}`;
  }

  const queryString = new URLSearchParams(queryParams).toString();
  const fullPath = queryString ? `${path}?${queryString}` : path;

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.olamaps.io',
      port: 443,
      path: fullPath,
      method: method,
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            },
            body: JSON.stringify(result),
          });
        } catch (error) {
          resolve({
            statusCode: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({ error: 'Failed to parse API response' }),
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: `Request failed: ${error.message}` }),
      });
    });

    req.end();
  });
}

/**
 * Main handler function
 */
exports.handler = async (event) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  try {
    const { path, method, queryParameters } = event;

    console.log('Function called with:', { path, method, queryParameters });

    // The actual API path is passed as a query parameter
    const apiPath = queryParameters.path;
    const apiMethod = method || 'GET';

    // Validate the requested endpoint
    const allowedEndpoints = [
      '/routing/v1/directions',
      '/routing/v1/distanceMatrix',
    ];

    if (!allowedEndpoints.includes(apiPath)) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ error: 'Invalid endpoint', receivedPath: apiPath, allowedEndpoints }),
      };
    }

    // Remove the 'path' parameter from queryParameters as it's used for routing
    const { path: _, ...apiQueryParams } = queryParameters;

    // Make the request to Ola Maps API
    const response = await makeOlaMapsRequest(apiPath, apiMethod, apiQueryParams);
    return response;

  } catch (error) {
    console.error('Ola Maps proxy error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
    };
  }
};