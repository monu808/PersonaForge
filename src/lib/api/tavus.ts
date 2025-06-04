import { supabase } from '../auth';

export interface TavusVideoRequest {
  personaId: string;
  script: string;
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
    throw error;
  }
}

export async function generateTavusVideo(data: TavusVideoRequest): Promise<TavusVideoResponse> {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      throw new Error('User not authenticated');
    }

    const { data: functionData, error: invokeError } = await supabase.functions.invoke<TavusVideoResponse>(
      'create-video',
      {
        body: {
          personaId: data.personaId,
          script: data.script,
        },
      }
    );

    if (invokeError) {
      throw new Error(`Failed to generate video: ${invokeError.message}`);
    }

    if (!functionData) {
      throw new Error('No response from video generation function');
    }

    if (functionData.error) {
      throw new Error(functionData.error);
    }

    return functionData;
  } catch (error) {
    console.error('Error generating Tavus video:', error);
    throw error;
  }
}

export async function checkTavusVideoStatus(videoId: string): Promise<TavusVideoResponse> {
  try {
    const { data, error } = await supabase.functions.invoke<TavusVideoResponse>(
      'video-status',
      {
        body: null,
        query: { id: videoId },
      }
    );

    if (error) {
      throw new Error('Failed to check video status');
    }

    if (!data) {
      throw new Error('No response from video status function');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data;
  } catch (error) {
    console.error('Error checking Tavus video status:', error);
    throw error;
  }
}