import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Supabase configuration missing' }),
      };
    }

    let userId: string;
    let accessToken: string;

    if (event.httpMethod === 'POST') {
      // Handle POST request with body containing user_id and access_token
      if (!event.body) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Request body required' }),
        };
      }

      const body = JSON.parse(event.body);
      userId = body.user_id;
      accessToken = body.access_token;

      if (!userId || !accessToken) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'user_id and access_token are required' }),
        };
      }
    } else {
      // Handle GET request with Authorization header
      const authHeader = event.headers.authorization;
      
      if (!authHeader) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authentication required' }),
        };
      }

      accessToken = authHeader;

      // Verify the user session with Supabase to get user ID
      const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      });

      if (!userResponse.ok) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Invalid authentication' }),
        };
      }

      const userData = await userResponse.json();
      userId = userData.id;
    }

    console.log(`Fetching podcasts for user: ${userId}`);

    // Fetch podcasts with user filter and timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout

    try {
      const response = await fetch(
        `${supabaseUrl}/rest/v1/podcasts?select=id,title,description,audio_url,duration,thumbnail_url,created_at,status&user_id=eq.${userId}&status=eq.completed&order=created_at.desc&limit=10`, 
        {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      console.log(`Supabase response status: ${response.status}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Supabase API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        return {
          statusCode: response.status,
          headers,
          body: JSON.stringify({ 
            success: false,
            error: 'Failed to fetch podcasts',
            details: errorData,
            supabaseStatus: response.status
          }),
        };
      }

      const podcasts = await response.json();
      console.log(`Successfully fetched ${podcasts.length} podcasts`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          data: podcasts
        }),
      };

    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Database fetch error:', fetchError);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          error: 'Database query timeout or error',
          details: (fetchError as Error).message
        }),
      };
    }

  } catch (error) {
    console.error('Podcasts API error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
      }),
    };
  }
};
