import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get deployment info from Netlify environment variables
    const deploymentId = process.env.DEPLOY_ID || 'unknown';
    const branch = process.env.BRANCH || 'main';
    const deployUrl = process.env.DEPLOY_URL || 'unknown';
    const siteUrl = process.env.URL || 'unknown';
    const buildId = process.env.BUILD_ID || 'unknown';
    const commitRef = process.env.COMMIT_REF || 'unknown';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: deploymentId,
        branch: branch,
        deployUrl: deployUrl,
        siteUrl: siteUrl,
        buildId: buildId,
        commitRef: commitRef,
        timestamp: new Date().toISOString(),
        status: 'deployed'
      }),
    };

  } catch (error) {
    console.error('Error getting deployment status:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to get deployment status',
        id: 'error'
      }),
    };
  }
};
