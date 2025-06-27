import { supabase } from '../auth';
import { STORAGE_BUCKETS } from '../constants';

// --- Helper Functions ---
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// --- Types ---
export interface ElevenLabsVoiceRequest {
  text: string;
  voiceId?: string;
  model?: string;
  stability?: number;
  similarityBoost?: number;
}

export interface ElevenLabsVoiceResponse {
  audioUrl: string | null;
  status: string;
  error?: string;
}

export interface ElevenLabsVoice {
  id: string;
  name: string;
  category: string;
  description?: string;
  previewUrl?: string;
}

// --- Voice Cloning Types ---
export interface VoiceCloneRequest {
  name: string;
  description?: string;
  files: File[];
  labels?: Record<string, string>;
}

export interface VoiceCloneResponse {
  voice_id: string;
  status: string;
  name: string;
  error?: string;
}

export interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

// --- Conversational AI Types ---
export interface ConversationConfig {
  agent_id?: string;
  voice_id: string;
  conversation_config?: {
    agent: {
      prompt: {
        prompt: string;
      };
      first_message: string;
      language: string;
    };
    tts: {
      voice_id: string;
      model_id: string;
      voice_settings: VoiceSettings;
    };
    stt: {
      model: string;
      language: string;
    };
  };
}

export interface ConversationSession {
  conversation_id: string;
  agent_id: string;
  status: string;
  websocket_url?: string;
}

export interface ConversationMessage {
  message_id: string;
  user_id: string;
  content: string;
  role: 'user' | 'agent';
  timestamp: string;
  audio_url?: string;
}

// --- Constants ---
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Default "Rachel" voice
const DEFAULT_MODEL = "eleven_monolingual_v1";
const DEFAULT_STABILITY = 0.5;
const DEFAULT_SIMILARITY_BOOST = 0.75;

/**
 * Generates speech using Eleven Labs API (Direct API call for debugging)
 */
