import { supabase } from '../auth';

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
    const { data, error } = await supabase
      .from('persona_content')
      .select('*')
      .eq('persona_id', personaId)
      .eq('content_type', 'video')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

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

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
    }

    return {
      id: responseData.video_id || videoId,
      status: responseData.status,
      url: responseData.download_url,
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

    let audioUrl = request.audioUrl;
    
    // If audio file is provided, upload it to storage first
    if (request.audioFile && !audioUrl) {
      const fileName = `${crypto.randomUUID()}.${request.audioFile.name.split('.').pop()}`;
      
      const { error: uploadError } = await supabase.storage
        .from('persona-content')
        .upload(`audio/${fileName}`, request.audioFile, {
          contentType: request.audioFile.type
        });

      if (uploadError) {
        throw new Error(`Failed to upload audio file: ${uploadError.message}`);
      }

      // Get the public URL for the uploaded audio
      const { data: urlData } = supabase.storage
        .from('persona-content')
        .getPublicUrl(`audio/${fileName}`);
      
      audioUrl = urlData.publicUrl;
    }

    // Call Tavus API directly
    const tavusApiKey = import.meta.env.VITE_TAVUS_API_KEY;
    
    if (!tavusApiKey) {
      throw new Error('TAVUS_API_KEY not configured');
    }

    const requestBody: any = {
      replica_id: request.personaId,
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
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
    }

    // Store the video metadata in the database
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
          user_id: user.id,
        },
        user_id: user.id,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Failed to store video metadata:', dbError);
      // Don't throw here as the video was created successfully
    }

    return { 
      data: {
        id: responseData.video_id,
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

