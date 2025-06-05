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
    const { data: functionData, error: invokeError } = await supabase.functions.invoke(
      'create-replica',
      {
        body: JSON.stringify(data),
      }
    );

    if (invokeError) {
      throw new Error(`Failed to invoke replica creation function: ${invokeError.message}`);
    }

    if (functionData.error) {
      throw new Error(functionData.error);
    }

    return functionData;
  } catch (error) {
    console.error('Error creating Tavus replica:', error);
    // Ensure the response shape matches TavusReplicaResponse even on error
    return { replica_id: null, status: 'failed', error: error instanceof Error ? error.message : String(error) };
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

    const { data: functionData, error: invokeError } = await supabase.functions.invoke(
      'create-video',
      {
        body: JSON.stringify({
          personaId: data.personaId,
          script: data.script, // Pass script if provided
          audio_url: data.audio_url, // Pass audio_url if provided
        }),
      }
    );

    if (invokeError) {
      throw new Error(`Failed to invoke video generation function: ${invokeError.message}`);
    }

    // The edge function now returns a consistent structure, check for its internal error field
    if (functionData.error) {
      throw new Error(functionData.error);
    }

    return functionData;
  } catch (error) {
    console.error('Error generating Tavus video:', error);
    // Ensure the response shape matches TavusVideoResponse even on error
    return { id: null, status: 'failed', error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Checks the status of a Tavus video generation process.
 */
export async function checkTavusVideoStatus(videoId: string): Promise<TavusVideoResponse> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'video-status', // Assuming this function exists and takes videoId
      {
        // Adjust body/query based on how 'video-status' function is implemented
        query: { id: videoId },
      }
    );

    if (error) {
      throw new Error(`Failed to invoke video status function: ${error.message}`);
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('Error checking Tavus video status:', error);
    return { id: videoId, status: 'unknown', error: error instanceof Error ? error.message : String(error) };
  }
}