export async function generateSpeech(data: ElevenLabsVoiceRequest, retries = 2): Promise<ElevenLabsVoiceResponse> {
  try {
    // Get session to check authentication
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) throw new Error('Not authenticated');
    
    // Direct API call to ElevenLabs for testing
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ElevenLabs API key not found');
    }

    const voiceId = data.voiceId || DEFAULT_VOICE_ID;
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: data.text,
        model_id: data.model || DEFAULT_MODEL,
        voice_settings: {
          stability: data.stability || DEFAULT_STABILITY,
          similarity_boost: data.similarityBoost || DEFAULT_SIMILARITY_BOOST,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle rate limiting with retry
      if (response.status === 429 && retries > 0) {
        console.log(`Rate limited, retrying in 3 seconds... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        return generateSpeech(data, retries - 1);
      }
      
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }    // Convert response to blob and create persistent data URL
    const audioBlob = await response.blob();
    
    // Convert blob to base64 data URL for persistence across page refreshes
    const audioUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert audio to data URL'));
        }
      };
      reader.onerror = () => reject(new Error('Error reading audio blob'));
      reader.readAsDataURL(audioBlob);
    });

    return {
      audioUrl,
      status: 'success'
    };
  } catch (error) {
    console.error('Error generating speech with ElevenLabs:', error);
    return {
      audioUrl: null,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Failed to generate speech'
    };
  }
}

/**
 * Fetch available voices from ElevenLabs
 */
export async function getAvailableVoices(): Promise<ElevenLabsVoice[]> {
  try {
    // Get current user session
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      console.error('ElevenLabs API key not found');
      return getDefaultVoices();
    }

    // Fetch all voices from ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('ElevenLabs API error:', response.status, response.statusText);
      return getDefaultVoices();
    }

    const data = await response.json();
    
    if (!data.voices || !Array.isArray(data.voices)) {
      return getDefaultVoices();
    }

    // Get user's voice IDs from database if user is authenticated
    let userVoiceIds: string[] = [];
    if (user) {
      try {
        const { data: userVoices, error } = await supabase
          .from('user_voices')
          .select('voice_id')
          .eq('user_id', user.id);

        if (!error && userVoices) {
          userVoiceIds = userVoices.map(v => v.voice_id);
        }
      } catch (error) {
        console.warn('Error fetching user voices:', error);
      }
    }

    // Filter voices to only include:
    // 1. Premade/public voices (category is 'premade', 'cloned', or 'generated' and owned by ElevenLabs)
    // 2. User's own cloned voices
    const filteredVoices = data.voices.filter((voice: any) => {
      const isPublicVoice = voice.category === 'premade' || 
                           voice.sharing?.status === 'public' ||
                           DEFAULT_PUBLIC_VOICES.some(defaultVoice => defaultVoice.id === voice.voice_id);
      
      const isUserVoice = user && userVoiceIds.includes(voice.voice_id);
      
      return isPublicVoice || isUserVoice;
    });

    return filteredVoices.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      category: voice.category || 'general',
      description: voice.description || '',
      previewUrl: voice.preview_url || null
    }));
    
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error);
    return getDefaultVoices();
  }
}

/**
 * Get default voice options when API is not available
 */
function getDefaultVoices(): ElevenLabsVoice[] {
  return DEFAULT_PUBLIC_VOICES;
}

/**
 * Create a text-to-speech audio file for a persona
 */
export async function createPersonaAudio(request: { 
  personaId: string; 
  text: string;
  voiceId?: string;
}): Promise<{ data: any; error: any }> {
  try {
    // Get session to check authentication
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) throw new Error('Not authenticated');

    // Generate the speech
    const voiceResponse = await generateSpeech({
      text: request.text,
      voiceId: request.voiceId
    });
    
    if (!voiceResponse.audioUrl) {
      throw new Error(voiceResponse.error || 'Failed to generate audio');
    }
    
    // Create a unique UUID for the audio record
    const audioId = crypto.randomUUID();
    
    // Store the audio in Supabase Storage
    const audioBlob = await fetch(voiceResponse.audioUrl).then(r => r.blob());    const fileName = `${audioId}.mp3`;
      const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKETS.AUDIO_FILES)
      .upload(`elevenlabs-tts/${fileName}`, audioBlob, {
        contentType: 'audio/mpeg'
      });

    if (uploadError) {
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }

    // Get the public URL for the uploaded audio
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.AUDIO_FILES)
      .getPublicUrl(`elevenlabs-tts/${fileName}`);
    
    const storageUrl = urlData.publicUrl;
    
    // For demo mode (when personaId is not a valid UUID), only save to storage
    if (request.personaId === 'default-persona' || !isValidUUID(request.personaId)) {
      // Return data without database insertion for demo purposes
      const demoData = {
        id: audioId,
        persona_id: request.personaId,
        content_type: 'audio',
        content: storageUrl,
        metadata: {
          status: 'completed',
          text: request.text,
          audio_url: storageUrl,
          voice_id: request.voiceId,
          created_at: new Date().toISOString()
        }
      };
      return { data: demoData, error: null };
    }
    
    // Create an audio content record in the database for real personas
    const { data: insertData, error: insertError } = await supabase
      .from('persona_content')
      .insert({
        id: audioId,
        persona_id: request.personaId,
        content_type: 'audio',
        content: storageUrl,
        metadata: {
          status: 'completed',
          text: request.text,
          audio_url: storageUrl,
          voice_id: request.voiceId,
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save audio record: ${insertError.message}`);
    }

    return { data: insertData, error: null };
  } catch (error) {
    console.error('Error creating persona audio:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Get audio files associated with a specific persona
 */
export async function getPersonaAudios(personaId: string): Promise<any[]> {
  try {
    // Get session to check authentication
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) throw new Error('Not authenticated');

    // Fetch audio content from the database (user filtering happens server-side)
    const { data, error } = await supabase
      .from('persona_content')
      .select('*')
      .eq('persona_id', personaId)
      .eq('content_type', 'audio')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch audio: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching persona audios:', error);
    return []; // Return empty array on error
  }
}

/**
 * Get all audio files including demo audio (for dashboard display)
 */
export async function getAllUserAudios(): Promise<any[]> {
  try {
    // Get session to check authentication
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) throw new Error('Not authenticated');

    // Fetch all audio content (note: user filtering happens server-side)
    const { data, error } = await supabase
      .from('persona_content')
      .select('*')
      .eq('content_type', 'audio')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch audio: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching all user audios:', error);
    return []; // Return empty array on error
  }
}

// --- Voice Cloning Functions ---

/**
 * Create a custom voice by cloning from audio samples
 */
