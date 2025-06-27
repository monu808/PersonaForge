import { Router } from 'express';
import { Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { validateRequest } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { supabase } from '../config/supabase';

// Extend Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

const router = Router();

// Apply authentication to all routes
router.use(requireAuth);

// Environment variables
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Helper function to make ElevenLabs API requests
async function makeElevenLabsRequest(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${ELEVENLABS_API_URL}${endpoint}`, {
    ...options,
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} - ${error}`);
  }

  return response;
}

// Get all available voices (filtered for current user)
router.get('/voices', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    // Fetch all voices from ElevenLabs API
    const response = await makeElevenLabsRequest('/voices');
    const data = await response.json();
    
    if (!data.voices || !Array.isArray(data.voices)) {
      return res.json({ voices: [] });
    }

    // Get user's voice IDs from database if user is authenticated
    let userVoiceIds: string[] = [];
    if (userId) {
      try {
        const { data: userVoices, error } = await supabase
          .from('user_voices')
          .select('voice_id')
          .eq('user_id', userId);

        if (!error && userVoices) {
          userVoiceIds = userVoices.map(v => v.voice_id);
        }
      } catch (error) {
        console.warn('Error fetching user voices:', error);
      }
    }

    // Define known public voice IDs (ElevenLabs premade voices)
    const publicVoiceIds = [
      '21m00Tcm4TlvDq8ikWAM', // Rachel
      'AZnzlk1XvdvUeBnXmlld', // Domi
      'EXAVITQu4vr4xnSDxMaL', // Bella
      'ErXwobaYiN019PkySvjV', // Antoni
      'MF3mGyEYCl7XYWbV9V6O', // Elli
      'TxGEqnHWrfWFTfGW9XjX', // Josh
    ];

    // Filter voices to only include:
    // 1. Public/premade voices
    // 2. User's own cloned voices
    const filteredVoices = data.voices.filter((voice: any) => {
      const isPublicVoice = voice.category === 'premade' || 
                           voice.sharing?.status === 'public' ||
                           publicVoiceIds.includes(voice.voice_id);
      
      const isUserVoice = userId && userVoiceIds.includes(voice.voice_id);
      
      return isPublicVoice || isUserVoice;
    });

    res.json({ voices: filteredVoices });
  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({ error: 'Failed to fetch voices' });
  }
});

// Get specific voice details
router.get('/voices/:voiceId', 
  [param('voiceId').isString().notEmpty()],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { voiceId } = req.params;
      const response = await makeElevenLabsRequest(`/voices/${voiceId}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching voice:', error);
      res.status(500).json({ error: 'Failed to fetch voice details' });
    }
  }
);

// Text-to-speech conversion
router.post('/text-to-speech/:voiceId',
  [
    param('voiceId').isString().notEmpty(),
    body('text').isString().notEmpty().isLength({ max: 5000 }),
    body('voice_settings').optional().isObject(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { voiceId } = req.params;
      const { text, voice_settings } = req.body;
      const userId = req.user?.id;

      // Check user's subscription/usage limits here if needed
      
      const response = await makeElevenLabsRequest(`/text-to-speech/${voiceId}`, {
        method: 'POST',
        body: JSON.stringify({
          text,
          voice_settings: voice_settings || {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      // Get the audio data
      const audioBuffer = await response.arrayBuffer();

      // Save to Supabase storage
      const fileName = `tts_${Date.now()}_${userId}.mp3`;
      const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(fileName, Buffer.from(audioBuffer), {
          contentType: 'audio/mpeg',
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('audio-files')
        .getPublicUrl(fileName);

      // Save record to database
      const { error: dbError } = await supabase
        .from('persona_content')
        .insert({
          user_id: userId,
          title: `TTS: ${text.substring(0, 50)}...`,
          content: urlData.publicUrl,
          type: 'audio',
          platform: 'elevenlabs',
          metadata: {
            voice_id: voiceId,
            text: text,
            voice_settings: voice_settings,
            file_name: fileName,
          },
        });

      if (dbError) {
        console.error('Error saving to database:', dbError);
      }

      res.json({
        success: true,
        audio_url: urlData.publicUrl,
        file_name: fileName,
      });
    } catch (error) {
      console.error('Error generating speech:', error);
      res.status(500).json({ error: 'Failed to generate speech' });
    }
  }
);

// Clone voice from audio file
router.post('/voices/clone',
  [
    body('name').isString().notEmpty(),
    body('description').optional().isString(),
    body('files').isArray().notEmpty(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => { // FIX: use AuthenticatedRequest
    try {
      const { name, description, files } = req.body;
      const userId = req.user?.id;

      // Check if user has permission to clone voices (premium feature)
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('status, plan_id')
        .eq('user_id', userId)
        .single();

      if (!subscription || subscription.status !== 'active') {
        return res.status(403).json({ error: 'Voice cloning requires an active subscription' });
      }

      // Create form data for the request
      const formData = new FormData();
      formData.append('name', name);
      if (description) formData.append('description', description);
      
      // Add audio files (assuming files are base64 encoded)
      files.forEach((file: any, index: number) => {
        const buffer = Buffer.from(file.data, 'base64');
        const blob = new Blob([buffer], { type: 'audio/mpeg' });
        formData.append('files', blob, file.name || `audio_${index}.mp3`);
      });

      const response = await fetch(`${ELEVENLABS_API_URL}/voices/add`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY!,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Voice cloning failed: ${error}`);
      }

      const data = await response.json();

      // Save the cloned voice info to database
      const { error: dbError } = await supabase
        .from('user_voices')
        .insert({
          user_id: userId,
          voice_id: data.voice_id,
          name: name,
          description: description,
          platform: 'elevenlabs',
          is_cloned: true,
          metadata: data,
        });

      if (dbError) {
        console.error('Error saving voice to database:', dbError);
      }

      res.json(data);
    } catch (error) {
      console.error('Error cloning voice:', error);
      res.status(500).json({ error: 'Failed to clone voice' });
    }
  }
);

