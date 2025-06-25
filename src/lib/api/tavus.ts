import { supabase } from '../auth';
import { STORAGE_BUCKETS } from '../constants';

// --- Replica Types ---
export interface TavusReplicaRequest {
  train_video_url: string;
  replica_name?: string;
  callback_url?: string;
}

export interface TavusReplicaResponse {
  replica_id: string | null;
  status: string;
  message?: string;
  error?: string;
}

// --- Video Types ---
export interface TavusVideoRequest {
  personaId: string; // This likely maps to replica_id in Tavus
  script?: string;
  audio_url?: string;
}

export interface TavusVideoResponse {
  id: string | null;
  status: string;
  url?: string;
  thumbnail_url?: string;
  error?: string;
}

export interface PersonaVideo {
  id: string;
  persona_id: string;
  content_type: string;
  content: string;
  metadata: {
    tavus_video_id: string;
    status: string;
    video_url?: string;
    thumbnail_url?: string;
    duration?: number;
    script?: string;
    error?: string;
  };
  created_at: string;
}

// --- Persona Types ---
export interface TavusPersonaRequest {
  persona_name: string;
  replica_id?: string;
  personality_layers?: {
    llm?: {
      model?: string;
      system_prompt?: string;
      context?: string;
    };
    tts?: {
      voice_id?: string;
      voice_settings?: {
        speed?: string;
        emotion?: string[];
      };
    };
    stt?: {
      participant_pause_sensitivity?: string;
    };
    perception?: {
      enable_vision?: boolean;
    };
  };
}

export interface TavusPersonaResponse {
  persona_id: string | null;
  status: string;
  message?: string;
  error?: string;
}

// --- Conversation Types ---
export interface TavusConversationRequest {
  replica_id: string; // Changed from persona_id to replica_id
  conversation_name?: string;
  callback_url?: string;
  properties?: {
    participant_left_timeout?: number;
    participant_absent_timeout?: number;
    enable_recording?: boolean;
    // Note: max_duration is not currently supported by Tavus API
    // max_duration?: number;
  };
}

export interface TavusConversationResponse {
  conversation_id: string | null;
  conversation_url?: string | null;
  status: string;
  message?: string;
  error?: string;
}

// --- API Functions ---

/**
 * Creates a new Tavus Replica.
 */
