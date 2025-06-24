import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// Create Supabase client with service role for server-side operations
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET /api/podcasts - Get user podcasts
 */
router.get('/podcasts', async (req: Request, res: Response) => {
  try {
    console.log('[Server] GET /api/podcasts called');
    
    // Get user from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const token = authHeader.substring(7);
    
    // Verify the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[Server] Auth error:', userError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    console.log('[Server] Authenticated user:', user.id);
    
    // Query podcasts for the user with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4 second timeout
    
    try {
      const { data, error } = await supabase
        .from('podcasts')
        .select('id, title, description, audio_url, duration, thumbnail_url, created_at, status')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);
      
      clearTimeout(timeoutId);
      
      if (error) {
        console.error('[Server] Database error:', error);
        return res.status(500).json({ error: 'Database query failed', details: error.message });
      }
      
      console.log('[Server] Successfully fetched podcasts:', data?.length || 0);
      return res.json(data || []);
      
    } catch (dbError) {
      clearTimeout(timeoutId);
      console.error('[Server] Database query timeout or error:', dbError);
      return res.status(500).json({ error: 'Database query timeout or error' });
    }
    
  } catch (error) {
    console.error('[Server] Unexpected error in /api/podcasts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/podcasts - Create a new podcast
 */
router.post('/podcasts', async (req: Request, res: Response) => {
  try {
    console.log('[Server] POST /api/podcasts called');
    
    // Get user from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }
    
    const token = authHeader.substring(7);
    
    // Verify the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('[Server] Auth error:', userError);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    const podcastData = req.body;
    
    const { data, error } = await supabase
      .from('podcasts')
      .insert([{
        ...podcastData,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) {
      console.error('[Server] Error creating podcast:', error);
      return res.status(500).json({ error: 'Failed to create podcast', details: error.message });
    }

    console.log('[Server] Successfully created podcast:', data.id);
    return res.json(data);
    
  } catch (error) {
    console.error('[Server] Unexpected error in POST /api/podcasts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
