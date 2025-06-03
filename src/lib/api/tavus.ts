import { supabase } from '../auth';

export interface TavusVideoRequest {
  personaId: string;
  script: string;
}

export interface TavusVideoResponse {
  id: string;
  status: string;
  url?: string;
  error?: string;
}

export async function generateTavusVideo(data: TavusVideoRequest): Promise<TavusVideoResponse> {
  try {
    const { data: functionData, error } = await supabase.functions.invoke('create-video', {
      body: JSON.stringify(data),
    });

    if (error) {
      throw new Error(error.message);
    }

    // Store video metadata in persona_content table
    const { error: dbError } = await supabase
      .from('persona_content')
      .insert({
        persona_id: data.personaId,
        content_type: 'video',
        content: data.script,
        metadata: {
          tavus_video_id: functionData.id,
          status: functionData.status,
        },
      });

    if (dbError) {
      throw new Error(dbError.message);
    }

    return functionData;
  } catch (error) {
    console.error('Error generating Tavus video:', error);
    throw error;
  }
}