export async function createTavusReplica(data: TavusReplicaRequest): Promise<TavusReplicaResponse> {
  try {
    const tavusApiKey = import.meta.env.VITE_TAVUS_API_KEY;
    
    if (!tavusApiKey) {
      throw new Error('TAVUS_API_KEY not configured');
    }

    const response = await fetch('https://tavusapi.com/v2/replicas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey,
      },
      body: JSON.stringify({
        train_video_url: data.train_video_url,
        replica_name: data.replica_name,
        callback_url: data.callback_url,
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
    }

    return {
      replica_id: responseData.replica_id,
      status: responseData.status || 'training',
      message: responseData.message,
    };
  } catch (error) {
    console.error('Error creating Tavus replica:', error);
    return { 
      replica_id: null, 
      status: 'failed', 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Fetches videos associated with a specific persona.
 */
export async function getPersonaVideos(personaId: string): Promise<PersonaVideo[]> {
  try {
    console.log('DEBUG: Fetching videos for persona:', personaId);
    
    const { data, error } = await supabase
      .from('persona_content')
      .select('*')
      .eq('persona_id', personaId)
      .eq('content_type', 'video')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('DEBUG: Database error fetching videos:', error);
      throw new Error(error.message);
    }

    console.log('DEBUG: Raw database response:', data);
    console.log('DEBUG: Number of videos found:', data?.length || 0);
    
    return data || [];
  } catch (error) {
    console.error('Error fetching persona videos:', error);
    throw error; // Re-throw to be handled by the caller
  }
}

/**
 * Generates a Tavus video using either a script or an audio URL.
 */
export async function generateTavusVideo(data: TavusVideoRequest): Promise<TavusVideoResponse> {
  try {
    // Validate input: must have personaId and either script or audio_url
    if (!data.personaId || (!data.script && !data.audio_url)) {
      throw new Error('Missing required parameters: personaId and either script or audio_url');
    }
    if (data.script && data.audio_url) {
        throw new Error('Provide either script or audio_url, not both.');
    }

    const tavusApiKey = import.meta.env.VITE_TAVUS_API_KEY;
    
    if (!tavusApiKey) {
      throw new Error('TAVUS_API_KEY not configured');
    }

    const requestBody: any = {
      replica_id: data.personaId,
    };

    if (data.script) {
      requestBody.script = data.script;
    } else if (data.audio_url) {
      requestBody.audio_url = data.audio_url;
    }

    const response = await fetch('https://tavusapi.com/v2/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
    }

    return {
      id: responseData.video_id,
      status: responseData.status || 'generating',
      url: responseData.download_url,
      thumbnail_url: responseData.thumbnail_url,
    };
  } catch (error) {
    console.error('Error generating Tavus video:', error);
    return { 
      id: null, 
      status: 'failed', 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Checks the status of a Tavus replica.
 */
export async function checkTavusReplicaStatus(replicaId: string): Promise<{ replica_id: string; status: string; training_progress?: number; error?: string }> {
  try {
    const tavusApiKey = import.meta.env.VITE_TAVUS_API_KEY;
    
    if (!tavusApiKey) {
      throw new Error('TAVUS_API_KEY not configured');
    }

    const response = await fetch(`https://tavusapi.com/v2/replicas/${replicaId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey,
      },
    });

    // Check if response is not OK first
    if (!response.ok) {
      const errorMessage = `HTTP error! status: ${response.status}`;
      console.error(`Tavus API error for replica ${replicaId}:`, errorMessage);
      
      return { 
        replica_id: replicaId, 
        status: 'error', 
        error: errorMessage
      };
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`Tavus API returned non-JSON response for replica ${replicaId}:`, contentType);
      
      return { 
        replica_id: replicaId, 
        status: 'error', 
        error: 'Invalid response format from Tavus API'
      };
    }

    const responseData = await response.json();

    return {
      replica_id: replicaId,
      status: responseData.status || 'unknown',
      training_progress: responseData.training_progress,
      error: responseData.error,
    };
  } catch (error) {
    console.error('Error checking Tavus replica status:', error);
    return { 
      replica_id: replicaId, 
      status: 'unknown', 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Checks the status of a Tavus video generation process.
 */
export async function checkTavusVideoStatus(videoId: string): Promise<TavusVideoResponse> {
  try {
    const tavusApiKey = import.meta.env.VITE_TAVUS_API_KEY;
    
    if (!tavusApiKey) {
      throw new Error('TAVUS_API_KEY not configured');
    }

    const response = await fetch(`https://tavusapi.com/v2/videos/${videoId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey,
      },
    });

    // Check if response is not OK first
    if (!response.ok) {
      const errorMessage = `HTTP error! status: ${response.status}`;
      console.error(`Tavus API error for video ${videoId}:`, errorMessage);
      
      return { 
        id: videoId, 
        status: 'error', 
        error: errorMessage
      };
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error(`Tavus API returned non-JSON response for video ${videoId}:`, contentType);
      
      return { 
        id: videoId, 
        status: 'error', 
        error: 'Invalid response format from Tavus API'
      };
    }    const responseData = await response.json();
    
    console.log('DEBUG: Tavus video API response:', {
      videoId,
      responseData,
      status: responseData.status,
      download_url: responseData.download_url,
      hosted_url: responseData.hosted_url
    });

    return {
      id: responseData.video_id || videoId,
      status: responseData.status || 'unknown',
      url: responseData.download_url || responseData.hosted_url,
      thumbnail_url: responseData.thumbnail_url,
    };
  } catch (error) {
    console.error('Error checking Tavus video status:', error);
    return { 
      id: videoId, 
      status: 'unknown', 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Create a video for a persona using Tavus API
 */
export async function createPersonaVideo(request: { 
  personaId: string; 
  script?: string; 
  audioFile?: File;
  audioUrl?: string;
}) {
  try {
    // Get session to check authentication
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    if (!user) throw new Error('Not authenticated');

    // Validate that at least one content source is provided
    if (!request.script && !request.audioFile && !request.audioUrl) {
      throw new Error('Must provide either script, audio file, or audio URL');
    }

    // Get the persona to extract the replica ID
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', request.personaId)
      .eq('user_id', user.id)
      .single();

    if (personaError || !persona) {
      throw new Error('Persona not found or access denied');
    }    // Extract the Tavus replica ID from the persona attributes
    const replicaId = persona.attributes?.default_replica_id;
    if (!replicaId) {
      throw new Error('No Tavus replica ID found for this persona. Please create a replica first.');
    }    // Check replica status before attempting to create video
    const replicaStatus = await checkTavusReplicaStatus(replicaId);
    
    // Add debugging log to help identify the issue
    console.log('DEBUG: Replica status check result:', {
      replicaId,
      status: replicaStatus.status,
      training_progress: replicaStatus.training_progress,
      error: replicaStatus.error
    });
    
    if (replicaStatus.status === 'error') {
      throw new Error(`Replica ${replicaId} is in an error state and cannot be used. Please create a new replica. Error: ${replicaStatus.error || 'Unknown error'}`);
    }
    
    if (replicaStatus.status === 'training') {
      throw new Error(`Replica ${replicaId} is still training (${replicaStatus.training_progress || 0}% complete). Please wait for training to complete before generating videos.`);
    }
      // Accept both 'ready' and 'completed' as valid statuses for video generation
    // Also temporarily accept any status that's not an error or training state
    console.log('DEBUG: Checking if status is ready or completed:', {
      status: replicaStatus.status,
      isReady: replicaStatus.status === 'ready',
      isCompleted: replicaStatus.status === 'completed',
      isValidForGeneration: replicaStatus.status === 'ready' || replicaStatus.status === 'completed'
    });
    
    // Allow ready, completed, and any status that suggests the replica is available
    const validStatuses = ['ready', 'completed', 'active', 'available'];
    if (!validStatuses.includes(replicaStatus.status) && replicaStatus.status !== 'training' && replicaStatus.status !== 'error') {
      console.warn(`Unknown replica status: ${replicaStatus.status}. Proceeding with video generation...`);
    }
    
    // Only block if explicitly in error or training state
    if (replicaStatus.status === 'error' || replicaStatus.status === 'training') {
      throw new Error(`Replica ${replicaId} is not ready for video generation. Current status: ${replicaStatus.status}`);
    }

    let audioUrl = request.audioUrl;
    
    // If audio file is provided, upload it to storage first
    if (request.audioFile && !audioUrl) {
      const fileName = `${crypto.randomUUID()}.${request.audioFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.AUDIO_FILES)
        .upload(`video-generation/${fileName}`, request.audioFile, {
          contentType: request.audioFile.type
        });

      if (uploadError) {
        throw new Error(`Failed to upload audio file: ${uploadError.message}`);
      }

      // Get the public URL for the uploaded audio
      const { data: urlData } = supabase.storage
        .from(STORAGE_BUCKETS.AUDIO_FILES)
        .getPublicUrl(`video-generation/${fileName}`);
      
      audioUrl = urlData.publicUrl;
    }

    // Call Tavus API directly
    const tavusApiKey = import.meta.env.VITE_TAVUS_API_KEY;
    
    if (!tavusApiKey) {
      throw new Error('TAVUS_API_KEY not configured');
    }    const requestBody: any = {
      replica_id: replicaId,
    };

    if (request.script) {
      requestBody.script = request.script;
    } else if (audioUrl) {
      requestBody.audio_url = audioUrl;
    }

    const response = await fetch('https://tavusapi.com/v2/videos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey,
      },
      body: JSON.stringify(requestBody),
    });    const responseData = await response.json();

    if (!response.ok) {
      // Provide specific error messages for common issues
      if (response.status === 402) {
        throw new Error('Insufficient Tavus credits. Please add credits to your Tavus account or upgrade your plan to generate videos.');
      } else if (response.status === 401) {
        throw new Error('Invalid Tavus API key. Please check your API key configuration.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment before trying again.');
      } else {
        throw new Error(responseData.error || `Tavus API error (${response.status}): ${response.statusText}`);
      }    }    console.log('DEBUG: Tavus API response:', {
      video_id: responseData.video_id,
      status: responseData.status,
      download_url: responseData.download_url
    });    // Store the video metadata in the database - this is critical for the video to appear in the UI
    const { data: dbData, error: dbError } = await supabase
      .from('persona_content')
      .insert({
        persona_id: request.personaId,
        content_type: 'video',
        content: request.script || 'Audio-based video',
        metadata: {
          tavus_video_id: responseData.video_id,
          status: responseData.status || 'generating',
          video_url: responseData.download_url,
          thumbnail_url: responseData.thumbnail_url,
          script: request.script,
          audio_url: audioUrl,
        }
      })
      .select()
      .single();

    if (dbError) {
      console.error('CRITICAL: Failed to store video metadata in database:', dbError);
      // This is critical - if we can't store the video in the database, it won't appear in the UI
      throw new Error(`Failed to save video to database: ${dbError.message}. The video was created in Tavus but cannot be displayed. Please use the recovery feature.`);
    }

    console.log('DEBUG: Successfully stored video in database:', {
      database_id: dbData?.id,
      tavus_video_id: responseData.video_id
    });

    return { 
      data: {
        id: dbData.id, // Return the database ID, not the Tavus video ID
        tavus_video_id: responseData.video_id,
        status: responseData.status || 'generating',
        url: responseData.download_url,
        thumbnail_url: responseData.thumbnail_url,
        database_record: dbData,
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error creating persona video:', error);
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Creates a new Tavus Persona with personality layers.
 */
export async function createTavusPersona(data: TavusPersonaRequest): Promise<TavusPersonaResponse> {
  try {
    const tavusApiKey = import.meta.env.VITE_TAVUS_API_KEY;
    
    if (!tavusApiKey) {
      throw new Error('TAVUS_API_KEY not configured');
    }

    const requestBody: any = {
      persona_name: data.persona_name
    };

    // Add replica_id if provided
    if (data.replica_id) {
      requestBody.replica_id = data.replica_id;
    }

    // Add personality layers if provided
    if (data.personality_layers) {
      requestBody.personality_layers = data.personality_layers;
    }

    const response = await fetch('https://tavusapi.com/v2/personas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey,
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
    }

    return {
      persona_id: responseData.persona_id,
      status: responseData.status || 'ready',
      message: responseData.message,
    };
  } catch (error) {
    console.error('Error creating Tavus persona:', error);
    return { 
      persona_id: null, 
      status: 'failed', 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Creates a new Tavus Conversation for real-time video calls.
 */
export async function createTavusConversation(data: TavusConversationRequest): Promise<TavusConversationResponse> {
  try {
    const tavusApiKey = import.meta.env.VITE_TAVUS_API_KEY;
    
    if (!tavusApiKey) {
      throw new Error('TAVUS_API_KEY not configured');
    }    const requestBody: any = {
      replica_id: data.replica_id
    };

    // Debug logging for API request
    console.log('DEBUG: Tavus Conversations API request body:', requestBody);

    // Add optional fields
    if (data.conversation_name) {
      requestBody.conversation_name = data.conversation_name;
    }
    if (data.callback_url) {
      requestBody.callback_url = data.callback_url;
    }
    if (data.properties) {
      requestBody.properties = data.properties;
    }

    const response = await fetch('https://tavusapi.com/v2/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey,
      },
      body: JSON.stringify(requestBody),
    });    const responseData = await response.json();

    if (!response.ok) {
      // Provide specific error messages for common issues
      if (response.status === 400) {
        const errorDetails = responseData.error || JSON.stringify(responseData);
        throw new Error(`Bad Request: ${errorDetails}. Please check your conversation parameters.`);
      } else if (response.status === 402) {
        throw new Error('Insufficient Tavus credits. Please add credits to your Tavus account or upgrade your plan.');
      } else if (response.status === 401) {
        throw new Error('Invalid Tavus API key. Please check your API key configuration.');
      } else {
        throw new Error(responseData.error || `Tavus API error (${response.status}): ${response.statusText}`);
      }
    }

    return {
      conversation_id: responseData.conversation_id,
      conversation_url: responseData.conversation_url,
      status: responseData.status || 'ready',
      message: responseData.message,
    };
  } catch (error) {
    console.error('Error creating Tavus conversation:', error);
    return { 
      conversation_id: null, 
      conversation_url: null,
      status: 'failed', 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Ends a Tavus conversation
 */
export async function endTavusConversation(conversationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const tavusApiKey = import.meta.env.VITE_TAVUS_API_KEY;
    
    if (!tavusApiKey) {
      throw new Error('TAVUS_API_KEY not configured');
    }

    const response = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey,
      },
    });

    if (!response.ok) {
      const responseData = await response.json();
      throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error ending Tavus conversation:', error);
    return { 
      success: false,
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Lists active Tavus conversations
 */
export async function listTavusConversations(): Promise<{ conversations: any[]; error?: string }> {
  try {
    const tavusApiKey = import.meta.env.VITE_TAVUS_API_KEY;
    
    if (!tavusApiKey) {
      throw new Error('TAVUS_API_KEY not configured');
    }

    const response = await fetch('https://tavusapi.com/v2/conversations', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey,
      },
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
    }

    return {
      conversations: responseData.conversations || responseData || [],
    };
  } catch (error) {
    console.error('Error listing Tavus conversations:', error);
    return { 
      conversations: [],
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Deletes/ends a specific conversation.
 */
export async function deleteTavusConversation(conversationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const tavusApiKey = import.meta.env.VITE_TAVUS_API_KEY;
    
    if (!tavusApiKey) {
      throw new Error('TAVUS_API_KEY not configured');
    }

    const response = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey,
      },
    });

    if (!response.ok) {
      const responseData = await response.json();
      throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting Tavus conversation:', error);
    return { 
      success: false,
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Recovery function to sync a Tavus video back to the database
 * Use this when a video was generated in Tavus but the database insertion failed
 */
export async function syncTavusVideoToDatabase(
  tavusVideoId: string, 
  personaId: string, 
  script?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get session to check authentication
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }    // Check if video already exists in database (check by tavus_video_id in metadata)
    const { data: existingVideo } = await supabase
      .from('persona_content')
      .select('id')
      .eq('persona_id', personaId)
      .eq('content_type', 'video')
      .eq('metadata->>tavus_video_id', tavusVideoId)
      .single();

    if (existingVideo) {
      console.log('DEBUG: Video already exists in database, skipping recovery');
      return { success: true, error: 'Video already exists in database' };
    }

    // Fetch video status from Tavus
    const videoStatus = await checkTavusVideoStatus(tavusVideoId);
    
    if (!videoStatus) {
      return { success: false, error: 'Could not fetch video status from Tavus' };
    }    // Insert video metadata into database
    const { error: insertError } = await supabase
      .from('persona_content')
      .insert({
        persona_id: personaId,
        content_type: 'video',
        content: script || 'Recovered video',        metadata: {
          status: videoStatus.status,
          tavus_video_id: tavusVideoId,
          video_url: videoStatus.url,
          thumbnail_url: videoStatus.thumbnail_url,
          script: script || '',
          recovered: true, // Mark as recovered
          created_at: new Date().toISOString()
        }
      });

    if (insertError) {
      console.error('Error inserting video metadata:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log('Successfully synced Tavus video to database:', tavusVideoId);
    return { success: true };

  } catch (error) {
    console.error('Error syncing Tavus video to database:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Update video status in the database
 */
export async function updateVideoStatus(videoId: string, statusData: {
  status: string;
  video_url?: string;
  thumbnail_url?: string;
  error?: string;
}) {
  try {
    const { error } = await supabase
      .from('persona_content')
      .update({
        metadata: {
          ...statusData,
          tavus_video_id: videoId,
          updated_at: new Date().toISOString()
        }
      })
      .eq('metadata->>tavus_video_id', videoId);

    if (error) {
      console.error('Failed to update video status in database:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating video status:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Debug function to check if video exists in database
 */
export async function debugCheckVideoInDatabase(personaId: string, tavusVideoId: string) {
  try {
    const { data, error } = await supabase
      .from('persona_content')
      .select('*')
      .eq('persona_id', personaId)
      .eq('content_type', 'video')
      .eq('metadata->>tavus_video_id', tavusVideoId)
      .single();
    
    console.log('DEBUG: Video in database check:', {
      personaId,
      tavusVideoId,
      found: !!data,
      error: error?.message,
      data
    });
    
    return { found: !!data, data, error };
  } catch (error) {
    console.error('DEBUG: Error checking video in database:', error);
    return { found: false, data: null, error };
  }
}

/**
 * Debug: List all videos in database for troubleshooting
 */
export async function debugListAllVideos() {
  try {
    const { data, error } = await supabase
      .from('persona_content')
      .select('*')
      .eq('content_type', 'video')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('DEBUG: Error fetching all videos:', error);
      return;
    }
    
    console.log('DEBUG: All videos in database:');
    data?.forEach((video, index) => {
      console.log(`  ${index + 1}. ID: ${video.id}`);
      console.log(`     Persona: ${video.persona_id}`);
      console.log(`     Tavus ID: ${video.metadata?.tavus_video_id}`);
      console.log(`     Status: ${video.metadata?.status}`);
      console.log(`     Created: ${video.created_at}`);
      console.log('---');
    });
    
    return data;
  } catch (error) {
    console.error('DEBUG: Error in debugListAllVideos:', error);
  }
}

/**
 * Delete a video from Tavus
 */
export async function deleteTavusVideo(videoId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const tavusApiKey = import.meta.env.VITE_TAVUS_API_KEY;
    
    if (!tavusApiKey) {
      return { success: false, error: 'TAVUS_API_KEY not configured' };
    }

    console.log('DEBUG: Deleting video from Tavus:', videoId);

    const response = await fetch(`https://tavusapi.com/v2/videos/${videoId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': tavusApiKey,
      },
    });

    if (!response.ok) {
      const errorMessage = `Failed to delete video from Tavus (${response.status}): ${response.statusText}`;
      console.error(errorMessage);
      return { success: false, error: errorMessage };
    }

    console.log('DEBUG: Successfully deleted video from Tavus:', videoId);
    return { success: true };

  } catch (error) {
    console.error('Error deleting video from Tavus:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Delete a video from both database and Tavus
 */
export async function deletePersonaVideo(
  databaseId: string, 
  tavusVideoId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get session to check authentication
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user;
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    console.log('DEBUG: Deleting persona video:', { databaseId, tavusVideoId });

    // Get the video record first to ensure we have the Tavus video ID
    const { data: videoRecord, error: fetchError } = await supabase
      .from('persona_content')
      .select('*')
      .eq('id', databaseId)
      .eq('content_type', 'video')
      .single();

    if (fetchError || !videoRecord) {
      return { success: false, error: 'Video not found in database' };
    }

    // Check if user owns this video (through persona ownership)
    const { data: persona, error: personaError } = await supabase
      .from('personas')
      .select('user_id')
      .eq('id', videoRecord.persona_id)
      .single();

    if (personaError || !persona || persona.user_id !== user.id) {
      return { success: false, error: 'Unauthorized to delete this video' };
    }

    // Get Tavus video ID from metadata if not provided
    const videoIdToDelete = tavusVideoId || videoRecord.metadata?.tavus_video_id;

    // Delete from Tavus first (if we have the video ID)
    if (videoIdToDelete) {
      const tavusResult = await deleteTavusVideo(videoIdToDelete);
      if (!tavusResult.success) {
        // Log the error but continue with database deletion
        console.warn('Failed to delete from Tavus, but continuing with database deletion:', tavusResult.error);
      }
    } else {
      console.warn('No Tavus video ID found, skipping Tavus deletion');
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('persona_content')
      .delete()
      .eq('id', databaseId);

    if (deleteError) {
      console.error('Failed to delete video from database:', deleteError);
      return { success: false, error: deleteError.message };
    }

    console.log('DEBUG: Successfully deleted video from database:', databaseId);
    return { success: true };

  } catch (error) {
    console.error('Error deleting persona video:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

