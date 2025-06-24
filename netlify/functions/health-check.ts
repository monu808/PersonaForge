import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

interface StatusCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  details?: string;
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // For POST requests, check if a specific service is requested
    let requestedService = null;
    if (event.httpMethod === 'POST' && event.body) {
      try {
        const body = JSON.parse(event.body);
        requestedService = body.service;
      } catch (e) {
        // Invalid JSON, continue with all checks
      }
    }    const allChecks: StatusCheck[] = [
      {
        service: 'Gemini API',
        status: process.env.GOOGLE_GEMINI_API_KEY ? 'healthy' : 'unhealthy',
        details: process.env.GOOGLE_GEMINI_API_KEY ? 'API key configured' : 'API key missing',
      },
      {
        service: 'Supabase',
        status: process.env.VITE_SUPABASE_URL ? 'healthy' : 'unhealthy',
        details: process.env.VITE_SUPABASE_URL ? 'URL configured' : 'URL missing',
      },
      {
        service: 'ElevenLabs API',
        status: process.env.ELEVENLABS_API_KEY ? 'healthy' : 'unhealthy',
        details: process.env.ELEVENLABS_API_KEY ? 'API key configured' : 'API key missing',
      },
    ];

    // Filter checks if a specific service is requested
    const checks = requestedService 
      ? allChecks.filter(check => check.service.toLowerCase().includes(requestedService.toLowerCase()))
      : allChecks;

    // If specific service requested and found, return simplified response
    if (requestedService && checks.length > 0) {
      const serviceCheck = checks[0];
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: serviceCheck.status === 'healthy',
          message: serviceCheck.details,
          service: serviceCheck.service,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    const overallStatus = checks.every(check => check.status === 'healthy') ? 'healthy' : 'degraded';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services: checks,
        environment: process.env.NODE_ENV || 'development',
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