export async function createVoiceClone(data: VoiceCloneRequest): Promise<VoiceCloneResponse> {
  try {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ElevenLabs API key not found');
    }

    // Create FormData for file upload
    const formData = new FormData();
    formData.append('name', data.name);
    
    if (data.description) {
      formData.append('description', data.description);
    }

    // Add audio files
    data.files.forEach((file) => {
      formData.append('files', file, file.name);
    });

    // Add labels if provided
    if (data.labels) {
      formData.append('labels', JSON.stringify(data.labels));
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.detail?.message || `HTTP error! status: ${response.status}`);
    }

    // Save the cloned voice to user's database
    const saveResult = await saveUserVoice({
      voice_id: responseData.voice_id,
      name: data.name,
      description: data.description,
      is_cloned: true,
      metadata: {
        preview_url: responseData.preview_url,
        created_via: 'voice_clone',
        file_count: data.files.length
      }
    });

    if (!saveResult.success) {
      console.warn('Voice created but failed to save to database:', saveResult.error);
      // Don't fail the entire operation, just log the warning
    }

    return {
      voice_id: responseData.voice_id,
      status: 'created',
      name: data.name,
    };
  } catch (error) {
    console.error('Error creating voice clone:', error);
    return {
      voice_id: '',
      status: 'failed',
      name: data.name,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get details of a specific voice
 */
export async function getVoiceDetails(voiceId: string): Promise<any> {
  try {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ElevenLabs API key not found');
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching voice details:', error);
    throw error;
  }
}

/**
 * Delete a custom voice
 */
export async function deleteVoice(voiceId: string): Promise<boolean> {
  try {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ElevenLabs API key not found');
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting voice:', error);
    return false;
  }
}

/**
 * Edit voice settings
 */
export async function editVoiceSettings(voiceId: string, settings: VoiceSettings): Promise<boolean> {
  try {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ElevenLabs API key not found');
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}/settings/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify(settings),
    });

    return response.ok;
  } catch (error) {
    console.error('Error editing voice settings:', error);
    return false;
  }
}

// --- Conversational AI Functions ---

/**
 * Create a conversational AI agent
 */
export async function createConversationalAgent(config: ConversationConfig): Promise<any> {
  try {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ElevenLabs API key not found');
    }

    // Note: Conversational AI might not be available in all API tiers
    // Check if this endpoint is available with your current plan
    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      if (response.status === 405) {
        throw new Error('Conversational AI feature is not available with your current API plan. Please upgrade to access this feature.');
      }
      const errorData = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating conversational agent:', error);
    throw error;
  }
}

/**
 * Get all conversational agents
 */
export async function getConversationalAgents(): Promise<any[]> {
  try {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ElevenLabs API key not found');
    }

    const response = await fetch('https://api.elevenlabs.io/v1/convai/agents', {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 405) {
        throw new Error('Conversational AI feature is not available with your current API plan.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.agents || [];
  } catch (error) {
    console.error('Error fetching conversational agents:', error);
    return [];
  }
}

/**
 * Start a conversation session
 */
export async function startConversation(agentId: string): Promise<ConversationSession> {
  try {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ElevenLabs API key not found');
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}/conversation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 405) {
        throw new Error('Conversational AI feature is not available with your current API plan.');
      }
      const errorData = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error starting conversation:', error);
    throw error;
  }
}

/**
 * Send a message to the conversation
 */
export async function sendConversationMessage(
  conversationId: string,
  message: string,
  audioFile?: File
): Promise<any> {
  try {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ElevenLabs API key not found');
    }

    const formData = new FormData();
    formData.append('message', message);
    
    if (audioFile) {
      formData.append('audio', audioFile);
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/message`, {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 405) {
        throw new Error('Conversational AI feature is not available with your current API plan.');
      }
      const errorData = await response.text();
      throw new Error(`HTTP error! status: ${response.status} - ${errorData}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending conversation message:', error);
    throw error;
  }
}

/**
 * Get conversation history
 */
