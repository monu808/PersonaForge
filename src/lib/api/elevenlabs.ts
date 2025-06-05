import { supabase } from '../auth';

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
export async function generateSpeech(data: ElevenLabsVoiceRequest): Promise<ElevenLabsVoiceResponse> {
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
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    // Convert response to blob and create URL
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

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
 * Get available voices from Eleven Labs (Direct API call for debugging)
 */
export async function getAvailableVoices(): Promise<ElevenLabsVoice[]> {
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

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    return data.voices?.map((voice: any) => ({
      id: voice.voice_id,
      name: voice.name,
      category: voice.category || 'generated',
      description: voice.description,
      previewUrl: voice.preview_url,
    })) || [];
  } catch (error) {
    console.error('Error fetching voices from ElevenLabs:', error);
    // Return some default voices for fallback
    return [
      {
        id: DEFAULT_VOICE_ID,
        name: 'Rachel',
        category: 'premade',
        description: 'A calm and clear voice',
      },
      {
        id: 'AZnzlk1XvdvUeBnXmlld',
        name: 'Domi',
        category: 'premade',
        description: 'A confident and engaging voice',
      },
      {
        id: 'EXAVITQu4vr4xnSDxMaL',
        name: 'Bella',
        category: 'premade',
        description: 'A friendly and warm voice',
      },    ];
  }
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
      .from('persona-content')
      .upload(`audio/${fileName}`, audioBlob, {
        contentType: 'audio/mpeg'
      });

    if (uploadError) {
      throw new Error(`Failed to upload audio: ${uploadError.message}`);
    }    // Get the public URL for the uploaded audio
    const { data: urlData } = supabase.storage
      .from('persona-content')
      .getPublicUrl(`audio/${fileName}`);
    
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

    // Fetch audio content from the database
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

    // Fetch all audio content for the user (including demo audio)
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
    }    // Add audio files
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