// Delete a cloned voice
router.delete('/voices/:voiceId',
  [param('voiceId').isString().notEmpty()],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => { // FIX: use AuthenticatedRequest
    try {
      const { voiceId } = req.params;
      const userId = req.user?.id;

      // Check if user owns this voice
      const { data: voice } = await supabase
        .from('user_voices')
        .select('*')
        .eq('voice_id', voiceId)
        .eq('user_id', userId)
        .single();

      if (!voice) {
        return res.status(404).json({ error: 'Voice not found or not owned by user' });
      }

      // Delete from ElevenLabs
      await makeElevenLabsRequest(`/voices/${voiceId}`, {
        method: 'DELETE',
      });

      // Delete from database
      const { error: dbError } = await supabase
        .from('user_voices')
        .delete()
        .eq('voice_id', voiceId)
        .eq('user_id', userId);

      if (dbError) {
        throw dbError;
      }

      res.json({ success: true, message: 'Voice deleted successfully' });
    } catch (error) {
      console.error('Error deleting voice:', error);
      res.status(500).json({ error: 'Failed to delete voice' });
    }
  }
);

// Get user's custom voices
router.get('/user/voices', async (req: AuthenticatedRequest, res: Response) => { // FIX: use AuthenticatedRequest
  try {
    const userId = req.user?.id;
    
    const { data, error } = await supabase
      .from('user_voices')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching user voices:', error);
    res.status(500).json({ error: 'Failed to fetch user voices' });
  }
});

// Get user's audio history
router.get('/user/audio-history',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => { // FIX: use AuthenticatedRequest
    try {
      const userId = req.user?.id;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const { data, error } = await supabase
        .from('persona_content')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'audio')
        .eq('platform', 'elevenlabs')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      res.json(data || []);
    } catch (error) {
      console.error('Error fetching audio history:', error);
      res.status(500).json({ error: 'Failed to fetch audio history' });
    }
  }
);

// Speech-to-speech conversion (voice conversion)
router.post('/speech-to-speech/:voiceId',
  [
    param('voiceId').isString().notEmpty(),
    body('audio').isString().notEmpty(), // Base64 encoded audio
    body('voice_settings').optional().isObject(),
  ],
  validateRequest,
  async (req: AuthenticatedRequest, res: Response) => { // FIX: use AuthenticatedRequest
    try {
      const { voiceId } = req.params;
      const { audio, voice_settings } = req.body;
      const userId = req.user?.id;

      // Check subscription for premium features
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('status')
        .eq('user_id', userId)
        .single();

      if (!subscription || subscription.status !== 'active') {
        return res.status(403).json({ error: 'Speech-to-speech conversion requires an active subscription' });
      }

      // Prepare the audio file
      const audioBuffer = Buffer.from(audio, 'base64');
      const formData = new FormData();
      formData.append('audio', new Blob([audioBuffer], { type: 'audio/mpeg' }), 'input.mp3');
      
      if (voice_settings) {
        formData.append('voice_settings', JSON.stringify(voice_settings));
      }

      const response = await fetch(`${ELEVENLABS_API_URL}/speech-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY!,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Speech-to-speech conversion failed: ${error}`);
      }

      const outputAudioBuffer = await response.arrayBuffer();
      
      // Save to storage
      const fileName = `sts_${Date.now()}_${userId}.mp3`;
      const { error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(fileName, Buffer.from(outputAudioBuffer), {
          contentType: 'audio/mpeg',
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('audio-files')
        .getPublicUrl(fileName);

      res.json({
        success: true,
        audio_url: urlData.publicUrl,
        file_name: fileName,
      });
    } catch (error) {
      console.error('Error in speech-to-speech conversion:', error);
      res.status(500).json({ error: 'Failed to convert speech' });
    }
  }
);

export default router;