export async function getConversationHistory(conversationId: string): Promise<ConversationMessage[]> {
  try {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ElevenLabs API key not found');
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}/messages`, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 405) {
        throw new Error('Conversational AI feature is not available with your current API plan.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.messages || [];
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    return [];
  }
}

/**
 * Delete a conversational agent
 */
export async function deleteConversationalAgent(agentId: string): Promise<boolean> {
  try {
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!apiKey) {
      throw new Error('ElevenLabs API key not found');
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': apiKey,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting conversational agent:', error);
    return false;
  }
}

// --- User Voice Management Functions ---

/**
 * Save a user's voice to the database
 */
export async function saveUserVoice(voice: {
  voice_id: string;
  name: string;
  description?: string;
  is_cloned: boolean;
  metadata?: any;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('user_voices')
      .insert({
        user_id: user.id,
        voice_id: voice.voice_id,
        name: voice.name,
        description: voice.description,
        platform: 'elevenlabs',
        is_cloned: voice.is_cloned,
        metadata: voice.metadata || {}
      });

    if (error) {
      console.error('Error saving user voice:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error saving user voice:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get user's personal voices from database
 */
export async function getUserVoices(): Promise<ElevenLabsVoice[]> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from('user_voices')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', 'elevenlabs')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user voices:', error);
      return [];
    }

    return data?.map(voice => ({
      id: voice.voice_id,
      name: voice.name,
      category: voice.is_cloned ? 'cloned' : 'custom',
      description: voice.description,
      previewUrl: voice.metadata?.preview_url
    })) || [];
  } catch (error) {
    console.error('Error fetching user voices:', error);
    return [];
  }
}

/**
 * Delete a user's voice from both database and ElevenLabs
 */
export async function deleteUserVoice(voiceId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      throw new Error('User not authenticated');
    }

    // First, delete from ElevenLabs API if it's a cloned voice
    const { data: voiceData } = await supabase
      .from('user_voices')
      .select('is_cloned')
      .eq('user_id', user.id)
      .eq('voice_id', voiceId)
      .single();

    if (voiceData?.is_cloned) {
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
      if (apiKey) {
        try {
          await fetch(`https://api.elevenlabs.io/v1/voices/${voiceId}`, {
            method: 'DELETE',
            headers: {
              'xi-api-key': apiKey,
            },
          });
        } catch (error) {
          console.warn('Error deleting voice from ElevenLabs:', error);
          // Continue with database deletion even if API call fails
        }
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('user_voices')
      .delete()
      .eq('user_id', user.id)
      .eq('voice_id', voiceId);

    if (error) {
      console.error('Error deleting user voice:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting user voice:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Default/public voices that all users can see
const DEFAULT_PUBLIC_VOICES: ElevenLabsVoice[] = [
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    category: 'premade',
    description: 'Professional female voice with a clear, articulate tone',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/21m00Tcm4TlvDq8ikWAM/df6788f9-5c96-470d-8312-aab3b3d8f50a.mp3'
  },
  {
    id: 'AZnzlk1XvdvUeBnXmlld',
    name: 'Domi',
    category: 'premade', 
    description: 'Professional male voice with a warm, engaging tone',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/e8b3469c-5d75-4b2e-8c6e-4db9dc3c19ad.mp3'
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Bella',
    category: 'premade',
    description: 'Young female voice with an expressive and confident tone',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/EXAVITQu4vr4xnSDxMaL/532b7b7c-6c8a-4ee0-9ac8-14a20e7d3aa5.mp3'
  },
  {
    id: 'ErXwobaYiN019PkySvjV',
    name: 'Antoni',
    category: 'premade',
    description: 'Deep male voice with an authoritative and calming presence',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/6d1d1774-d052-4d3c-8240-0e87b28b2c0b.mp3'
  },
  {
    id: 'MF3mGyEYCl7XYWbV9V6O',
    name: 'Elli',
    category: 'premade',
    description: 'Young female voice with an emotional and expressive delivery',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/MF3mGyEYCl7XYWbV9V6O/2f50d1e7-9826-4238-b6db-a5fa0e1d1e2e.mp3'
  },
  {
    id: 'TxGEqnHWrfWFTfGW9XjX',
    name: 'Josh',
    category: 'premade',
    description: 'Professional male voice with a clear, engaging tone',
    previewUrl: 'https://storage.googleapis.com/eleven-public-prod/premade/voices/TxGEqnHWrfWFTfGW9XjX/c9f4b2a8-9f41-4c5d-8f1e-8e8e8e8e8e.mp3'
  }
];
